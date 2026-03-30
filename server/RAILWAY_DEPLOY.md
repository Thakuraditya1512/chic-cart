# 🚂 Deploy Newsletter API to Railway (Recommended)

## Quick Deploy Steps

### 1. Prepare Server Folder
```bash
cd c:\Users\hp\OneDrive\Desktop\updated\chic-cart\server
```

### 2. Create Railway Account
- Go to [railway.app](https://railway.app)
- Sign up with GitHub

### 3. Deploy via Railway CLI
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Deploy
railway up
```

### 4. Add Environment Variables
In Railway Dashboard:
1. Go to your project → Variables
2. Add these:

```
SMTP_USER=otp@flexthekicks.in
SMTP_PASS=Thakur@1476
FRONTEND_URL=https://www.flexthekicks.in
NODE_ENV=production
```

### 5. Get Your API URL
After deployment, Railway gives you a URL like:
```
https://flexthekicks-api.up.railway.app
```

---

## 🎨 Alternative: Deploy to Render

### 1. Go to [render.com](https://render.com)
### 2. Create Web Service
- Connect your GitHub repo
- Root Directory: `server`
- Build Command: `npm install`
- Start Command: `npm start`

### 3. Add Environment Variables
Same as Railway above.

---

## 🔗 Link to Frontend

### Update Frontend Environment Variable

Create `.env.production` in your main project:

```bash
VITE_API_URL=https://your-railway-app.up.railway.app/api/newsletter
```

### Or Update Newsletter.tsx Directly

```typescript
const API_URL = import.meta.env.VITE_API_URL || 'https://your-railway-app.up.railway.app/api/newsletter';
```

---

## 📁 Server Folder Structure

```
server/
├── index.js           # Main server file
├── package.json       # Dependencies
├── .env.example       # Example env file
└── README.md          # This file
```

## 🚀 Deployment Checklist

- [ ] Server deployed on Railway/Render
- [ ] Environment variables set (SMTP_USER, SMTP_PASS)
- [ ] Got the API URL
- [ ] Updated frontend with API URL
- [ ] Tested OTP flow on production

## 🔍 Testing Production API

```bash
# Test if API is live
curl https://your-api.up.railway.app/health

# Test newsletter signup
curl -X POST https://your-api.up.railway.app/api/newsletter \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","action":"send-otp"}'
```

## 🐛 Troubleshooting

**Issue: CORS Error**
Fix: Add your Vercel URL to `FRONTEND_URL` environment variable

**Issue: SMTP Failed**
Fix: Check SMTP_USER and SMTP_PASS are correct

**Issue: Server won't start**
Fix: Check logs in Railway/Render dashboard

---

**Your API will be live at**: `https://xxxx.up.railway.app`
**Test endpoint**: `https://xxxx.up.railway.app/health`
