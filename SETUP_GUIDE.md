# Complete Setup Guide for ChicCart

## Overview
This guide walks you through setting up the ChicCart application with proper Firebase backend, role-based authentication, and product/order management.

---

## Part 1: Firebase Configuration

### Firebase Credentials (Already Updated)
Your Firebase project is: **shoppingshoes-b4f67**

The credentials are configured in [src/lib/firebase.ts](src/lib/firebase.ts):
- Project ID: `shoppingshoes-b4f67`
- Auth Domain: `shoppingshoes-b4f67.firebaseapp.com`
- Storage Bucket: `shoppingshoes-b4f67.firebasestorage.app`

---

## Part 2: Set Up Firestore Security Rules

### Step 1: Navigate to Firestore
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select project: **shoppingshoes-b4f67**
3. Click **Firestore Database** in the left sidebar
4. Click the **Rules** tab

### Step 2: Copy and Publish Rules
Replace all existing rules with this code:

```firestore
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
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

Click **Publish** and wait for the checkmark to appear.

---

## Part 3: Create an Admin User

### Option A: Via Firebase Console (Recommended)

1. **Create User in Authentication:**
   - Go to **Authentication** tab
   - Click **Create user** (top-right button)
   - Email: `admin@example.com` (use your preferred email)
   - Password: Create a strong password
   - Click **Create user**
   - Copy the **User ID** (UID)

2. **Create Admin Document in Firestore:**
   - Go to **Firestore Database**
   - If no collections exist, click **Start collection**
   - Collection ID: `users`
   - Document ID: Paste the UID you copied
   - Click **Save**
   - Click **Add field:**
     - Field name: `role`
     - Type: `String`
     - Value: `admin`
   - Click **Save**
   - Click **Add field:**
     - Field name: `email`
     - Type: `String`
     - Value: `admin@example.com` (same as authentication email)
   - Click **Save**

### Option B: Via Application
1. Sign up a new account through the app (/signup)
2. The app automatically creates a user document with `role: "user"`
3. Go to Firestore console
4. Find the user in **users** collection
5. Edit the document and change `role` from `"user"` to `"admin"`

---

## Part 4: Application User Flows

### For Regular Users

#### Sign Up (First Time)
1. Go to `/signup`
2. Enter email, password, and confirm password
3. Click **Create Account**
4. Automatic Firestore entry created with `role: "user"`
5. Redirected to home page

#### Log In
1. Go to `/login`
2. Enter email and password
3. Automatically fetches user role from Firestore
4. Full access to shop and place orders

#### Browse Products
1. View products on home page `/`
2. Click product to see details `/product/:id`
3. Add to cart using the cart button

#### Place Order
1. Click cart icon to view cart
2. Click **Checkout**
3. Fill in customer details (name, email, phone)
4. Fill in delivery address
5. Review order and place
6. Order saved to Firestore with status `"pending"`

#### View Orders
1. Click **Orders** in navigation or `/orders`
2. See all your previous orders
3. Click to expand and see:
   - Product images and details
   - Quantity and pricing
   - Delivery address
   - Order status timeline
4. Each product shows a thumbnail image

---

### For Admin Users

#### Access Admin Panel
1. Log in with admin account
2. Go to `/admin`
3. If not admin: automatically redirected to `/`

#### Add New Shoe Product
1. Click **Add New Product** in Admin panel
2. Fill in product details:
   - **Name:** Shoe name (e.g., "Running Pro Max")
   - **Price:** Current price
   - **Original Price:** (Optional) For showing discounts
   - **Category:** Select from dropdown (Womens, Mens, Electronics, Accessories, Home & Living)
   - **Description:** Product description
   - **Image URL:** Direct link to shoe image (jpg/png/webp)
   - **Rating:** 0-5 stars
   - **Reviews:** Number of reviews
   - **In Stock:** Toggle checkbox
3. See image preview
4. Click **Save Product**
5. Product appears in home page immediately

#### Edit Product
1. Click **Edit** (pencil icon) on product
2. Modify all fields
3. Click **Update Product**

#### Delete Product
1. Click **Delete** (trash icon) on product
2. Confirm deletion

#### View All Orders
1. Go to `/orders` as admin
2. See ALL customer orders (not just own orders)
3. Expand each order to see details
4. View order status and customer information

---

## Part 5: Role-Based Access Control

### Route Protection

| Route | Public | User Login | Admin Only |
|-------|--------|-----------|-----------|
| `/` | ✓ | ✓ | ✓ |
| `/product/:id` | ✓ | ✓ | ✓ |
| `/login` | ✓ | ✗ | ✗ |
| `/signup` | ✓ | ✗ | ✗ |
| `/checkout` | ✗ | ✓ | ✓ |
| `/orders` | ✗ | ✓ (own orders) | ✓ (all orders) |
| `/admin` | ✗ | ✗ | ✓ |

### What Happens When You Try to Access Admin Routes?

**As Regular User:**
- Try to visit `/admin` → Automatically redirected to `/`
- Try to access `/admin123` or similar → Also redirected to `/`

**As Non-Logged-In User:**
- Try to visit `/admin` → Redirected to `/login`
- Or other protected routes → Redirected to `/login`

---

## Part 6: Database Structure

### Collections Overview

```
Firestore Database
├── users/
│   ├── {userId}
│   │   ├── email: string
│   │   ├── role: "admin" | "user"
│   │   └── createdAt: timestamp
│
├── products/
│   ├── {productId}
│   │   ├── name: string
│   │   ├── price: number
│   │   ├── originalPrice: number (optional)
│   │   ├── description: string
│   │   ├── category: string
│   │   ├── image: string (URL)
│   │   ├── rating: number (0-5)
│   │   ├── reviews: number
│   │   ├── inStock: boolean
│   │   ├── createdAt: timestamp
│   │   └── updatedAt: timestamp
│
└── orders/
    ├── {orderId}
    │   ├── userId: string
    │   ├── customerName: string
    │   ├── email: string
    │   ├── phone: string
    │   ├── address: string
    │   ├── city: string
    │   ├── zipCode: string
    │   ├── items: array[
    │   │   ├── productId: string
    │   │   ├── productName: string
    │   │   ├── price: number
    │   │   ├── quantity: number
    │   │   ├── image: string
    │   │   └── category: string
    │   ├── subtotal: number
    │   ├── codCharge: number (50 if < $1000, else 0)
    │   ├── total: number
    │   ├── paymentMethod: "COD"
    │   ├── status: "pending" | "confirmed" | "packed" | "shipped" | "out_for_delivery" | "delivered"
    │   └── createdAt: timestamp
```

---

## Part 7: Testing Checklist

### Setup Complete? Test These:

- [ ] **User Signup Works**
  - Sign up with new email
  - Check Firestore → users collection → new user has `role: "user"`

- [ ] **Admin Access Works**
  - Log in as admin user
  - Visit `/admin` → Should show admin panel
  - Visit `/admin12345` → Should redirect to home

- [ ] **Non-Admin Redirect Works**
  - Log in as regular user
  - Visit `/admin` → Should redirect to `/`

- [ ] **Add Product Works**
  - Log in as admin
  - Go to `/admin`
  - Add new shoe product
  - Product appears on home page

- [ ] **Cart & Checkout Works**
  - Add product to cart
  - Go to checkout
  - Fill form and place order
  - Order appears in Firestore

- [ ] **Orders Page Shows Products**
  - Place test order as user
  - Go to `/orders`
  - Expand order → Should see shoe images

- [ ] **Admin Can See All Orders**
  - Place test order as one user
  - Log in as admin
  - Go to `/orders` → Should see all orders (not just admin's)

---

## Part 8: Troubleshooting

### "Missing or insufficient permissions" error?
- ✓ Check Firestore rules are published (green checkmark)
- ✓ Wait 1-2 minutes for rules to propagate
- ✓ Hard refresh: Ctrl+Shift+R
- ✓ Verify user has correct role in Firestore

### Admin can't modify products?
- ✓ Verify `role: "admin"` is set in Firestore users collection
- ✓ Log out and back in to refresh role
- ✓ Check rules don't have typos

### Images not showing in orders?
- ✓ In Checkout, verify items include `image` and `category` fields
- ✓ In Orders page, images render if `item.image` exists

### Can't access `/checkout` while logged in?
- ✓ Make sure you're properly logged in (check AuthContext)
- ✓ User document must exist in Firestore

---

## Part 9: Code Changes Made

### Updated Files

1. **[src/lib/firebase.ts](src/lib/firebase.ts)**
   - Updated Firebase config with new project credentials

2. **[src/contexts/AuthContext.tsx](src/contexts/AuthContext.tsx)**
   - Added role fetching from Firestore
   - Auto-creation of user document on signup with `role: "user"`
   - Added `userRole` and `isAdmin` to context

3. **[src/components/AdminGuard.tsx](src/components/AdminGuard.tsx)**
   - Changed from password-based to role-based authentication
   - Redirects non-admins to `/`
   - Redirects non-logged-in users to `/login`

4. **[src/pages/Orders.tsx](src/pages/Orders.tsx)**
   - Enhanced product display with images
   - Shows shoe thumbnails in order items
   - Displays product category and details

5. **[src/pages/Checkout.tsx](src/pages/Checkout.tsx)**
   - Now saves product images and categories with orders
   - Enables product preview in order history

---

## Part 10: Deployment Checklist

Before going live:

- [ ] Firebase rules validated and published
- [ ] At least one admin user created
- [ ] Test all user flows in development
- [ ] Images use stable URLs (not local)
- [ ] Database rules reviewed by security team
- [ ] Phone number validation working
- [ ] Email validation working
- [ ] All error messages user-friendly

---

## Summary

Your ChicCart application now has:
✓ Firebase authentication with role-based access
✓ Admin panel for managing shoe products
✓ Secure Firestore rules (products public read, admin write)
✓ User orders with product previews
✓ Automatic route protection based on roles
✓ Proper status timeline for orders
✓ COD charge calculation in checkout

Enjoy your fully functional e-commerce platform! 🎉
