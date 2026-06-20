import express from 'express';
import nodemailer from 'nodemailer';
import cors from 'cors';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Store OTPs in memory (use Redis or database in production)
const otpStore = new Map();

// Configure nodemailer transporter for GoDaddy
const transporter = nodemailer.createTransport({
  host: 'smtpout.secureserver.net',
  port: 465,
  secure: true,
  auth: {
    user: 'otp@flexthekicks.in',
    pass: process.env.SMTP_PASS || 'Thakur@1476',
  },
});

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Main API handler
app.post('/api/newsletter', async (req, res) => {
  try {
    const { email, action, otp, orderDetails } = req.body;

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    if (action === 'send-otp') {
      const generatedOtp = generateOTP();
      const expires = Date.now() + 10 * 60 * 1000;
      
      otpStore.set(email, { otp: generatedOtp, expires });

      const mailOptions = {
        from: '"Flex The Kicks" <otp@flexthekicks.in>',
        to: email,
        subject: 'Verify Your Newsletter Subscription',
        html: createEmailTemplate(generatedOtp),
      };

      await transporter.sendMail(mailOptions);

      return res.json({
        success: true,
        message: 'Verification code sent to your email',
      });

    } else if (action === 'verify-otp') {
      const storedData = otpStore.get(email);
      
      if (!storedData) {
        return res.status(400).json({ error: 'No verification code found' });
      }

      if (Date.now() > storedData.expires) {
        otpStore.delete(email);
        return res.status(400).json({ error: 'Verification code expired' });
      }

      if (storedData.otp !== otp) {
        return res.status(400).json({ error: 'Invalid verification code' });
      }

      otpStore.delete(email);

      // Send welcome email
      const confirmMailOptions = {
        from: '"Flex The Kicks" <otp@flexthekicks.in>',
        to: email,
        subject: 'Welcome to Flex The Kicks Newsletter! 🎉',
        html: createWelcomeEmail(),
      };

      await transporter.sendMail(confirmMailOptions);

      return res.json({
        success: true,
        message: 'Email verified successfully!',
      });
    } else if (action === 'send-order-confirmation' || action === 'send-invoice') {
      if (!orderDetails) {
        return res.status(400).json({ error: 'Missing order details' });
      }
      const displayId = orderDetails.transactionId ? orderDetails.transactionId.slice(-6).toUpperCase() : 'NEW';
      const subject = action === 'send-invoice' ? `Invoice for Order #${displayId}` : `Order Confirmation #${displayId}`;
      
      await transporter.sendMail({
        from: '"Flex The Kicks" <otp@flexthekicks.in>',
        to: email,
        subject: subject,
        html: createInvoiceEmail(orderDetails, displayId)
      });
      return res.json({ success: true });
    }

    return res.status(400).json({ error: 'Invalid action' });

  } catch (error) {
    console.error('Newsletter error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Email templates
function createEmailTemplate(otp) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Flex The Kicks - Email Verification</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8f9fa; margin: 0; padding: 20px; color: #333; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); overflow: hidden; }
    .header { background: linear-gradient(135deg, #000 0%, #1a1a1a 100%); padding: 40px 30px; text-align: center; }
    .logo { font-size: 24px; font-weight: 800; color: white; letter-spacing: -0.5px; margin-bottom: 8px; }
    .tagline { color: #999; font-size: 14px; margin: 0; }
    .content { padding: 40px 30px; }
    .otp-container { background: #f8f9fa; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0; }
    .otp { font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #000; margin: 0; background: white; border-radius: 8px; padding: 20px; border: 2px solid #e9ecef; display: inline-block; }
    .info { color: #666; font-size: 14px; margin-top: 20px; line-height: 1.6; }
    .footer { background: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef; }
    .footer-text { color: #999; font-size: 12px; margin: 0; }
    .brand-name { font-weight: 600; color: #000; }
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
      <p style="color: #666; margin-bottom: 30px;">Thanks for subscribing! Use the code below:</p>
      <div class="otp-container">
        <p class="otp">${otp}</p>
      </div>
      <div class="info">
        <p><strong>This code expires in 10 minutes.</strong></p>
      </div>
    </div>
    <div class="footer">
      <p class="footer-text">© 2024 <span class="brand-name">Flex The Kicks</span>. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
}

function createWelcomeEmail() {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Flex The Kicks</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8f9fa; margin: 0; padding: 20px; color: #333; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); overflow: hidden; }
    .header { background: linear-gradient(135deg, #000 0%, #1a1a1a 100%); padding: 40px 30px; text-align: center; }
    .logo { font-size: 24px; font-weight: 800; color: white; letter-spacing: -0.5px; margin-bottom: 8px; }
    .tagline { color: #999; font-size: 14px; margin: 0; }
    .content { padding: 40px 30px; text-align: center; }
    .welcome-icon { font-size: 48px; margin-bottom: 20px; }
    .benefits { text-align: left; background: #f8f9fa; border-radius: 12px; padding: 25px; margin: 30px 0; }
    .benefit { display: flex; align-items: flex-start; margin-bottom: 15px; font-size: 14px; }
    .benefit-icon { color: #000; margin-right: 12px; flex-shrink: 0; }
    .cta-button { display: inline-block; background: #000; color: white; padding: 16px 32px; border-radius: 50px; text-decoration: none; font-weight: 600; font-size: 14px; margin: 20px 0; }
    .footer { background: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef; }
    .footer-text { color: #999; font-size: 12px; margin: 0; }
    .brand-name { font-weight: 600; color: #000; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">FLEX THE KICKS</div>
      <p class="tagline">Never Miss a Drop</p>
    </div>
    <div class="content">
      <div class="welcome-icon">🎉</div>
      <h1 style="font-size: 28px; font-weight: 700; margin-bottom: 16px;">Welcome to the Family!</h1>
      <div class="benefits">
        <div class="benefit"><span class="benefit-icon">👟</span><div><strong>Early Access</strong><br>Be first to know about new releases</div></div>
        <div class="benefit"><span class="benefit-icon">🔔</span><div><strong>Restock Alerts</strong><br>Never miss restocks</div></div>
        <div class="benefit"><span class="benefit-icon">💎</span><div><strong>Exclusive Deals</strong><br>Subscriber-only discounts</div></div>
      </div>
      <a href="https://flexthekicks.in" class="cta-button">Shop Now</a>
    </div>
    <div class="footer">
      <p class="footer-text">© 2024 <span class="brand-name">Flex The Kicks</span>. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
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

// Vercel serverless export
export default app;
