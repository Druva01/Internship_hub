import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyButthPXAxwsmRgVeQ8L2fozujqOpFsENY",
  authDomain: "internshiphub-51dd7.firebaseapp.com",
  projectId: "internshiphub-51dd7",
  storageBucket: "internshiphub-51dd7.firebasestorage.app",
  messagingSenderId: "719399069026",
  appId: "1:719399069026:web:057aa0fccda3227771b83b",
  measurementId: "G-9VDXL4JXL0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Cloud Storage and get a reference to the service
export const storage = getStorage(app);

export default app;

