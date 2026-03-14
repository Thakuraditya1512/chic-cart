# Firebase Firestore Security Rules Setup

## The Problem
You need to set up Firestore Security Rules to properly manage access to products, user data, and orders based on user roles (admin vs regular user).

---

## Solution: Set Up Firestore Security Rules

### Step 1: Go to Firebase Console
1. Visit [Firebase Console](https://console.firebase.google.com)
2. Select your project: **shoppingshoes-b4f67**
3. In left sidebar: **Firestore Database**

### Step 2: Open Security Rules Editor
1. Click the **Rules** tab at the top
2. Replace all existing code with the rules below

### Step 3: Copy These Security Rules

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
      allow read: if request.auth != null && (request.auth.uid == resource.data.userId || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
      allow update, delete: if request.auth != null && (request.auth.uid == resource.data.userId || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }

    // Reviews - public read, authenticated users can create
    match /reviews/{document=**} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && (request.auth.uid == resource.data.userId || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }

    // Coupons - own coupons only, and admin can read all
    match /coupons/{document=**} {
      allow read: if request.auth != null && (request.auth.uid == resource.data.userId || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
      allow create: if true; // Allowed to be created by review submission logic
      allow update, delete: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
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
3. This may take 1-2 minutes to propagate

---

## Step 5: Create Admin User

### How to Make a User Admin:

1. **Sign up a new user** through the app (/signup) with your email
   - Or use Firebase Authentication to create a user manually

2. **Go to Firestore Database** → **users** collection

3. **Find your user document** by the user ID (UID)

4. **Add the role field:**
   - Click **Add field**
   - Field name: `role`
   - Type: `string`
   - Value: `admin`
   - Click **Save**

Now that user is an admin and can:
- Access the Admin Panel (`/admin`)
- Add/Edit/Delete products
- See all orders in the system

---

## Step 6: Test the Setup

### Test Admin Access:
1. Log out if needed
2. Log in with your **admin user** email  
3. Go to `/admin` → You should access the admin panel
4. Try adding a product with shoes data

### Test Regular User Access:
1. Create a new account (sign up)
2. This user will have `role: "user"` automatically
3. Try visiting `/admin` → Should redirect to home page
4. Can view products and place orders

### Test Orders:
1. As a regular user, add items to cart
2. Go to `/checkout` and complete an order
3. Visit `/orders` → Should see your order history
4. As an admin, the `/orders` page shows all orders

---

## Firestore Collection Structure
