# 🎨 Deploy Newsletter API to Render

## Quick Deploy Steps

### 1. Prepare Your Server Folder
Make sure these files exist in `c:\Users\hp\OneDrive\Desktop\updated\chic-cart\server\`:
- `index.js` (main server file)
- `package.json` (dependencies)

### 2. Push to GitHub
```bash
cd c:\Users\hp\OneDrive\Desktop\updated\chic-cart

# Commit server folder
git add server/
git commit -m "Add newsletter API server"
git push origin main
```

### 3. Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Click **"New +"** → **"Web Service"**

### 4. Configure Web Service

**Connect Repository:**
- Select your GitHub repo: `chic-cart`

**Basic Settings:**
```
Name: flexthekicks-newsletter
Region: Oregon (US West)
Branch: main
Runtime: Node
Build Command: npm install
Start Command: node index.js
Plan: Free
```

**Root Directory:**
```
server
```

### 5. Add Environment Variables

Click **"Advanced"** → **"Add Environment Variable"**

Add these 4 variables:

| Key | Value |
|-----|-------|
| `SMTP_USER` | `otp@flexthekicks.in` |
| `SMTP_PASS` | `Thakur@1476` |
| `FRONTEND_URL` | `https://www.flexthekicks.in` |
| `NODE_ENV` | `production` |

### 6. Deploy
Click **"Create Web Service"**

Render will:
1. Build your server (npm install)
2. Start it (node index.js)
3. Give you a URL like `https://flexthekicks-newsletter.onrender.com`

---

## 🔗 Link to Frontend

### Step 1: Get Your Render URL
After deployment, copy your URL:
```
https://flexthekicks-newsletter.onrender.com
```

### Step 2: Update Frontend

**Option A: Environment Variable (Recommended)**
Create `.env.production` in main project:
```
VITE_API_URL=https://flexthekicks-newsletter.onrender.com/api/newsletter
```

**Option B: Direct Edit**
Edit `src/components/Newsletter.tsx` line 39:
```typescript
const API_URL = 'https://flexthekicks-newsletter.onrender.com/api/newsletter';
```

### Step 3: Redeploy Frontend
```bash
vercel --prod
```

---

## ✅ Testing Your Deployment

### Test API Health
```bash
curl https://flexthekicks-newsletter.onrender.com/health
```
Should return: `{"status":"healthy"}`

### Test Newsletter Signup
```bash
curl -X POST https://flexthekicks-newsletter.onrender.com/api/newsletter \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","action":"send-otp"}'
```

---

## 🐛 Troubleshooting

### Issue: "Build Failed"
**Fix**: Check package.json exists in server folder

### Issue: "Application Error"
**Fix**: Check logs in Render dashboard → Logs

### Issue: "CORS Error" in browser
**Fix**: Add your Vercel URL to `FRONTEND_URL` env variable

### Issue: "SMTP Authentication Failed"
**Fix**: Check SMTP_USER and SMTP_PASS are correct

---

## 📊 Render Dashboard

Monitor your service:
- **URL**: https://dashboard.render.com
- **Logs**: Dashboard → Your Service → Logs
- **Metrics**: CPU, Memory usage
- **Settings**: Environment variables, custom domain

---

## 🔄 Auto-Deploy

Render auto-deploys when you push to GitHub:
1. Make changes to server code
2. `git push origin main`
3. Render automatically rebuilds and deploys

---

## 🎯 Final Setup

After deployment, you'll have:

```
Frontend (Vercel):     https://chic-cart.vercel.app
API (Render):          https://flexthekicks-newsletter.onrender.com
Newsletter Endpoint:   https://flexthekicks-newsletter.onrender.com/api/newsletter
```

**Test it**: Go to your Vercel site and try the newsletter signup! 📧
