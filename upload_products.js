import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import fs from "fs";

const firebaseConfig = {
  apiKey: "AIzaSyDXz73CP7KeGBT1jV4vPpjP6PJLFR1LoO8",
  authDomain: "flexthekicks.firebaseapp.com",
  projectId: "flexthekicks",
  storageBucket: "flexthekicks.firebasestorage.app",
  messagingSenderId: "907076959725",
  appId: "1:907076959725:web:66608ee8cf325438f4bbe4",
  measurementId: "G-4T5RDCKCGB"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const jsonPath = "C:\\Users\\hp\\.gemini\\antigravity-cli\\brain\\93f28e49-ea77-42db-af5d-00a79c520154\\scratch\\nike_products.json";
const products = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));

console.log(`Starting upload of ${products.length} products to Firestore...`);

async function upload() {
  for (const p of products) {
    try {
      const docRef = doc(db, "products", p.id);
      await setDoc(docRef, {
        ...p,
        createdAt: new Date(p.createdAt)
      });
      console.log(`Uploaded: ${p.name}`);
    } catch (err) {
      console.error(`Failed to upload ${p.name}:`, err);
    }
  }
  console.log("Upload completed!");
  process.exit(0);
}

upload();
