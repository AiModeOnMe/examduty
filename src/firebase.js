import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBrgokHLE8P4OLZe6siq4oHr8BkyNSjnbA",
  authDomain: "dutyroster-f6e9e.firebaseapp.com",
  projectId: "dutyroster-f6e9e",
  storageBucket: "dutyroster-f6e9e.firebasestorage.app",
  messagingSenderId: "862023500550",
  appId: "1:862023500550:web:7f678af6cfac1865d6d487",
  measurementId: "G-DPHD5EX4BT"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
