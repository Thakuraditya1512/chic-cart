# 📦 Firebase Storage Setup Guide

If you are seeing `net::ERR_FAILED` or `403 Forbidden` when uploading review images, you need to set up **Security Rules** and **CORS**.

---

## 🔐 Step 1: Set Storage Security Rules

1. Go to **[Firebase Console](https://console.firebase.google.com/)**
2. Select your project: **shoppingshoes-b4f67**
3. Click **"Storage"** in the left sidebar
4. Click the **"Rules"** tab at the top
5. Replace existing rules with these:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /reviews/{userId}/{allPaths=**} {
      // Allow users to upload to their own reviews folder
      allow write: if request.auth != null && request.auth.uid == userId;
      // Allow public read access to see the reviews
      allow read: if true;
    }
  }
}
```
6. Click **"Publish"**

---

## 🌐 Step 2: Fix CORS (Cross-Origin Resource Sharing)

Firebase Storage doesn't allow uploads from web apps by default unless CORS is configured.

### Using Google Cloud Shell (Recommended)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Open **Cloud Shell** (the `>_` icon in the top right)
3. Create a file named `cors.json`:
   ```bash
   echo '[{"origin": ["*"], "method": ["GET", "POST", "PUT", "DELETE", "HEAD"], "maxAgeSeconds": 3600}]' > cors.json
   ```
4. Run this command to apply it to your bucket:
   ```bash
   gsutil cors set cors.json gs://shoppingshoes-b4f67.firebasestorage.app
   ```

---

## 🔍 How to verify
1. Refresh your app
2. Try uploading a review again
3. Check the "Files" tab in Firebase Storage to see if the `reviews/` folder was created.
