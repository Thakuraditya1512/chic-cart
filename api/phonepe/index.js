import express from 'express';
import cors from 'cors';
import crypto from 'crypto';

const app = express();

app.use(cors());
app.use(express.json());

// PhonePe Config
const PHONEPE_MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID || 'M221YFW15DBYN_2604241807';
const PHONEPE_SALT_KEY = process.env.PHONEPE_SALT_KEY || 'OGRiMGFhNzUtMTM3OC00NDViLTk0YTQtNmEyMjIxYWM4MzJl';
const PHONEPE_SALT_INDEX = process.env.PHONEPE_SALT_INDEX || '1';
const PHONEPE_ENV = process.env.PHONEPE_ENV || 'UAT';
const PHONEPE_BASE_URL = PHONEPE_ENV === 'UAT'
  ? 'https://api-preprod.phonepe.com/apis/pg-sandbox'
  : 'https://api.phonepe.com/apis/hermes';

// PhonePe Payment Initiation
app.post('/api/phonepe/pay', async (req, res) => {
  try {
    const { amount, transactionId, userId, mobileNumber } = req.body;

    if (!amount || !transactionId || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Determine the frontend origin for redirect
    const origin = req.headers.origin || req.headers.referer?.replace(/\/+$/, '') || 'https://flexthekicks.in';

    const payload = {
      merchantId: PHONEPE_MERCHANT_ID,
      merchantTransactionId: transactionId,
      merchantUserId: userId,
      amount: amount * 100, // PhonePe takes amount in paise
      redirectUrl: `${origin}/payment-success?id=${transactionId}`,
      redirectMode: 'REDIRECT',
      callbackUrl: `${origin}/api/phonepe/callback`,
      mobileNumber: mobileNumber || '9999999999',
      paymentInstrument: {
        type: 'PAY_PAGE'
      }
    };

    const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
    const stringToHash = base64Payload + '/pg/v1/pay' + PHONEPE_SALT_KEY;
    const sha256 = crypto.createHash('sha256').update(stringToHash).digest('hex');
    const checksum = sha256 + '###' + PHONEPE_SALT_INDEX;

    const response = await fetch(`${PHONEPE_BASE_URL}/pg/v1/pay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': checksum,
        'accept': 'application/json'
      },
      body: JSON.stringify({ request: base64Payload })
    });

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      console.error('PhonePe returned non-JSON:', responseText.substring(0, 500));
      return res.status(502).json({ error: 'Invalid response from payment gateway' });
    }

    if (data.success && data.data?.instrumentResponse?.redirectInfo?.url) {
      return res.json({
        success: true,
        url: data.data.instrumentResponse.redirectInfo.url
      });
    } else {
      console.error('PhonePe Error:', data);
      return res.status(500).json({ error: 'Failed to initiate payment', details: data.message || data });
    }
  } catch (error) {
    console.error('Payment initialization error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PhonePe Status Check
app.get('/api/phonepe/status/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;
    const stringToHash = `/pg/v1/status/${PHONEPE_MERCHANT_ID}/${transactionId}${PHONEPE_SALT_KEY}`;
    const sha256 = crypto.createHash('sha256').update(stringToHash).digest('hex');
    const checksum = sha256 + '###' + PHONEPE_SALT_INDEX;

    const response = await fetch(`${PHONEPE_BASE_URL}/pg/v1/status/${PHONEPE_MERCHANT_ID}/${transactionId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': checksum,
        'X-MERCHANT-ID': PHONEPE_MERCHANT_ID,
        'accept': 'application/json'
      }
    });

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      console.error('PhonePe status returned non-JSON:', responseText.substring(0, 500));
      return res.status(502).json({ error: 'Invalid response from payment gateway' });
    }

    if (data.success && data.code === 'PAYMENT_SUCCESS') {
      return res.json({ success: true, status: 'COMPLETED', data: data.data });
    } else if (data.code === 'PAYMENT_PENDING') {
      return res.json({ success: true, status: 'PENDING', data: data.data });
    } else {
      return res.json({ success: false, status: 'FAILED', data: data.data });
    }
  } catch (error) {
    console.error('Status check error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PhonePe Callback (server-to-server)
app.post('/api/phonepe/callback', async (req, res) => {
  try {
    console.log('PhonePe callback received:', JSON.stringify(req.body));
    // Acknowledge the callback
    return res.json({ success: true });
  } catch (error) {
    console.error('Callback error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default app;
