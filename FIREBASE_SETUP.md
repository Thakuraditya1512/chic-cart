# 🚀 Firebase Setup Guide - Chic Cart

Your Firebase project is configured and ready to use! This guide will walk you through the complete setup.

## 📋 Firebase Configuration

**Project ID:** `platform-react-8225a`

Your Firebase credentials are already configured in `src/lib/firebase.ts`. No additional setup needed for the config file!

---

## 🔐 Firestore Database Rules Setup

### Step 1: Apply Security Rules

1. Go to **[Firebase Console](https://console.firebase.google.com/)**
2. Select project: **`platform-react-8225a`**
3. Click **"Firestore Database"** → **"Rules"** tab
4. Replace all existing rules with this:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow anyone to read data
    match /{document=**} {
      allow read: if true;
    }

    // Users collection - can write their own profile
    match /users/{userId} {
      allow create, write: if request.auth.uid == userId;
      allow read: if request.auth.uid == userId || request.auth.uid != null;
    }

    // Products collection - only admins can write
    match /products/{document=**} {
      allow read: if true;
      allow create, update, delete: if request.auth != null &&
        checkIsAdmin(request.auth.uid);
    }

    // Orders collection - anyone can read/write their own orders
    match /orders/{orderId} {
      allow create: if request.auth != null;
      allow read: if request.auth != null;
      allow update, delete: if request.auth != null &&
        checkIsAdmin(request.auth.uid);
    }

    // Helper function to check if user is admin
    function checkIsAdmin(userId) {
      return get(/databases/$(database)/documents/users/$(userId)).data.role == 'admin';
    }
  }
}
```

5. Click **"Publish"** button to apply rules

---

## 📊 Firestore Collection Structure

### **Users Collection**
```
collection: users
├── {userId} (document ID from Auth)
├── email: "user@example.com"
├── role: "admin" | "user"
├── fullName: "John Doe"
└── createdAt: timestamp
```

### **Products Collection**
```
collection: products
├── {productId} (auto-generated)
├── name: "PREMIUM RUNNER X"
├── price: 189.99
├── originalPrice: 249.99 (optional)
├── category: "Womens Fashion"
├── description: "High quality shoe..."
├── image: "https://example.com/image.jpg"
├── rating: 4.5
├── reviews: 120
├── inStock: true
└── createdAt: timestamp
```

### **Orders Collection**
```
collection: orders
├── {orderId} (auto-generated)
├── userId: "uid_of_customer"
├── customerName: "Jane Doe"
├── email: "jane@example.com"
├── phone: "9876543210"
├── address: "123 Main St, Apt 4B"
├── city: "New York"
├── zipCode: "10001"
├── items: [
│   ├── productId: "product_id"
│   ├── productName: "Product Name"
│   ├── price: 189.99
│   ├── quantity: 2
│   └── size: "M"
│ ]
├── subtotal: 500
├── codCharge: 50
├── total: 550
├── paymentMethod: "COD"
├── status: "pending" | "confirmed" | "packed" | "shipped" | "out_for_delivery" | "delivered"
└── createdAt: timestamp
```

---

## 🎯 Step-by-Step Setup

### Step 1: Create Collections

1. Go to **Firebase Console** → **Firestore Database**
2. Click **"Start collection"**
3. Create these collections (leave empty, they'll auto-populate):
   - `users`
   - `products`
   - `orders`

### Step 2: Enable Authentication

1. Go to **Authentication** tab
2. Click **"Get started"**
3. Enable these sign-in methods:
   - **Email/Password** (required)
   - **Google** (optional)
   - **Anonymous** (optional)

### Step 3: Create Admin User

1. Go to **Authentication** → **Users**
2. Click **"Add user"**
3. Enter:
   - Email: `admin@example.com`
   - Password: `Admin123!`
4. Click **"Add user"**

5. Go to **Firestore Database** → **users** collection
6. Click **"Add document"**
7. Document ID: `[paste the UID from step 3]`
8. Add fields:
   ```
   email: admin@example.com
   role: admin
   fullName: Admin User
   createdAt: [server timestamp]
   ```

### Step 4: Test the Setup

1. Run the app:
   ```bash
   npm run dev
   ```

2. Go to `http://localhost:5173/login`

3. Sign up with your admin account:
   - Email: `admin@example.com`
   - Password: `Admin123!`

4. Go to `http://localhost:5173/admin`

5. Enter password: `admin123` (or your custom password)

6. Click **"+ ADD PRODUCT"** and add a test product

---

## 💻 Using the Admin Dashboard

### ✅ Add Product
1. Click **"+ ADD PRODUCT"** button
2. Fill in:
   - **Product Name:** e.g., "NEON RUNNER X"
   - **Price:** e.g., 189.99
   - **Category:** Select from dropdown
   - **Description:** Product details
   - **Image URL:** Complete URL (see Image Sources below)
   - **Rating:** 0-5 (e.g., 4.5)
   - **Reviews:** Number of reviews
   - **In Stock:** Toggle checkbox
3. Click **"CREATE"** button
4. Product appears instantly on shop page!

### ✏️ Edit Product
1. Click pencil icon on product card
2. Update any fields
3. Click **"UPDATE"** button

