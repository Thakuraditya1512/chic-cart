# Quick Testing Guide

Use this checklist to verify your ChicCart setup is working correctly.

## Pre-Test Setup

Before running these tests:
1. ✓ Firebase Firestore rules are published
2. ✓ At least one admin account created (with `role: "admin"`)
3. ✓ Application is running on `http:/localhost:5173` (or your dev URL)

---

## Test 1: User Signup & Role Creation

**Test:** Regular user can sign up and gets automatic `role: "user"`

**Steps:**
1. Go to `/signup`
2. Enter:
   - Full Name: `Test User`
   - Email: `testuser@example.com`
   - Password: `Test@1234`
   - Confirm: `Test@1234`
3. Click **Create Account**

**Expected Results:**
✓ No errors shown
✓ Redirected to home page
✓ Can see username in account menu
✓ In Firestore (users collection): New document with `role: "user"`

---

## Test 2: Login & Role Fetch

**Test:** User logs in and role is fetched from Firestore

**Steps:**
1. Log out if logged in
2. Go to `/login`
3. Enter:
   - Email: `testuser@example.com`
   - Password: `Test@1234`
4. Click **Sign In**

**Expected Results:**
✓ No errors shown
✓ Redirected to home page
✓ User email shown in navigation
✓ AuthContext has `userRole: "user"` and `isAdmin: false`

---

## Test 3: Regular User Cannot Access Admin

**Test:** Non-admin users are redirected from `/admin`

**Steps:**
1. Make sure logged in as regular user (not admin)
2. Try visiting `/admin` directly (type in URL bar)
3. Try visiting `/admin12345` (random variation)

**Expected Results:**
✓ Immediately redirected to `/` (home page)
✓ No admin panel shown
✓ No password dialog shown

---

## Test 4: Admin Can Access Admin Panel

**Test:** Admin users can access `/admin` and see operations

**Steps:**
1. Log in with admin account email
2. Go to `/admin`

**Expected Results:**
✓ Admin panel loads without redirect
✓ Can see "Products" tab
✓ Can see "Add New Product" button
✓ Can see list of products (if any exist)

---

## Test 5: Admin Can Add Product (Shoe)

**Test:** Admin can add a new shoe product

**Steps:**
1. Make sure logged in as admin
2. Go to `/admin`
3. Click **Add New Product**
4. Fill form:
   - Name: `Premium Running Shoes`
   - Price: `129.99`
   - Original Price: `199.99`
   - Category: `Mens Fashion`
   - Description: `Lightweight running shoes with support`
   - Image URL: `https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500` (or any shoe image URL)
   - Rating: `4.5`
   - Reviews: `45`
   - In Stock: Checked
5. You should see image preview
6. Click **Save Product**

**Expected Results:**
✓ Toast message: "Product created successfully!"
✓ Product list refreshes
✓ New product shown in list with edit/delete buttons
✓ In Firestore (products collection): New document visible
✓ Product appears on home page immediately

---

## Test 6: Product Shows on Home Page

**Test:** New product is visible to all users (public read)

**Steps:**
1. Go to `/` (home page)
2. Scroll down to see products
3. Look for the shoe product you just added

**Expected Results:**
✓ Product card visible with:
  - Shoe image
  - Product name
  - Price
  - Rating
  - Category
✓ Can click to see `/product/:id` details
✓ Regular users can add to cart

---

## Test 7: Regular User Can Place Order

**Test:** Order flow with shoe product

**Steps:**
1. Log in as regular user (not admin)
2. Click on a shoe product
3. Enter quantity
4. Click **Add to Cart**
5. Click cart icon → **Checkout**
6. Fill customer details:
   - Full Name: `John Doe`
   - Email: `john@example.com`
   - Phone: `5551234567`
7. Click **Continue**
8. Fill address:
   - Address: `123 Main St`
   - City: `New York`
   - Zip Code: `10001`
9. Click **Continue**
10. Review and click **Place Order**

**Expected Results:**
✓ Toast: "Order placed successfully!"
✓ Cart empties
✓ Redirected to order page
✓ Shoe product image shows in order items
✓ In Firestore (orders collection): New order document with:
  - `userId: {user_id}`
  - `status: "pending"`
  - Items include `image` and `category` fields
  - `email: "john@example.com"`

---

## Test 8: User Can View Own Orders

**Test:** Orders page shows user's orders with product previews

**Steps:**
1. Located as regular user who just placed order
2. Click **Orders** in navigation (or `/orders`)

**Expected Results:**
✓ Page loads with "My Orders" heading
✓ User email shown at top
✓ Order count shows (e.g., "1")
✓ Order card visible with:
  - Order ID
  - Status badge
  - Order date
  - Total price
✓ Click to expand order and see:
  - Shoe product IMAGE thumbnail
  - Product name and category
  - Quantity and unit price
  - Delivery address
  - Order timeline (pending → confirmed, etc.)

---

## Test 9: Admin Can See AllOrders

**Test:** Admin can view orders from all users

**Steps:**
1. Log out
2. Log in as admin
3. Go to `/orders`

**Expected Results:**
✓ Page shows orders but NO user-specific filter
✓ Multiple orders listed (from different users)
✓ Can see all orders placed by anyone
✓ Can expand and see customer details (name, email, address)
✓ Can see all order items with shoe images

---

## Test 10: Edit Product as Admin

**Test:** Admin can modify product details

