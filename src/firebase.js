import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCrVEqA2nP3xHr77Z9HD8uMEAfOcV6cge4",
  authDomain: "scontitech-286b2.firebaseapp.com",
  projectId: "scontitech-286b2",
  storageBucket: "scontitech-286b2.firebasestorage.app",
  messagingSenderId: "150580080273",
  appId: "1:150580080273:web:7f543dac7ff2b136f95930",
  measurementId: "G-ZPL8M159B9"
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