### 🗑️ Delete Product
1. Click trash icon on product card
2. Confirm deletion
3. Product removed instantly

---

## 🖼️ Image URL Sources

Use these free services to get product images:

### **Free Image Hosting:**
1. **Unsplash** - https://unsplash.com
   - High-quality free photos
   - Copy direct image link

2. **Pexels** - https://www.pexels.com
   - Free stock photos
   - Right-click → Copy image address

3. **Pixabay** - https://pixabay.com
   - Free images & vectors
   - Similar process

4. **Imgur** - https://imgur.com
   - Upload images
   - Get direct link

5. **Cloudinary** - https://cloudinary.com
   - Free tier (10GB storage)
   - Best for e-commerce

### **How to Get Direct Image URL:**
1. Go to any image site → Find product image
2. Right-click image → **"Copy image address"**
3. Paste in **Image URL** field in admin panel
4. Preview will show below the input
5. Click **CREATE** → Done!

### **Example Product URLs:**
- Women's Shoe: `https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500`
- Hoodie: `https://images.unsplash.com/photo-1556821552-5f7a6f4a3f3f?w=500`
- T-Shirt: `https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500`

---

## 🚨 Troubleshooting

### ❌ Error: "Permission denied" when adding product

**Solution:** User is not set as admin

**Fix:**
1. Go to Firebase Console → Firestore → **users** collection
2. Find your user document
3. Make sure `role: "admin"` is set
4. Refresh app and try again

---

### ❌ Error: "Failed to add product"

**Solution:** Database rules not applied or quota exceeded

**Fix:**
1. Check Firestore Rules are published
2. Go to Firebase Console → Firestore → **Rules** tab
3. Make sure status shows **"Rules published"**
4. Check **Quotas** tab for errors

---

### ❌ Error: "Image not loading in preview"

**Solution:** Invalid image URL

**Fix:**
1. Test URL in browser address bar
2. Make sure URL is complete (starts with http/https)
3. Try different image source
4. Make sure image is publicly accessible

---

### ❌ Error: "Cannot access /admin page"

**Solution:** Admin authentication failed

**Fix:**
1. Make sure you're logged in (not signed out)
2. Check that your user role is "admin" in Firestore
3. Try logout and login again
4. Enter correct admin password: `admin123`

---

### ❌ Products not showing on shop page

**Solution:** Products collection not populated

**Fix:**
1. Go to Firebase Console → Firestore
2. Check **products** collection
3. Add at least one product via admin panel
4. Refresh shop page

---

## 📱 User Roles & Permissions

### **Admin User**
- ✅ Access `/admin` dashboard
- ✅ Add products
- ✅ Edit products
- ✅ Delete products
- ✅ View orders
- ✅ Update order status
- ✅ Full access

### **Regular User**
- ✅ View products
- ✅ Add to cart
- ✅ Checkout & create orders
- ✅ View own orders
- ❌ Cannot access admin panel
- ❌ Cannot modify products

---

## 🔒 Security Best Practices

1. **Change Admin Password**
   - Update `VITE_ADMIN_PASSWORD` in `.env.local`
   - Default is `admin123`

2. **Secure Admin Account**
   - Use strong password (8+ chars, numbers, symbols)
   - Don't share admin credentials
   - Regularly review admin users

3. **Firestore Rules**
   - Rules are published and active
   - Only admins can write products
   - Regular users can't modify data

4. **Firebase Console Access**
   - Use strong password for Firebase account
   - Enable 2-factor authentication
   - Regularly check activity logs

---

## ✅ Setup Checklist

Complete this checklist to ensure everything is working:

- [ ] Firebase project created
- [ ] Firestore Database enabled
- [ ] Collections created (users, products, orders)
- [ ] Security rules applied and published
- [ ] Email/Password authentication enabled
- [ ] Admin user created in Firestore
- [ ] Can login with admin credentials
- [ ] Can access `/admin` dashboard
- [ ] Can add a test product
- [ ] Product appears on shop page
- [ ] Can edit product
- [ ] Can delete product
- [ ] Can logout
- [ ] Can login as regular user
- [ ] Regular user can see products
- [ ] Regular user cannot access admin

---

## 🎉 You're All Set!

Your Chic Cart is now fully connected to Firebase!

### Next Steps:
1. ✅ Start adding products via admin panel
2. ✅ Share shop link with friends
3. ✅ Monitor orders from admin dashboard
4. ✅ Update order statuses
5. ✅ Scale your business! 🚀

---

## 📚 Useful Links

- **Firebase Console:** https://console.firebase.google.com
- **Project ID:** `platform-react-8225a`
- **Admin Dashboard:** `http://localhost:5173/admin`
- **Login Page:** `http://localhost:5173/login`
- **Signup Page:** `http://localhost:5173/signup`
- **Shop Page:** `http://localhost:5173/`

---

## 💬 Support

If you have issues:
1. Check Firebase Console for error logs
2. Check browser console (F12 → Console tab)
3. Verify Firestore rules are published
4. Verify user has admin role in Firestore
5. Try clearing browser cache and logging in again

Happy selling! 🎉