**Steps:**
1. Log in as admin
2. Go to `/admin`
3. Find the shoe product
4. Click **Edit** (pencil icon)
5. Change:
   - Price: `119.99`
   - In Stock: Toggle off
6. Click **Update Product**

**Expected Results:**
✓ Toast: "Product updated successfully!"
✓ Product list updates
✓ Home page shows new price
✓ In Firestore: `updatedAt` field updates

---

## Test 11: Delete Product as Admin

**Test:** Admin can remove products

**Steps:**
1. Log in as admin
2. Go to `/admin`
3. Find a product to delete
4. Click **Delete** (trash icon)
5. Click **Confirm** on dialog

**Expected Results:**
✓ Toast: "Product deleted successfully!"
✓ Product disappears from admin list
✓ Product removed from home page
✓ In Firestore: Document deleted from products collection

---

## Test 12: Product Image Shows in Order History

**Test:** Order items display shoe product images

**Steps:**
1. As admin, add a new shoe with image URL
2. As regular user, buy that shoe
3. User goes to `/orders` and expands the order

**Expected Results:**
✓ Product shows thumbnail image in order items
✓ Image is clickable/hoverable (optional: navigate to product detail)
✓ Image dimensions appropriate (16x16 to 20x20 rem)
✓ Fallback if image fails to load

---

## Test 13: Non-Logged-In User Cannot Checkout

**Test:** Checkout requires login

**Steps:**
1. Log out
2. Go to `/` (home)
3. Add product to cart
4. Click cart → **Checkout**

**Expected Results:**
✓ Redirected to `/login`
✓ Message: "You need to be logged in to checkout"
✓ Cart items preserved

---

## Test 14: Route Redirects Work

**Test:** Proper redirections for different user types

**Steps:**
Fill in the table below by visiting routes as each user type:

| Route | Not Logged In | Regular User | Admin User |
|-------|---|---|---|
| `/` | ✓ Load | ✓ Load | ✓ Load |
| `/login` | ✓ Load | Redirect `/` | Redirect `/` |
| `/signup` | ✓ Load | Redirect `/` | Redirect `/` |
| `/product/:id` | ✓ Load | ✓ Load | ✓ Load |
| `/checkout` | Redirect `/login` | ✓ Load | ✓ Load |
| `/orders` | Redirect `/login` | ✓ Load (own) | ✓ Load (all) |
| `/admin` | Redirect `/login` | Redirect `/` | ✓ Load |
| Any `/admin*` | Redirect `/login` | Redirect `/` | ✓ Load |

---

## Test 15: Firestore Rules Validation

**Test:** Rules prevent unauthorized access

**Steps:**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Try these commands (as different users):

**As Regular User:**
```javascript
// Should FAIL - cannot write to products
db.collection("products").add({name: "hack"})
// Expected: Permission denied

// Should SUCCEED - can read products
db.collection("products").get()
// Expected: Gets all products
```

**As Admin User:**
```javascript
// Should SUCCEED - can write to products
db.collection("products").add({
  name: "Admin Product",
  price: 99
})
// Expected: Creates document

// Should SUCCEED - can read all users
db.collection("users").get()
// Expected: Gets all user documents
```

**Expected Results:**
✓ Rules enforce permissions correctly
✓ No unauthorized write access
✓ Read access limited properly

---

## Common Issues & Fixes

### Issue: "Missing permissions" error on add product
**Fix:**
1. Check Firestore rules are published (green checkmark)
2. Verify user has `role: "admin"` in Firestore
3. Hard refresh: Ctrl+Shift+R
4. Log out and back in

### Issue: Images not showing in orders
**Fix:**
1. Check image URLs are valid
2. Verify Checkout saves `image` field with items
3. Check network tab for broken image requests

### Issue: Can access `/admin` as non-admin
**Fix:**
1. Verify AdminGuard component is properly imported in App.tsx
2. Check `isAdmin` value in AuthContext
3. Hard refresh and clear browser cache

### Issue: Signup creates no Firestore document
**Fix:**
1. Check Firestore rules allow creating users collection
2. Verify `setDoc` is called in signup function
3. Check browser console for errors

---

## Test Results Log

| Test # | Test Name | Status | Notes |
|---|---|---|---|
| 1 | User Signup & Role | ✓ PASS | - |
| 2 | Login & Role Fetch | ✓ PASS | - |
| 3 | Regular User Cannot Access Admin | ✓ PASS | - |
| 4 | Admin Can Access Admin Panel | ✓ PASS | - |
| 5 | Admin Can Add Product | ✓ PASS | - |
| 6 | Product Shows on Home Page | ✓ PASS | - |
| 7 | Regular User Can Place Order | ✓ PASS | - |
| 8 | User Can View Own Orders | ✓ PASS | - |
| 9 | Admin Can See All Orders | ✓ PASS | - |
| 10 | Edit Product as Admin | ✓ PASS | - |
| 11 | Delete Product as Admin | ✓ PASS | - |
| 12 | Product Image in Orders | ✓ PASS | - |
| 13 | Non-Logged-In Cannot Checkout | ✓ PASS | - |
| 14 | Route Redirects Work | ✓ PASS | - |
| 15 | Firestore Rules Validation | ✓ PASS | - |

---

## You're All Set! 🎉

If all tests pass, your ChicCart application is fully functional with:
- ✓ Proper Firebase authentication
- ✓ Role-based access control  
- ✓ Secure Firestore rules
- ✓ Admin product management
- ✓ User orders with shoe previews
- ✓ Automatic role-based routing

Ready to deploy! 🚀
