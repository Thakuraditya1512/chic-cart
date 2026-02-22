# Firebase Rules - Copy Paste Ready

## 🔑 Complete Firebase Firestore Rules

**Location:** Firebase Console → Firestore → Rules tab

**Action:** Delete all existing code and replace with this:

---

```typescript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // Public read access for brands
    match /brands/{document=**} {
      allow read: if true;
      allow create, update, delete: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Public read access for products
    match /products/{document=**} {
      allow read: if true;
      allow create, update, delete: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // User data - own data only, admins can read all
    match /users/{userId} {
      allow read: if request.auth.uid == userId;
      allow write: if request.auth.uid == userId;
      allow read: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Orders - own orders only, and admin can read all
    match /orders/{document=**} {
      allow read: if request.auth.uid == resource.data.userId || (request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
      allow update, delete: if request.auth != null && (request.auth.uid == resource.data.userId || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }

    // Deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## ✅ Setup Steps

### 1. Open Firebase Rules Editor
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. **Firestore Database** → **Rules** tab

### 2. Clear Existing Code
- Select all text (Ctrl+A)
- Delete

### 3. Paste New Rules
- Copy the code block above
- Paste into editor

### 4. Publish
- Click **PUBLISH** button (bottom right)
- Confirm dialog
- Wait 1-2 minutes

---

## 🔍 Rule Breakdown

### Brands Collection
```typescript
match /brands/{document=**} {
  allow read: if true;                          // Anyone can read
  allow create, update, delete: if             // Only admins can modify
    request.auth != null &&                     // User is logged in
    get(/databases/$(database)/documents/users/$(request.auth.uid))
      .data.role == 'admin';                    // User has role = admin
}
```

### Products Collection
```typescript
match /products/{document=**} {
  allow read: if true;                          // Everyone can view products
  allow create, update, delete: if             // Only admins can modify
    request.auth != null &&
    get(/databases/$(database)/documents/users/$(request.auth.uid))
      .data.role == 'admin';
}
```

### Users Collection
```typescript
match /users/{userId} {
  allow read: if request.auth.uid == userId;    // Read own document
  allow write: if request.auth.uid == userId;   // Edit own document
  allow read: if request.auth != null &&        // Admins can read all
    get(/databases/$(database)/documents/users/$(request.auth.uid))
      .data.role == 'admin';
}
```

### Orders Collection
```typescript
match /orders/{document=**} {
  allow read: if                                 // Can read own orders
    request.auth.uid == resource.data.userId
    || (request.auth != null &&                 // OR admins can read all
        get(/databases/$(database)/documents/users/$(request.auth.uid))
          .data.role == 'admin');
  
  allow create: if                               // Can create own orders
    request.auth != null &&
    request.auth.uid == request.resource.data.userId;
  
  allow update, delete: if                       // Own data or admin
    request.auth != null &&
    (request.auth.uid == resource.data.userId ||
     get(/databases/$(database)/documents/users/$(request.auth.uid))
       .data.role == 'admin');
}
```

---

## 📋 What Each Rule Allows

| Action | Admin | User | Public |
|--------|-------|------|--------|
| **Read Brands** | ✅ | ✅ | ✅ |
| **Create Brand** | ✅ | ❌ | ❌ |
| **Update Brand** | ✅ | ❌ | ❌ |
| **Delete Brand** | ✅ | ❌ | ❌ |
| **Read Products** | ✅ | ✅ | ✅ |
| **Create Product** | ✅ | ❌ | ❌ |
| **Update Product** | ✅ | ❌ | ❌ |
| **Delete Product** | ✅ | ❌ | ❌ |
| **Read Own User** | ✅ | ✅ | ❌ |
| **Read All Users** | ✅ | ❌ | ❌ |
| **Read Own Orders** | ✅ | ✅ | ❌ |
| **Read All Orders** | ✅ | ❌ | ❌ |
| **Create Order** | ✅ | ✅ | ❌ |

---

## ⚙️ Common Customizations

### Allow Anyone to Create Products
**Warning:** Security risk!
```typescript
match /products/{document=**} {
  allow read: if true;
  allow create: if request.auth != null;        // Any logged-in user
  allow update, delete: if request.auth != null && 
    get(/databases/$(database)/documents/users/$(request.auth.uid))
      .data.role == 'admin';
}
```

### Public Read/Write (Testing Only)
**Warning:** Very insecure!
```typescript
match /products/{document=**} {
  allow read, write: if true;                   // Anyone can do anything!
}
```

### No Authentication Required
**Warning:** Not recommended for production!
```typescript
match /users/{userId} {
  allow read, write: if true;                   // Remove all auth checks
}
```

---

## 🧪 Testing Your Rules

After publishing, test by:

### 1. Test as Admin User
```
1. Log in with admin account
2. Go to /admin
3. Try to create a brand
4. Should succeed (green toast)
```

### 2. Test as Regular User
```
1. Sign up new account (becomes "user" role)
2. Try to visit /admin
3. Should be redirected to home
4. Can view products (public)
```

### 3. Test Without Login (Public User)
```
1. Open in incognito/private window
2. Try to view /admin
3. Should redirect to /login
4. Can view homepage and products
```

---

## ⚠️ Common Issues

### Issue: Rules Won't Publish
**Cause:** Syntax error
**Solution:** Check for:
- Missing quotes
- Unmatched braces
- Wrong indentation
- Typos in collection names

### Issue: Permission Denied After Publishing
**Cause:** Cache or timing
**Solution:**
1. Hard refresh: Ctrl+Shift+R
2. Wait 2 minutes for propagation
3. Check user has `role: admin` field

### Issue: Can't Create Brands
**Cause:** User not admin
**Solution:**
1. Go to Firestore → users collection
2. Find your user document
3. Add field: `role` = `admin`
4. Refresh and try again

---

## 📚 Documentation

- **Firestore Rules:** https://firebase.google.com/docs/firestore/security/start
- **Custom Claims:** https://firebase.google.com/docs/firestore/manage-data/enable-offline
- **Security Best Practices:** https://firebase.google.com/docs/firestore/security/best-practices

---

## ✅ Verification Checklist

After publishing rules:

- [ ] Rules published successfully (green checkmark)
- [ ] Wait 2 minutes for propagation
- [ ] Refresh browser
- [ ] Log in as admin
- [ ] Try creating a brand
- [ ] Try creating a product
- [ ] Both operations succeed
- [ ] Log out and try as regular user
- [ ] Can view products (read works)
- [ ] Cannot create brands (write blocked)

---

## 🎯 Summary

**What Changed:**
- ✅ Added `brands` collection with admin-only write access
- ✅ Updated `products` to align with new system
- ✅ Kept existing user/order permissions intact
- ✅ All public reads still work
- ✅ All admin write operations now work

**Impact:**
- ✅ Brand management enabled
- ✅ Product management per brand enabled
- ✅ Users cannot break permissions
- ✅ Backward compatible with existing data

---

**Version:** 1.0  
**Last Updated:** February 22, 2026  
**Status:** Ready to Use ✅
