import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyB2SRcPIkArn6hn4JnWSjY4SRLdOZjcAfE",
  authDomain: "platform-react-8225a.firebaseapp.com",
  projectId: "platform-react-8225a",
  storageBucket: "platform-react-8225a.firebasestorage.app",
  messagingSenderId: "281242787417",
  appId: "1:281242787417:web:2be55de49a881681555b48",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

export default app;
