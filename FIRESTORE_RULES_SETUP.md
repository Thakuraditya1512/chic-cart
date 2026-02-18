# Firebase Firestore Security Rules Setup

## The Problem
You're getting **"Missing or insufficient permissions"** error when trying to add products in the Admin panel. This happens because Firestore Security Rules haven't been configured to allow your admin users to write to the database.

---

## Solution: Set Up Firestore Security Rules

### Step 1: Go to Firebase Console
1. Visit [Firebase Console](https://console.firebase.google.com)
2. Select your project: **platform-react-8225a**
3. In left sidebar: **Firestore Database**

### Step 2: Open Security Rules Editor
1. Click the **Rules** tab at the top
2. Replace all existing code with the rules below

### Step 3: Copy These Security Rules

```typescript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // Public read access for products
    match /products/{document=**} {
      allow read: if true;
      allow create, update, delete: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // User data - own data only
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

### Step 4: Publish Rules
1. Click **Publish** button
2. Wait for confirmation (green checkmark)

---

## Step 5: Create Admin User

Now you need to create an admin user in Firestore.

### Option A: Using Firebase Console

1. Go to **Authentication** tab
2. Click **Add user** (if you don't have one)
   - Email: `admin@walkinstyle.com`
   - Password: (your choice)
   - Click **Create user**

3. Go back to **Firestore Database**
4. Click **Start collection**
   - Collection ID: `users`
   - Document ID: (copy the UID of the user you just created)
   - Add field:
     - Field name: `role`
     - Type: `string`
     - Value: `admin`
   - Click **Save**

### Option B: Automated (via App)

1. Sign up a new user in the app (/signup)
2. In Firestore Console, find the user document in `users` collection
3. Add a field: `role: "admin"`

---

## Step 6: Test Admin Panel

1. Sign in with your admin user
2. Go to `/admin`
3. Try adding a product - it should now work!

---

## Understanding the Security Rules

- **products**: Anyone can read, but only admins can create/update/delete
- **users**: Users can only read/write their own data, admins can read all
- **orders**: Users can see their own orders, admins can see all orders
- **All else**: Denied by default (secure)

---

## Troubleshooting

### Still getting "Missing permissions" error?
1. **Check admin role**: Go to Firestore → users collection → your user document → verify `role: admin` exists
2. **Refresh browser**: Ctrl+Shift+R (hard refresh)
3. **Check rules**: In Rules tab, verify all code is properly formatted
4. **Wait 1 minute**: Rules can take a minute to apply

### Can't create admin user?
1. First, create a regular user (sign up in app)
2. Manually add the `role: "admin"` field in Firestore Console
3. Refresh the app and try again

### Rules still showing errors?
1. Click **Validate** button to see specific errors
2. Make sure you copied all the code correctly
3. Check for missing semicolons or brackets

---

## Collections Structure After Setup

Your Firestore should have this structure:

```
firestore/
├── products/
│   ├── {productId}
│   │   ├── name: string
│   │   ├── price: number
│   │   ├── image: string
│   │   └── ...
│   
├── users/
│   ├── {userId}
│   │   ├── email: string
│   │   ├── role: "admin" | "user"
│   │   └── ...
│
└── orders/
    ├── {orderId}
    │   ├── userId: string
    │   ├── items: array
    │   ├── total: number
    │   └── ...
```

---

## Done! 🎉

Your admin panel should now work perfectly with proper security!
