import express from 'express';
import nodemailer from 'nodemailer';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.API_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Store OTPs in memory (in production, use Redis or database)
const otpStore = new Map();

// Configure nodemailer transporter for GoDaddy
const transporter = nodemailer.createTransport({
  host: 'smtpout.secureserver.net',  // GoDaddy SMTP server
  port: 465,  // SSL port for GoDaddy
  secure: true,  // Use SSL
  auth: {
    user: 'otp@flexthekicks.in',
    pass: 'Thakur@1476',  // Hardcoded password as requested
  },
});

// Verify SMTP connection
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ SMTP Connection Error:', error);
  } else {
    console.log('✅ SMTP Server is ready to send emails');
  }
});

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Newsletter API endpoint
app.post('/api/newsletter', async (req, res) => {
  try {
    const { email, action, otp } = req.body;

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    if (action === 'send-otp') {
      const generatedOtp = generateOTP();
      const expires = Date.now() + 10 * 60 * 1000; // 10 minutes
      
      // Store OTP
      otpStore.set(email, { otp: generatedOtp, expires });

      // Send email
      const mailOptions = {
        from: `"Flex The Kicks" <${process.env.SMTP_USER || 'otp@flexthekicks.in'}>`,
        to: email,
        subject: 'Verify Your Newsletter Subscription',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Flex The Kicks - Email Verification</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background-color: #f8f9fa;
                margin: 0;
                padding: 20px;
                color: #333;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                background: white;
                border-radius: 16px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.08);
                overflow: hidden;
              }
              .header {
                background: linear-gradient(135deg, #000 0%, #1a1a1a 100%);
                padding: 40px 30px;
                text-align: center;
              }
              .logo {
                font-size: 24px;
                font-weight: 800;
                color: white;
                letter-spacing: -0.5px;
                margin-bottom: 8px;
              }
              .tagline {
                color: #999;
                font-size: 14px;
                margin: 0;
              }
              .content {
                padding: 40px 30px;
              }
              .otp-container {
                background: #f8f9fa;
                border-radius: 12px;
                padding: 30px;
                text-align: center;
                margin: 30px 0;
              }
              .otp {
                font-size: 36px;
                font-weight: 700;
                letter-spacing: 8px;
                color: #000;
                margin: 0;
                background: white;
                border-radius: 8px;
                padding: 20px;
                border: 2px solid #e9ecef;
                display: inline-block;
              }
              .info {
                color: #666;
                font-size: 14px;
                margin-top: 20px;
                line-height: 1.6;
              }
              .footer {
                background: #f8f9fa;
                padding: 30px;
                text-align: center;
                border-top: 1px solid #e9ecef;
              }
              .footer-text {
                color: #999;
                font-size: 12px;
                margin: 0;
              }
              .brand-name {
                font-weight: 600;
                color: #000;
              }
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
                <p style="color: #666; margin-bottom: 30px;">Thanks for subscribing to our newsletter! Please use the verification code below to confirm your email address:</p>
                
                <div class="otp-container">
                  <p class="otp">${generatedOtp}</p>
                </div>
                
                <div class="info">
                  <p><strong>This code will expire in 10 minutes.</strong></p>
                  <p style="margin-top: 10px;">If you didn't request this subscription, you can safely ignore this email.</p>
                </div>
              </div>
              
              <div class="footer">
                <p class="footer-text">
                  © 2024 <span class="brand-name">Flex The Kicks</span>. All rights reserved.<br>
                  Premium sneakers & streetwear delivered to your doorstep.
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

      await transporter.sendMail(mailOptions);

      return res.json({
        success: true,
        message: 'Verification code sent to your email',
      });

    } else if (action === 'verify-otp') {
      const storedData = otpStore.get(email);
      
      if (!storedData) {
        return res.status(400).json({ error: 'No verification code found. Please request a new one.' });
      }

      if (Date.now() > storedData.expires) {
        otpStore.delete(email);
        return res.status(400).json({ error: 'Verification code expired. Please request a new one.' });
      }

      if (storedData.otp !== otp) {
        return res.status(400).json({ error: 'Invalid verification code' });
      }

      // OTP is valid, remove it from store
      otpStore.delete(email);

      // Send confirmation email
      const confirmMailOptions = {
        from: `"Flex The Kicks" <${process.env.SMTP_USER || 'ot@flexthekicks.in'}>`,
        to: email,
        subject: 'Welcome to Flex The Kicks Newsletter! 🎉',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to Flex The Kicks</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background-color: #f8f9fa;
                margin: 0;
                padding: 20px;
                color: #333;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                background: white;
                border-radius: 16px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.08);
                overflow: hidden;
              }
              .header {
                background: linear-gradient(135deg, #000 0%, #1a1a1a 100%);
                padding: 40px 30px;
                text-align: center;
              }
              .logo {
                font-size: 24px;
                font-weight: 800;
                color: white;
                letter-spacing: -0.5px;
                margin-bottom: 8px;
              }
              .tagline {
                color: #999;
                font-size: 14px;
                margin: 0;
              }
              .content {
                padding: 40px 30px;
                text-align: center;
              }
              .welcome-icon {
                font-size: 48px;
                margin-bottom: 20px;
              }
              .benefits {
                text-align: left;
                background: #f8f9fa;
                border-radius: 12px;
                padding: 25px;
                margin: 30px 0;
              }
              .benefit {
                display: flex;
                align-items: flex-start;
                margin-bottom: 15px;
                font-size: 14px;
              }
              .benefit:last-child {
                margin-bottom: 0;
              }
              .benefit-icon {
                color: #000;
                margin-right: 12px;
                flex-shrink: 0;
              }
              .cta-button {
                display: inline-block;
                background: #000;
                color: white;
                padding: 16px 32px;
                border-radius: 50px;
                text-decoration: none;
                font-weight: 600;
                font-size: 14px;
                margin: 20px 0;
                transition: all 0.3s ease;
              }
              .footer {
                background: #f8f9fa;
                padding: 30px;
                text-align: center;
                border-top: 1px solid #e9ecef;
              }
              .footer-text {
                color: #999;
                font-size: 12px;
                margin: 0;
              }
              .brand-name {
                font-weight: 600;
                color: #000;
              }
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
                <p style="color: #666; font-size: 16px; margin-bottom: 30px;">You're now subscribed to exclusive drops, restocks, and special deals.</p>
                
                <div class="benefits">
                  <div class="benefit">
                    <span class="benefit-icon">👟</span>
                    <div>
                      <strong>Early Access</strong><br>
                      Be the first to know about new releases and limited edition drops
                    </div>
                  </div>
                  <div class="benefit">
                    <span class="benefit-icon">🔔</span>
                    <div>
                      <strong>Restock Alerts</strong><br>
                      Never miss out when your favorite sneakers come back in stock
                    </div>
                  </div>
                  <div class="benefit">
                    <span class="benefit-icon">💎</span>
                    <div>
                      <strong>Exclusive Deals</strong><br>
                      Get subscriber-only discounts and special promotions
                    </div>
                  </div>
                </div>
                
                <a href="https://flexthekicks.in" class="cta-button">Shop Now</a>
                
                <p style="color: #999; font-size: 14px; margin-top: 30px;">
                  Keep an eye on your inbox for our latest drops and exclusive offers!
                </p>
              </div>
              
              <div class="footer">
                <p class="footer-text">
                  © 2024 <span class="brand-name">Flex The Kicks</span>. All rights reserved.<br>
                  Premium sneakers & streetwear delivered to your doorstep.
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

      await transporter.sendMail(confirmMailOptions);

      return res.json({
        success: true,
        message: 'Email verified successfully! Welcome to our newsletter.',
      });
    }

    return res.status(400).json({ error: 'Invalid action' });

  } catch (error) {
    console.error('Newsletter error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Clean up expired OTPs periodically
setInterval(() => {
  const now = Date.now();
  for (const [email, data] of otpStore.entries()) {
    if (now > data.expires) {
      otpStore.delete(email);
    }
  }
}, 5 * 60 * 1000); // Clean every 5 minutes

app.listen(PORT, () => {
  console.log(`🚀 Newsletter API server running on http://localhost:${PORT}`);
  console.log(`📧 SMTP configured for: ${process.env.SMTP_USER || 'ot@flexthekicks.in'}`);
});

export default app;
