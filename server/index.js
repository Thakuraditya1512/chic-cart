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
  const itemsHtml = order.items.map(item => `
    <div style="display: flex; gap: 15px; margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #eee;">
      <img src="${item.image}" alt="${item.productName}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" />
      <div style="flex: 1;">
        <h4 style="margin: 0; font-size: 14px; font-weight: 600; color: #333;">${item.productName}</h4>
        <p style="margin: 5px 0; font-size: 12px; color: #666;">Size: ${item.size || 'N/A'} | Qty: ${item.quantity}</p>
        <p style="margin: 0; font-weight: 700; color: #000;">₹${item.price.toLocaleString()}</p>
      </div>
      <div style="text-align: right;">
        <p style="margin: 0; font-weight: 700; color: #000;">₹${(item.price * item.quantity).toLocaleString()}</p>
      </div>
    </div>
  `).join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
      line-height: 1.6; 
      color: #333; 
      margin: 0; 
      padding: 20px; 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    .container { 
      max-width: 600px; 
      margin: 0 auto; 
      background: white; 
      border-radius: 20px; 
      overflow: hidden; 
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    .header { 
      background: linear-gradient(135deg, #000 0%, #1a1a1a 100%); 
      color: white; 
      padding: 40px 20px; 
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    .header::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/><circle cx="50" cy="10" r="0.5" fill="white" opacity="0.15"/><circle cx="10" cy="50" r="0.5" fill="white" opacity="0.15"/><circle cx="90" cy="30" r="0.5" fill="white" opacity="0.15"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
      opacity: 0.3;
    }
    .logo { font-size: 32px; font-weight: 900; letter-spacing: -1px; margin-bottom: 8px; position: relative; z-index: 1; }
    .tagline { font-size: 14px; opacity: 0.9; margin: 0; position: relative; z-index: 1; }
    .content { padding: 40px 30px; }
    .invoice-header { 
      display: flex; 
      justify-content: space-between; 
      align-items: center; 
      margin-bottom: 30px; 
      padding: 25px; 
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); 
      border-radius: 15px;
      border: 1px solid #dee2e6;
    }
    .invoice-number { 
      font-family: 'Courier New', monospace; 
      background: linear-gradient(135deg, #000, #333); 
      color: white; 
      padding: 12px 20px; 
      border-radius: 10px; 
      font-size: 18px; 
      font-weight: bold;
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    }
    .billing-info { 
      background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%); 
      border-radius: 15px; 
      padding: 25px; 
      margin: 20px 0;
      border: 1px solid #e9ecef;
      box-shadow: 0 2px 10px rgba(0,0,0,0.05);
    }
    .billing-info h3 {
      margin-top: 0;
      color: #000;
      font-size: 16px;
      border-bottom: 2px solid #000;
      padding-bottom: 10px;
      margin-bottom: 15px;
    }
    .summary { 
      background: linear-gradient(135deg, #fff3cd 0%, #fef5e7 100%); 
      border-radius: 15px; 
      padding: 25px; 
      margin-top: 30px;
      border: 1px solid #ffc107;
      box-shadow: 0 4px 15px rgba(255,193,7,0.2);
    }
    .total-row { 
      font-size: 20px; 
      font-weight: 700; 
      border-top: 2px solid #ffc107; 
      padding-top: 15px;
      color: #000;
    }
    .footer { 
      padding: 30px; 
      text-align: center; 
      font-size: 12px; 
      color: #666; 
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      border-top: 1px solid #dee2e6;
    }
    .payment-info {
      background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
      border: 1px solid #28a745;
      border-radius: 15px;
      padding: 20px;
      margin-top: 25px;
      box-shadow: 0 4px 15px rgba(40,167,69,0.2);
    }
    .payment-info h4 {
      margin: 0 0 10px 0;
      color: #155724;
      font-size: 14px;
    }
    .payment-info p {
      margin: 5px 0;
      color: #155724;
      font-size: 12px;
    }
    .watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 120px;
      opacity: 0.05;
      color: #000;
      font-weight: 900;
      pointer-events: none;
      z-index: 0;
    }
    .stamp {
      position: absolute;
      top: 20px;
      right: 20px;
      width: 80px;
      height: 80px;
      border: 3px solid #dc3545;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #dc3545;
      font-weight: 900;
      font-size: 12px;
      text-align: center;
      transform: rotate(-15deg);
      opacity: 0.8;
      z-index: 2;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="watermark">FLEX THE KICKS</div>
      <div class="stamp">PAID</div>
      <h1 class="logo">FLEX THE KICKS</h1>
      <p class="tagline">OFFICIAL INVOICE</p>
    </div>
    <div class="content">
      <div class="invoice-header">
        <div>
          <h3 style="margin: 0; color: #666; font-size: 14px; font-weight: 600;">INVOICE NUMBER</h3>
          <span class="invoice-number">#${displayId}</span>
        </div>
        <div style="text-align: right;">
          <h3 style="margin: 0; color: #666; font-size: 14px; font-weight: 600;">DATE</h3>
          <p style="margin: 5px 0; font-weight: 600; color: #000;">${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
        </div>
      </div>

      <div class="billing-info">
        <h3>BILL TO:</h3>
        <p style="margin: 5px 0; font-weight: 600; color: #000; font-size: 16px;">${order.customerName}</p>
        <p style="margin: 5px 0; color: #333;">${order.email}</p>
        <p style="margin: 5px 0; color: #333;">${order.phone}</p>
        <p style="margin: 5px 0; color: #333;">${order.lane1}, ${order.lane2 || ''}</p>
        <p style="margin: 5px 0; color: #333;">${order.city} - ${order.zipCode}</p>
      </div>

      <h3 style="border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; color: #000;">ORDER ITEMS</h3>
      ${itemsHtml}

      <div class="summary">
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
          <span style="color: #333;">Subtotal</span>
          <span style="color: #000; font-weight: 600;">₹${order.subtotal.toLocaleString()}</span>
        </div>
        ${order.codCharge > 0 ? `
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
          <span style="color: #333;">COD Charges</span>
          <span style="color: #000; font-weight: 600;">₹${order.codCharge.toLocaleString()}</span>
        </div>
        ` : ''}
        ${order.discountAmount > 0 ? `
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px; color: #28a745;">
          <span>Discount (${order.discountPercent}%)</span>
          <span style="color: #28a745; font-weight: 600;">-₹${order.discountAmount.toLocaleString()}</span>
        </div>
        ` : ''}
        <div style="display: flex; justify-content: space-between; total-row;">
          <span>TOTAL PAID</span>
          <span>₹${order.total.toLocaleString()}</span>
        </div>
      </div>

      <div class="payment-info">
        <h4>✓ PAYMENT CONFIRMED</h4>
        <p><strong>Method:</strong> ${order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Online Payment'}</p>
        <p><strong>Status:</strong> ${order.status === 'paid' ? 'Paid' : 'Pending'}</p>
        ${order.transactionId ? `<p><strong>Transaction ID:</strong> ${order.transactionId}</p>` : ''}
        <p><strong>Thank you for your business!</strong></p>
      </div>
    </div>
    <div class="footer">
      <p><strong>Flex The Kicks</strong></p>
      <p>© 2024 Flex The Kicks. All rights reserved.</p>
      <p>Questions? Contact us at support@flexthekicks.in</p>
      <p>This is a computer-generated invoice and does not require a signature.</p>
    </div>
  </div>
</body>
</html>`;
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
      await createInvoiceEmail(orderDetails, displayId);
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
