# Newsletter OTP Verification Server

This provides a complete newsletter subscription system with 6-digit OTP verification.

## Environment Variables

Add these to your Vercel environment variables:

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=ot@flexthekicks.in
SMTP_PASS=your_gmail_app_password
```

## API Endpoints

### POST /api/newsletter

#### Send OTP
```json
{
  "email": "user@example.com",
  "action": "send-otp"
}
```

#### Verify OTP
```json
{
  "email": "user@example.com",
  "action": "verify-otp",
  "otp": "123456"
}
```

## Features

- ✅ 6-digit OTP generation
- ✅ Email validation
- ✅ OTP expiration (10 minutes)
- ✅ Resend OTP with timer
- ✅ Beautiful email templates
- ✅ Memory-based OTP storage (for demo)
- ✅ Auto cleanup of expired OTPs
- ✅ Error handling and validation

## Email Templates

### Verification Email
- Modern, responsive design
- Clear OTP display
- Professional branding
- Expiration notice

### Welcome Email
- Success confirmation
- Benefits overview
- Call-to-action
- Brand consistency

## Security Features

- OTP expires in 10 minutes
- Rate limiting via resend timer
- Input validation and sanitization
- Error handling without information leakage

## Deployment

Ready for Vercel deployment with zero configuration needed beyond environment variables.

## Notes

- Uses in-memory OTP storage (upgrade to Redis for production)
- Gmail SMTP configuration (easily switch to other providers)
- TypeScript for type safety
- Next.js 14 API routes
