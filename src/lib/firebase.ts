import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getStorage } from "firebase/storage";

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

const firebaseConfig = {
  apiKey: "AIzaSyDXz73CP7KeGBT1jV4vPpjP6PJLFR1LoO8",
  authDomain: "flexthekicks.firebaseapp.com",
  projectId: "flexthekicks",
  storageBucket: "flexthekicks.firebasestorage.app",
  messagingSenderId: "907076959725",
  appId: "1:907076959725:web:66608ee8cf325438f4bbe4",
  measurementId: "G-4T5RDCKCGB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

export default app;
