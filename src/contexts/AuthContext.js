import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  updateProfile 
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

  // Sign up function
  const signup = async (email, password, userData) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Create user profile in Firestore
    const userDoc = {
      uid: user.uid,
      email: user.email,
      ...userData,
      createdAt: new Date().toISOString(),
    };
    
    await setDoc(doc(db, 'users', user.uid), userDoc);
    return userCredential;
  };

  // Sign in function
  const signin = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  // Google sign in function
  const signInWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Check if user profile already exists
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) {
      // Create user profile for new Google users
      const userData = {
        uid: user.uid,
        email: user.email,
        firstName: user.displayName?.split(' ')[0] || '',
        lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
        photoURL: user.photoURL,
        role: 'student',
        createdAt: new Date().toISOString(),
        authProvider: 'google'
      };
      await setDoc(doc(db, 'users', user.uid), userData);
    }
    
    return result;
  };

  // Update user profile
  const updateUserProfile = async (profileData) => {
    if (currentUser) {
      // Update Firebase Auth profile
      if (profileData.displayName) {
        await updateProfile(currentUser, { displayName: profileData.displayName });
      }
      
      // Update Firestore profile
      await updateDoc(doc(db, 'users', currentUser.uid), {
        ...profileData,
        updatedAt: new Date().toISOString()
      });
      
      // Refresh user profile
      const updatedDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (updatedDoc.exists()) {
        setUserProfile(updatedDoc.data());
      }
    }
  };

  // Sign out function
  const logout = async () => {
    try {
      // Clear state first to prevent race conditions
      setUserProfile(null);
      await signOut(auth);
      // State will be cleared by the auth state listener
    } catch (error) {
      console.error('Error during logout:', error);
      // Force clear state even if signOut fails
      setCurrentUser(null);
      setUserProfile(null);
      throw error;
    }
  };

  // Reset password function
  const resetPassword = (email) => {
    return sendPasswordResetEmail(auth, email);
  };

  useEffect(() => {
    let isMounted = true; // Track if component is mounted
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!isMounted) return; // Don't update state if component unmounted
      
      setCurrentUser(user);
      
      if (user) {
        // Fetch user profile from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists() && isMounted) {
            setUserProfile(userDoc.data());
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      } else {
        if (isMounted) {
          setUserProfile(null);
        }
      }
      
      if (isMounted) {
        setLoading(false);
      }
    });

    return () => {
      isMounted = false; // Mark as unmounted
      unsubscribe();
    };
  }, []);

  const value = {
    currentUser,
    userProfile,
    signup,
    signin,
    signInWithGoogle,
    updateUserProfile,
    logout,
    resetPassword,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
