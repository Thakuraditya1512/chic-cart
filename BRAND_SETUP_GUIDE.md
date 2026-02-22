# Brand Management & Featured Addition Setup Guide

## 🔥 What's New

### 1. **Brand Management System**
- Separate admin page tabs to manage Brands and Shoes
- Create brands (Nike, Adidas, Jordan, etc.)
- Add multiple shoes to each brand
- Edit and delete brands and shoes

### 2. **Featured Addition Section**
- New horizontal scrolling section on homepage
- Display all products in a carousel format
- Works on both mobile and desktop
- Mobile: Swipe to scroll left/right
- Desktop: Click arrow or scroll wheel to navigate
- Smooth animations and drag support

### 3. **Firebase Permissions Fixed**
- Updated Firestore Security Rules to allow brand management
- Admin users can now create, update, and delete brands
- Admin users can create, update, and delete products

---

## 📋 Step 1: Update Firebase Rules

### Go to Firebase Console

1. Visit: [Firebase Console](https://console.firebase.google.com)
2. Select your project: **shoppingshoes-b4f67**
3. Navigate to **Firestore Database** → **Rules** tab

### Copy the Updated Rules

Replace all code in the Rules editor with this:

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

    // Cart data (optional)
    match /carts/{userId} {
      allow read, write: if request.auth.uid == userId;
    }

    // Deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### Publish the Rules

1. Click the **Publish** button (bottom-right)
2. Confirm the update
3. Wait 1-2 minutes for rules to propagate globally

---

## 👤 Step 2: Ensure You're an Admin

To add brands and products, your user account must have `role: "admin"`.

### Check Your Role:

1. Go to Firebase Console → **Firestore Database**
2. Click **users** collection
3. Find your user document (by your UID)
4. Check if it has a `role` field set to `admin`

### If Not an Admin Yet:

1. Click on your user document
2. Click **Add field**
   - Field name: `role`
   - Type: **string**
   - Value: `admin`
3. Click **Save**

---

## 🎯 Step 3: Using the Admin Panel

### Access Admin Panel

1. Log in with your admin account
2. Go to: `http://localhost:5173/admin` (local) or your deployed URL + `/admin`

### Managing Brands

1. Click the **BRANDS** tab
2. Click **+ ADD NEW** button
3. Fill in:
   - **Brand Name**: e.g., "Nike"
   - **Brand Image URL**: Full image URL (e.g., `https://images.unsplash.com/...`)
   - **Description**: Optional description
4. Click **CREATE**

**Tip:** Use image URLs from:
- Unsplash: `https://images.unsplash.com/...`
- Pexels: `https://images.pexels.com/...`
- Your own server

### Managing Shoes

1. Click **BRANDS** tab
2. Find the brand you want to add shoes to
3. Click the **→ (chevron)** button
4. Automatically switches to **SHOES** tab with brand selected
5. Click **+ ADD NEW** button
6. Fill in shoe details:
   - **Shoe Name**: e.g., "Air Max 90"
   - **Price**: e.g., "129.99"
   - **Original Price**: Optional (for showing discount)
   - **Rating**: 0-5 (e.g., 4.8)
   - **Reviews**: Number of reviews
   - **Image URL**: Full image URL
   - **Description**: Shoe features
   - **In Stock**: Toggle checkbox
7. Click **CREATE**

### Edit Mode

- Click **pencil icon** on any brand or shoe to edit
- Update any field
- Click **UPDATE**

### Delete

- Click **trash icon** to delete
- Confirm deletion

---

## 🎨 Featured Addition Section

### What It Does

- Shows all products in a horizontal scrollable carousel
- Available on the homepage below "Featured Kicks"
- Automatically populated from your products collection

### Features

**Desktop:**
- Scroll with mouse wheel or trackpad
- Click the **→ arrow** on the right to scroll smoothly
- Drag to reposition (grab and drag)
- Arrow appears only when there's more content to scroll

**Mobile:**
- Swipe left/right to scroll through products
- Shows "Swipe left to explore more →" hint
- Fully responsive and touch-enabled

### Customization

The section is in [src/components/FeaturedProducts.tsx](src/components/FeaturedProducts.tsx):

- Scroll amount: Change `left: 320` in `scrollRight()` function (line ~30)
- Animation delay: Adjust `delay: i * 0.05` (line ~78)
- Card width: Change `w-64 sm:w-72` (line ~79) for different sizes

---

## 🐛 Troubleshooting

### "Missing or insufficient permissions" Error

**Solution:** 
1. Check Firebase Rules are published (see Step 1)
2. Verify you're logged in as admin user
3. Go to Firestore → users collection → check your `role` field = "admin"
4. Clear browser cache and reload

### Brands Don't Show in Admin

1. Go to Firestore → **brands** collection
2. Check if collection exists
3. If not, create it:
   - Click **Create collection**
   - Collection name: `brands`
   - Click **Auto-generate ID**
   - Add a sample brand document

### Products Not Appearing in Featured Section

1. Check Firestore → **products** collection
2. Verify products have `brandId` field (required)
3. Make sure products are created under the right brand
4. Clear browser cache and hard refresh (Ctrl+Shift+R)

### Scroll Arrow Not Appearing

1. Check if there are enough products to scroll
2. Verify `scrollbar-hide` CSS is loaded (check index.css)
3. Try scrolling with mouse wheel to trigger arrow
4. Check browser console for errors

---

## 📱 Mobile Responsiveness

The Featured Addition section is fully responsive:

- **Mobile (< 768px):** 
  - Full-width scrollable container
  - Swipe to scroll
  - Shows swipe hint text
  - Cards: `w-64` (256px)

- **Tablet/Desktop (≥ 768px):**
  - Scroll wheel or arrow button
  - Shows scroll arrow
  - Cards: `w-72` (288px)

---

## ✅ Testing Your Setup

1. **Test Adding a Brand:**
   - Go to /admin
   - Click BRANDS tab
   - Click + ADD NEW
   - Fill in brand details
   - Click CREATE
   - Should see success toast

2. **Test Adding a Shoe:**
   - Select the brand you created
   - Click SHOES tab
   - Click + ADD NEW
   - Fill in shoe details
   - Click CREATE
   - Should see success toast

3. **Test Featured Addition:**
   - Go to home page
   - Scroll to "Featured Addition" section
   - Try scrolling/swiping
   - Should see smooth animation

4. **Test Permissions:**
   - Log out
   - Sign up new non-admin user
   - Try visiting /admin
   - Should redirect to home (not admin)

---

## 🎓 Key Firebase Collections

### brands
```
{
  id: string (auto-generated)
  name: string
  image: string (URL)
  description: string (optional)
  createdAt: timestamp
  updatedAt: timestamp
}
```

### products
```
{
  id: string (auto-generated)
  name: string
  price: number
  originalPrice: number (optional)
  image: string (URL)
  description: string
  brandId: string (reference to brand)
  rating: number (0-5)
  reviews: number
  inStock: boolean
  createdAt: timestamp
  updatedAt: timestamp
}
```

---

## 💡 Pro Tips

1. **Bulk Add Images:** Use Unsplash Collections for consistent brand imagery
2. **Image URLs:** Keep permanent URLs (avoid short links that expire)
3. **Ratings:** Leave at default 4.5 for new products, update after reviews
4. **Mobile Testing:** Use Chrome DevTools (F12) → Device Toggle to test mobile
5. **Performance:** Products load from Firestore (paginate if 100+ products)

---

## 📞 Support

If you encounter issues:

1. Check browser console (F12 → Console tab) for error messages
2. Verify Firestore Rules are published
3. Check user has `role: admin` in database
4. Clear cache and reload page
5. Test with incognito window (fresh session)

---

**Last Updated:** February 22, 2026
**Version:** 2.0 (With Brand System & Featured Addition)
