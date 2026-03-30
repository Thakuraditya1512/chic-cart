# 🚀 Newsletter Deployment Guide

## Quick Deploy to Vercel (Recommended)

### Option 1: One-Click Deploy
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

### Option 2: Manual Deploy

## 📋 Prerequisites
1. [Vercel Account](https://vercel.com/signup)
2. [GitHub Account](https://github.com/join)
3. GoDaddy Email configured

## 🚀 Step-by-Step Deployment

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Add newsletter OTP system"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/chic-cart.git
git push -u origin main
```

### 2. Deploy on Vercel

**Method A: Vercel Dashboard**
1. Go to [vercel.com](https://vercel.com)
2. Click **Add New Project**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add Environment Variables:
   ```
   SMTP_PASS=Thakur@1476
   ```
6. Click **Deploy**

**Method B: Vercel CLI**
```bash
npm i -g vercel
vercel
# Follow prompts
```

### 3. Verify Deployment
- Frontend: `https://www.flexthekicks.in`
- API Test: `https://www.flexthekicks.in/api/health`

## 🔧 Local Development vs Production

### Local Development
```bash
# Terminal 1: Start API server
npm run server
# Runs on http://localhost:3001

# Terminal 2: Start Vite dev server
npm run dev
# Runs on http://localhost:8080
```

### Production (Vercel)
- Both frontend and API deployed together
- API auto-routes via `vercel.json`
- No separate server needed

## 🔐 Environment Variables

Add these in Vercel Dashboard → Settings → Environment Variables:

| Variable | Value |
|----------|-------|
| `SMTP_PASS` | `Thakur@1476` |
| `SMTP_HOST` | `smtpout.secureserver.net` |
| `SMTP_PORT` | `465` |
| `SMTP_USER` | `otp@flexthekicks.in` |

## 📁 Deployment Files Structure

```
chic-cart/
├── api/
│   └── newsletter/
│       └── index.js          # Serverless API function
├── src/
│   └── components/
│       └── Newsletter.tsx      # Frontend component
├── vercel.json                 # Routing config
├── package.json
└── dist/                       # Build output
```

## 🔄 Switching from Local to Production

### Newsletter.tsx automatically handles both:

```typescript
const API_URL = import.meta.env.VITE_API_URL || '/api/newsletter';
```

- **Local**: Set `VITE_API_URL=http://localhost:3001/api/newsletter` in `.env.local`
- **Production**: Uses `/api/newsletter` (relative URL)

## 🛠️ Troubleshooting

### Issue: API 404 Error
**Fix**: Check `vercel.json` rewrites are correct

### Issue: SMTP Authentication Failed
**Fix**: Verify `SMTP_PASS` environment variable is set in Vercel

### Issue: CORS Error
**Fix**: API uses `cors()` middleware - should work automatically

## 📞 Support

For deployment issues:
1. Check Vercel logs: Dashboard → Project → Functions → Logs
2. Test API: `curl https://www.flexthekicks.in/api/health`
3. Check Environment Variables are set

## 🎯 Next Steps

After deployment:
1. ✅ Test newsletter signup on live site
2. ✅ Check email delivery
3. ✅ Verify OTP verification works
4. 🚀 Share your deployed URL!

---

**Your app will be live at**: `https://chic-cart.vercel.app`
**API endpoint**: `https://chic-cart.vercel.app/api/newsletter`
