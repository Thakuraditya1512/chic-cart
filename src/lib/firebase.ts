import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBl5YpzUJF960hA5kGCN6oeiDP2--EbRSQ",
  authDomain: "shoppingshoes-b4f67.firebaseapp.com",
  projectId: "shoppingshoes-b4f67",
  storageBucket: "shoppingshoes-b4f67.firebasestorage.app",
  messagingSenderId: "932957475226",
  appId: "1:932957475226:web:30dfc8343465a7b9e26a23",
  measurementId: "G-VC3TWF3CMN",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

export default app;
