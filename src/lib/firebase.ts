// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD2pIk_zVwmhZUdvE6FUsHJdwuB5PdtmbI",
  authDomain: "chartz-706ac.firebaseapp.com",
  projectId: "chartz-706ac",
  storageBucket: "chartz-706ac.firebasestorage.app",
  messagingSenderId: "847928829914",
  appId: "1:847928829914:web:80dbfaa699ee25f463c2e3",
  measurementId: "G-K5THN4H0FW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Analytics (only on client side)
let analytics: any = null;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

export { analytics };
export default app;