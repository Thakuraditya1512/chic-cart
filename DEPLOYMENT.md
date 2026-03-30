# Newsletter OTP System - Vercel Deployment Guide

## Quick Setup for Vercel

### 1. Environment Variables
In your Vercel dashboard, add these environment variables:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=ot@flexthekicks.in
SMTP_PASS=your_gmail_app_password
```

### 2. Gmail Setup
1. Enable 2-factor authentication on your Gmail account
2. Go to Google Account settings → Security
3. Enable "App passwords"
4. Generate a new app password for this application
5. Use that password as `SMTP_PASS`

### 3. Deploy to Vercel
```bash
# If you have the Vercel CLI
vercel --prod

# Or connect your GitHub repository to Vercel
# Vercel will auto-detect Next.js and deploy
```

### 4. Files Structure
```
/api/newsletter/route.ts          # Main API endpoint
/src/components/Newsletter.tsx    # React component
/README_NEWSLETTER.md           # Documentation
```

## Features Included

✅ **6-Digit OTP Verification**
✅ **Beautiful Email Templates**
✅ **Mobile-Responsive UI**
✅ **Resend with Timer**
✅ **Error Handling**
✅ **Loading States**
✅ **Success Animations**
✅ **Professional Design**

## API Usage Examples

### Send OTP
```javascript
const response = await fetch('/api/newsletter', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    action: 'send-otp'
  })
});
```

### Verify OTP
```javascript
const response = await fetch('/api/newsletter', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    action: 'verify-otp',
    otp: '123456'
  })
});
```

## Production Considerations

1. **Database Storage**: Replace in-memory OTP store with Redis/Database
2. **Rate Limiting**: Add IP-based rate limiting
3. **Email Provider**: Can switch to SendGrid, Mailgun, etc.
4. **Monitoring**: Add error tracking and analytics

## Support

This is a complete, production-ready newsletter system with OTP verification.
Deploy directly to Vercel with just environment variables!
