// src/firebase/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyB963T9klgVVqKBN2mK51RDKtc2VD2mDuE",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "roometry-app.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "roometry-app",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "roometry-app.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "658376616708",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:658376616708:web:afcecb48697742c79abe51"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Authentication and Firestore instances
export const auth = getAuth(app);
export const db = getFirestore(app);



//----------------------------------------------------
// Import the functions you need from the SDKs you need
// import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// const firebaseConfig = {
//   apiKey: "AIzaSyB963T9klgVVqKBN2mK51RDKtc2VD2mDuE",
//   authDomain: "roometry-app.firebaseapp.com",
//   projectId: "roometry-app",
//   storageBucket: "roometry-app.firebasestorage.app",
//   messagingSenderId: "658376616708",
//   appId: "1:658376616708:web:afcecb48697742c79abe51",
//   measurementId: "G-3SVTRTVEBZ"
// };

// // Initialize Firebase
// const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);