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
      allow read: if request.auth.uid == userId || (request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
      allow write: if request.auth.uid == userId;
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
    
    // Notifications - read for all users, write for admin (and allow users to mark as read)
    match /notifications/{docId} {
      allow read: if true;
      allow create: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
      allow update: if request.auth != null && (
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin' ||
        (request.resource.data.diff(resource.data).affectedKeys().hasAny(['readBy', 'isRead']))
      );
      allow delete: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
