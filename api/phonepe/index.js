import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── PhonePe v2 Config ───────────────────────────────────────────────────────
const CLIENT_ID      = process.env.PHONEPE_CLIENT_ID;
const CLIENT_SECRET  = process.env.PHONEPE_CLIENT_SECRET;
const CLIENT_VERSION = parseInt(process.env.PHONEPE_CLIENT_VERSION || '1', 10);
const PHONEPE_ENV    = process.env.PHONEPE_ENV || 'UAT';   // 'UAT' or 'PROD'

// Base URLs
const AUTH_URL = PHONEPE_ENV === 'PROD'
  ? 'https://api.phonepe.com/apis/identity-manager/v1/oauth/token'
  : 'https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token';

const PG_BASE = PHONEPE_ENV === 'PROD'
  ? 'https://api.phonepe.com/apis/pg'
  : 'https://api-preprod.phonepe.com/apis/pg-sandbox';

// In-memory token cache (reset on cold start — fine for serverless)
let cachedToken    = null;
let tokenExpiresAt = 0;

// ─── Helper: Get / refresh OAuth access token ────────────────────────────────
async function getAccessToken() {
  const now = Date.now();
  if (cachedToken && now < tokenExpiresAt - 30_000) {
    return cachedToken; // still valid (with 30 s buffer)
  }

  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error('PhonePe credentials not configured (PHONEPE_CLIENT_ID / PHONEPE_CLIENT_SECRET missing)');
  }

  const params = new URLSearchParams({
    client_id:      CLIENT_ID,
    client_version: String(CLIENT_VERSION),
    client_secret:  CLIENT_SECRET,
    grant_type:     'client_credentials',
  });

  const resp = await fetch(AUTH_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    params.toString(),
  });

  const text = await resp.text();
  if (!resp.ok) {
    console.error('PhonePe Auth error:', text);
    throw new Error(`Failed to get PhonePe token: ${text}`);
  }

  const json = JSON.parse(text);
  cachedToken    = json.access_token;
  // expires_at is Unix seconds; fall back to 10 min if missing
  tokenExpiresAt = json.expires_at
    ? json.expires_at * 1000
    : now + 10 * 60 * 1000;

  console.log('✅ PhonePe access token obtained');
  return cachedToken;
}

// ─── POST /api/phonepe/qr  — Generate Dynamic QR Code ──────────────────────
app.post('/api/phonepe/qr', async (req, res) => {
  try {
    const { amount, transactionId, userId } = req.body;

    if (!amount || !transactionId || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const token = await getAccessToken();

    // Payload for Dynamic QR v2
    const payload = {
      merchantOrderId: transactionId,
      amount: Math.round(amount * 100),
      expireAfter: 1800,
      paymentFlow: {
        type: 'PG_QR_GEN',
        message: 'Scan to pay for your sneakers'
      },
    };

    const resp = await fetch(`${PG_BASE}/checkout/v2/pay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `O-Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const text = await resp.text();
    let responseData;
    try { 
      responseData = JSON.parse(text); 
    } catch { 
      console.error('❌ Failed to parse PhonePe response:', text);
      return res.status(502).json({ error: 'Invalid response from PhonePe' }); 
    }

    console.log('🔍 PhonePe /qr raw response:', JSON.stringify(responseData, null, 2));

    // In PhonePe v2, the result is usually in data.data or data.qrString depending on exact flow
    const qrString = responseData.qrString || (responseData.data && responseData.data.qrString);
    const orderId  = responseData.orderId  || (responseData.data && responseData.data.merchantOrderId);

    if (qrString) {
      console.log('✅ QR String generated successfully');
      return res.json({ 
        success: true, 
        qrString,
        orderId 
      });
    }

    const errorMsg = responseData.message || (responseData.data && responseData.data.message) || 'Failed to generate QR';
    console.error('❌ PhonePe QR Generation Error:', errorMsg);
    return res.status(500).json({ error: errorMsg, details: responseData });
  } catch (err) {
    console.error('PhonePe /qr error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/phonepe/pay  — Initiate Standard Checkout ─────────────────────
app.post('/api/phonepe/pay', async (req, res) => {
  try {
    const { amount, transactionId, userId, mobileNumber } = req.body;

    if (!amount || !transactionId || !userId) {
      return res.status(400).json({ error: 'Missing required fields: amount, transactionId, userId' });
    }

    const token  = await getAccessToken();
    const origin = req.headers.origin
      || (req.headers.referer ? new URL(req.headers.referer).origin : 'https://flexthekicks.in');

    // Payload for Standard Checkout v2
    const payload = {
      merchantOrderId:  transactionId,
      amount:           Math.round(amount * 100),  // paise
      expireAfter:      1800,                      // 30 min
      metaInfo: {
        udf1: userId,
        udf2: mobileNumber || '',
      },
      paymentFlow: {
        type: 'PG_CHECKOUT',
        message: 'Flex The Kicks — Secure Payment',
        merchantUrls: {
          redirectUrl: `${origin}/payment-success?id=${transactionId}`,
        },
      },
    };

    const resp = await fetch(`${PG_BASE}/checkout/v2/pay`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `O-Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const text = await resp.text();
    let data;
    try   { data = JSON.parse(text); }
    catch { console.error('PhonePe non-JSON response:', text.substring(0, 400)); return res.status(502).json({ error: 'Invalid response from PhonePe' }); }

    console.log('PhonePe /pay response:', JSON.stringify(data));

    // v2 response shape: { orderId, state, redirectUrl, checkoutPageUrl, … }
    const redirectUrl = data.redirectUrl || data.checkoutPageUrl;
    if (redirectUrl) {
      return res.json({ success: true, url: redirectUrl, orderId: data.orderId });
    }

    return res.status(500).json({ error: data.message || 'Failed to initiate payment', details: data });
  } catch (err) {
    console.error('PhonePe /pay error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// ─── GET /api/phonepe/status/:transactionId  — Check order status ─────────────
app.get('/api/phonepe/status/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;
    const token = await getAccessToken();

    const resp = await fetch(`${PG_BASE}/checkout/v2/order/${transactionId}/status`, {
      method:  'GET',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `O-Bearer ${token}`,
      },
    });

    const text = await resp.text();
    let data;
    try   { data = JSON.parse(text); }
    catch { console.error('PhonePe status non-JSON:', text.substring(0, 400)); return res.status(502).json({ error: 'Invalid response from PhonePe' }); }

    console.log('PhonePe status response:', JSON.stringify(data));

    // v2 states: COMPLETED | FAILED | PENDING | CANCELLED
    const state = (data.state || '').toUpperCase();
    if (state === 'COMPLETED') {
      return res.json({ success: true, status: 'COMPLETED', data });
    } else if (state === 'PENDING') {
      return res.json({ success: true, status: 'PENDING', data });
    } else {
      return res.json({ success: false, status: state || 'FAILED', data });
    }
  } catch (err) {
    console.error('PhonePe status error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// ─── POST /api/phonepe/callback  — Server-to-server webhook ──────────────────
app.post('/api/phonepe/callback', (req, res) => {
  try {
    console.log('PhonePe callback:', JSON.stringify(req.body));
    // TODO: validate X-PHONEPE-SIGNATURE header in production
    return res.json({ success: true });
  } catch (err) {
    console.error('Callback error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default app;
