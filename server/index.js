import express from 'express';
import nodemailer from 'nodemailer';
import cors from 'cors';
import dotenv from 'dotenv';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });


const app = express();
const PORT = process.env.PORT || 3001;

// CORS - Allow your frontend
const allowedOrigins = [
  'http://localhost:8080',
  'http://localhost:3000',
  'https://www.flexthekicks.in',
  'https://flexthekicks.in',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      console.log('Blocked origin:', origin);
    }
    callback(null, true); // Allow all for now, restrict in production
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Store OTPs in memory (use Redis in production)
const otpStore = new Map();

// GoDaddy SMTP Configuration
const transporter = nodemailer.createTransport({
  host: 'smtpout.secureserver.net',
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER || 'otp@flexthekicks.in',
    pass: process.env.SMTP_PASS,
  },
});

// Verify SMTP on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ SMTP Connection Error:', error.message);
  } else {
    console.log('✅ SMTP Server is ready');
  }
});

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'Flex The Kicks Newsletter API',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Keep-alive ping endpoint (prevents Render free tier from sleeping)
app.get('/ping', (req, res) => {
  res.json({ ping: 'pong', time: Date.now() });
});

// Main API endpoint
app.post('/api/newsletter', async (req, res) => {
  try {
    const { email, action, otp } = req.body;
    console.log(`[${new Date().toISOString()}] ${action} request for: ${email}`);

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    if (action === 'send-otp') {
      const generatedOtp = generateOTP();
      const expires = Date.now() + 10 * 60 * 1000;
      
      otpStore.set(email, { otp: generatedOtp, expires });

      const mailOptions = {
        from: `"Flex The Kicks" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Verify Your Newsletter Subscription',
        html: createOTPemail(generatedOtp),
      };

      await transporter.sendMail(mailOptions);
      console.log(`✅ OTP sent to ${email}`);

      return res.json({
        success: true,
        message: 'Verification code sent',
      });

    } else if (action === 'verify-otp') {
      const storedData = otpStore.get(email);
      
      if (!storedData) {
        return res.status(400).json({ error: 'No OTP found' });
      }

      if (Date.now() > storedData.expires) {
        otpStore.delete(email);
        return res.status(400).json({ error: 'OTP expired' });
      }

      if (storedData.otp !== otp) {
        return res.status(400).json({ error: 'Invalid OTP' });
      }

      otpStore.delete(email);

      // Send welcome email
      const welcomeMail = {
        from: `"Flex The Kicks" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Welcome to Flex The Kicks! 🎉',
        html: createWelcomeEmail(),
      };

      await transporter.sendMail(welcomeMail);
      console.log(`✅ User ${email} verified and welcomed`);

      return res.json({ success: true, message: 'Verified!' });
    }

    return res.status(400).json({ error: 'Invalid action' });

  } catch (error) {
    console.error('❌ Error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Email templates
function createOTPemail(otp) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8f9fa; margin: 0; padding: 20px; color: #333; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); overflow: hidden; }
    .header { background: linear-gradient(135deg, #000 0%, #1a1a1a 100%); padding: 40px; text-align: center; }
    .logo { font-size: 24px; font-weight: 800; color: white; letter-spacing: -0.5px; }
    .tagline { color: #999; font-size: 14px; margin: 0; }
    .content { padding: 40px; text-align: center; }
    .otp { font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #000; background: #f8f9fa; border-radius: 12px; padding: 30px; margin: 30px 0; }
    .footer { background: #f8f9fa; padding: 30px; text-align: center; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">FLEX THE KICKS</div>
      <p class="tagline">Never Miss a Drop</p>
    </div>
    <div class="content">
      <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 16px;">Verify Your Email</h1>
      <p style="color: #666;">Use this code to confirm your subscription:</p>
      <div class="otp">${otp}</div>
      <p style="color: #999; font-size: 14px;">Expires in 10 minutes</p>
    </div>
    <div class="footer">© 2024 Flex The Kicks. All rights reserved.</div>
  </div>
</body>
</html>`;
}

function createWelcomeEmail() {
  return `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, sans-serif; background: #f8f9fa; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #000, #1a1a1a); padding: 40px; text-align: center; color: white; }
    .content { padding: 40px; text-align: center; }
    .benefits { background: #f8f9fa; border-radius: 12px; padding: 25px; margin: 30px 0; text-align: left; }
    .cta { display: inline-block; background: #000; color: white; padding: 16px 32px; border-radius: 50px; text-decoration: none; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 24px;">FLEX THE KICKS</h1>
      <p style="margin: 8px 0 0; opacity: 0.7;">Welcome to the family!</p>
    </div>
    <div class="content">
      <div style="font-size: 48px; margin-bottom: 20px;">🎉</div>
      <h2 style="font-size: 28px; margin-bottom: 16px;">You're In!</h2>
      <div class="benefits">
        <div style="margin-bottom: 15px;">👟 <strong>Early Access</strong> - New releases first</div>
        <div style="margin-bottom: 15px;">🔔 <strong>Restock Alerts</strong> - Never miss out</div>
        <div>💎 <strong>Exclusive Deals</strong> - Subscriber specials</div>
      </div>
      <a href="https://flexthekicks.in" class="cta">Shop Now</a>
    </div>
  </div>
</body>
</html>`;
}

// ─── PhonePe v2 OAuth Payment Endpoints ──────────────────────────────────────

const PHONEPE_CLIENT_ID      = process.env.PHONEPE_CLIENT_ID;
const PHONEPE_CLIENT_SECRET  = process.env.PHONEPE_CLIENT_SECRET;
const PHONEPE_CLIENT_VERSION = parseInt(process.env.PHONEPE_CLIENT_VERSION || '1', 10);
const PHONEPE_ENV            = process.env.PHONEPE_ENV || 'UAT';

const PHONEPE_AUTH_URL = PHONEPE_ENV === 'PROD'
  ? 'https://api.phonepe.com/apis/identity-manager/v1/oauth/token'
  : 'https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token';

const PHONEPE_PG_BASE = PHONEPE_ENV === 'PROD'
  ? 'https://api.phonepe.com/apis/pg'
  : 'https://api-preprod.phonepe.com/apis/pg-sandbox';

let _phonePeToken    = null;
let _tokenExpiresAt  = 0;

async function getPhonePeToken() {
  const now = Date.now();
  if (_phonePeToken && now < _tokenExpiresAt - 30_000) return _phonePeToken;

  if (!PHONEPE_CLIENT_ID || !PHONEPE_CLIENT_SECRET) {
    throw new Error('PhonePe credentials not configured');
  }

  const params = new URLSearchParams({
    client_id:      PHONEPE_CLIENT_ID,
    client_version: String(PHONEPE_CLIENT_VERSION),
    client_secret:  PHONEPE_CLIENT_SECRET,
    grant_type:     'client_credentials',
  });

  const resp = await fetch(PHONEPE_AUTH_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    params.toString(),
  });

  const text = await resp.text();
  if (!resp.ok) throw new Error(`PhonePe auth failed: ${text}`);

  const json = JSON.parse(text);
  _phonePeToken   = json.access_token;
  _tokenExpiresAt = json.expires_at ? json.expires_at * 1000 : now + 10 * 60 * 1000;
  console.log('✅ PhonePe token obtained');
  return _phonePeToken;
}

// Generate QR code
app.post('/api/phonepe/qr', async (req, res) => {
  try {
    const { amount, transactionId, userId } = req.body;
    if (!amount || !transactionId || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const token = await getPhonePeToken();
    const payload = {
      merchantOrderId: transactionId,
      amount: Math.round(amount * 100),
      expireAfter: 1800,
      paymentFlow: {
        type: 'PG_QR_GEN',
        message: 'Scan to pay for your sneakers'
      },
    };

    const resp = await fetch(`${PHONEPE_PG_BASE}/checkout/v2/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `O-Bearer ${token}` },
      body: JSON.stringify(payload),
    });

    const text = await resp.text();
    let data;
    try { data = JSON.parse(text); } catch { return res.status(502).json({ error: 'Invalid response from PhonePe' }); }
    console.log('PhonePe qr response:', JSON.stringify(data));

    if (data.qrString) return res.json({ success: true, qrString: data.qrString, orderId: data.orderId });

    return res.status(500).json({ error: data.message || 'Failed to generate QR', details: data });
  } catch (err) {
    console.error('PhonePe /qr error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// Initiate payment
app.post('/api/phonepe/pay', async (req, res) => {
  try {
    const { amount, transactionId, userId, mobileNumber } = req.body;
    if (!amount || !transactionId || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const token  = await getPhonePeToken();
    const origin = req.headers.origin
      || (req.headers.referer ? new URL(req.headers.referer).origin : 'https://flexthekicks.in');

    const payload = {
      merchantOrderId: transactionId,
      amount:          Math.round(amount * 100),
      expireAfter:     1800,
      metaInfo: { udf1: userId, udf2: mobileNumber || '' },
      paymentFlow: {
        type:    'PG_CHECKOUT',
        message: 'Flex The Kicks — Secure Payment',
        merchantUrls: { redirectUrl: `${origin}/payment-success?id=${transactionId}` },
      },
    };

    const resp = await fetch(`${PHONEPE_PG_BASE}/checkout/v2/pay`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `O-Bearer ${token}` },
      body:    JSON.stringify(payload),
    });

    const text = await resp.text();
    let data;
    try { data = JSON.parse(text); } catch { return res.status(502).json({ error: 'Invalid response from PhonePe' }); }
    console.log('PhonePe pay response:', JSON.stringify(data));

    const redirectUrl = data.redirectUrl || data.checkoutPageUrl;
    if (redirectUrl) return res.json({ success: true, url: redirectUrl, orderId: data.orderId });

    return res.status(500).json({ error: data.message || 'Failed to initiate payment', details: data });
  } catch (err) {
    console.error('PhonePe /pay error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// Check order status
app.get('/api/phonepe/status/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;
    const token = await getPhonePeToken();

    const resp = await fetch(`${PHONEPE_PG_BASE}/checkout/v2/order/${transactionId}/status`, {
      headers: { 'Content-Type': 'application/json', 'Authorization': `O-Bearer ${token}` },
    });

    const text = await resp.text();
    let data;
    try { data = JSON.parse(text); } catch { return res.status(502).json({ error: 'Invalid response from PhonePe' }); }
    console.log('PhonePe status response:', JSON.stringify(data));

    const state = (data.state || '').toUpperCase();
    if (state === 'COMPLETED') return res.json({ success: true, status: 'COMPLETED', data });
    if (state === 'PENDING')   return res.json({ success: true, status: 'PENDING', data });
    return res.json({ success: false, status: state || 'FAILED', data });
  } catch (err) {
    console.error('PhonePe status error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// Webhook callback
app.post('/api/phonepe/callback', (req, res) => {
  console.log('PhonePe callback received:', JSON.stringify(req.body));
  return res.json({ success: true });
});

// ─── Cleanup expired OTPs every 5 minutes ─────────────────────────────────────
// Cleanup expired OTPs every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [email, data] of otpStore.entries()) {
    if (now > data.expires) {
      otpStore.delete(email);
    }
  }
}, 5 * 60 * 1000);

app.listen(PORT, () => {
  console.log(`🚀 Newsletter API running on port ${PORT}`);
  console.log(`🔗 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
