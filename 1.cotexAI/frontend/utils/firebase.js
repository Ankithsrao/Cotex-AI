// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "moolya-house-cup.firebaseapp.com",
  projectId: "moolya-house-cup",
  storageBucket: "moolya-house-cup.firebasestorage.app",
  messagingSenderId: "301458954676",
  appId: "1:301458954676:web:1d4ade88d31ed8ef25fae1",
  measurementId: "G-TL11Q71FS5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()

