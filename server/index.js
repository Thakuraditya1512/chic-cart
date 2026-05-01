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

// CORS
const allowedOrigins = [
  'http://localhost:8080',
  'http://localhost:3000',
  'https://www.flexthekicks.in',
  'https://flexthekicks.in',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    callback(null, true);
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// ─── STATIC FILE SERVING ───────────────────────────────────────────────────
const distPath = path.resolve(__dirname, '../dist');
app.use(express.static(distPath));

// OTP Store
const otpStore = new Map();

// SMTP Transporter
const transporter = nodemailer.createTransport({
  host: 'smtpout.secureserver.net',
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER || 'otp@flexthekicks.in',
    pass: process.env.SMTP_PASS,
  },
  tls: { rejectUnauthorized: false }
});

function generateOTP() { return Math.floor(100000 + Math.random() * 900000).toString(); }
function isValidEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }

// Email Templates (Restoring full templates)
function createOTPemail(otp) {
  return `<!DOCTYPE html><html><body style="font-family: sans-serif; text-align: center; padding: 40px; background: #f8f9fa;">
    <h1 style="color: #000;">FLEX THE KICKS</h1>
    <p>Your verification code is:</p>
    <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; padding: 20px; background: #eee; border-radius: 8px; display: inline-block; margin: 20px 0;">${otp}</div>
    <p style="color: #999;">Expires in 10 minutes</p>
  </body></html>`;
}

function createWelcomeEmail(email) {
  return `<!DOCTYPE html><html><body style="font-family: sans-serif; text-align: center; padding: 40px;">
    <h1>Welcome to the Family! 🎉</h1>
    <p>You're now subscribed to Flex The Kicks newsletter.</p>
    <a href="https://flexthekicks.in" style="display: inline-block; background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 50px; margin-top: 20px;">Shop Now</a>
  </body></html>`;
}

function createOrderConfirmationEmail(order, displayId) {
  const itemsHtml = order.items.map(item => `
    <div style="margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 10px;">
      <strong>${item.productName}</strong> (Size: ${item.size}) x ${item.quantity} - ₹${item.price.toLocaleString()}
    </div>
  `).join('');
  return `<!DOCTYPE html><html><body>
    <h1>Order Confirmed! #${displayId}</h1>
    <p>Hi ${order.customerName}, thanks for your order.</p>
    <div>${itemsHtml}</div>
    <p><strong>Total: ₹${order.total.toLocaleString()}</strong></p>
  </body></html>`;
}

function createInvoiceEmail(order, displayId) {
  return `<!DOCTYPE html><html><body><h1>Invoice #${displayId}</h1><p>Order Total: ₹${order.total.toLocaleString()}</p></body></html>`;
}

// Newsletter API
app.post('/api/newsletter', async (req, res) => {
  try {
    const { email, action, otp, orderDetails } = req.body;
    if (!isValidEmail(email)) return res.status(400).json({ error: 'Invalid email' });

    if (action === 'send-otp') {
      const genOtp = generateOTP();
      otpStore.set(email, { otp: genOtp, expires: Date.now() + 10 * 60 * 1000 });
      await transporter.sendMail({
        from: `"Flex The Kicks" <${process.env.SMTP_USER || 'otp@flexthekicks.in'}>`,
        to: email,
        subject: 'Verify Your Newsletter Subscription',
        html: createOTPemail(genOtp)
      });
      return res.json({ success: true });
    } else if (action === 'verify-otp') {
      const stored = otpStore.get(email);
      if (!stored || stored.otp !== otp || Date.now() > stored.expires) return res.status(400).json({ error: 'Invalid OTP' });
      otpStore.delete(email);
      await transporter.sendMail({
        from: `"Flex The Kicks" <${process.env.SMTP_USER || 'otp@flexthekicks.in'}>`,
        to: email,
        subject: 'Welcome to Flex The Kicks!',
        html: createWelcomeEmail(email)
      });
      return res.json({ success: true });
    } else if (action === 'send-order-confirmation') {
       const displayId = orderDetails.transactionId ? orderDetails.transactionId.slice(-6).toUpperCase() : 'NEW';
       await transporter.sendMail({
         from: `"Flex The Kicks" <${process.env.SMTP_USER || 'otp@flexthekicks.in'}>`,
         to: email,
         subject: `Order Confirmed: #${displayId}`,
         html: createOrderConfirmationEmail(orderDetails, displayId)
       });
       return res.json({ success: true });
    }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PhonePe Endpoints
const PHONEPE_CLIENT_ID = process.env.PHONEPE_CLIENT_ID;
const PHONEPE_CLIENT_SECRET = process.env.PHONEPE_CLIENT_SECRET;
const PHONEPE_ENV = process.env.PHONEPE_ENV || 'UAT';
const PHONEPE_AUTH_URL = PHONEPE_ENV === 'PROD' ? 'https://api.phonepe.com/apis/identity-manager/v1/oauth/token' : 'https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token';
const PHONEPE_PG_BASE = PHONEPE_ENV === 'PROD' ? 'https://api.phonepe.com/apis/pg' : 'https://api-preprod.phonepe.com/apis/pg-sandbox';

let _token = null;
let _expiry = 0;

async function getAuth() {
  if (_token && Date.now() < _expiry - 30000) return _token;
  const resp = await fetch(PHONEPE_AUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: PHONEPE_CLIENT_ID,
      client_version: '1',
      client_secret: PHONEPE_CLIENT_SECRET,
      grant_type: 'client_credentials'
    })
  });
  const data = await resp.json();
  _token = data.access_token;
  _expiry = data.expires_at ? data.expires_at * 1000 : Date.now() + 600000;
  return _token;
}

app.post('/api/phonepe/qr', async (req, res) => {
  try {
    const token = await getAuth();
    const { amount, transactionId, userId } = req.body;
    const resp = await fetch(`${PHONEPE_PG_BASE}/checkout/v2/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `O-Bearer ${token}` },
      body: JSON.stringify({
        merchantId: PHONEPE_CLIENT_ID,
        merchantOrderId: transactionId,
        merchantUserId: userId,
        amount: Math.round(amount * 100),
        expireAfter: 1800,
        paymentFlow: { type: 'PG_QR_GEN', message: 'Pay for your kicks' }
      })
    });
    const data = await resp.json();
    const qrString = data.qrString || (data.data && data.data.qrString);
    if (qrString) return res.json({ success: true, qrString });
    res.status(500).json({ error: 'QR Failed', details: data });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/phonepe/status/:id', async (req, res) => {
  try {
    const token = await getAuth();
    const resp = await fetch(`${PHONEPE_PG_BASE}/checkout/v2/order/${req.params.id}/status`, {
      headers: { 'Authorization': `O-Bearer ${token}` }
    });
    const data = await resp.json();
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// SPA Routing Fallback
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api/')) {
    res.sendFile(path.join(distPath, 'index.html'));
  } else {
    res.status(404).json({ error: 'API route not found' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
