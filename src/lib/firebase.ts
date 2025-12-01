// src/lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup,
  signOut as firebaseSignOut, 
  onAuthStateChanged
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDDwP5Wqa34MhGWojSRG4Y88rVak4glGzw",
  authDomain: "kyc-auth-79bd0.firebaseapp.com",
  projectId: "kyc-auth-79bd0",
  storageBucket: "kyc-auth-79bd0.firebasestorage.app",
  messagingSenderId: "788244571372",
  appId: "1:788244571372:web:d6587e4c49215b2c0db1c9",
  measurementId: "G-8Y6ZV2VT4D"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Force account selection every time
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// ✅ Use POPUP instead of REDIRECT to avoid sessionStorage issues
export const signInWithGoogle = async () => {
  try {
    console.log("Starting Google sign-in with popup...");
    const result = await signInWithPopup(auth, googleProvider);
    console.log("✅ Popup sign-in successful:", result.user.email);
    return { success: true, user: result.user };
  } catch (error: any) {
    console.error("Google sign-in error:", error);
    
    // Handle specific popup errors
    if (error.code === 'auth/popup-closed-by-user') {
      return { success: false, error: "Sign-in cancelled" };
    }
    if (error.code === 'auth/popup-blocked') {
      return { success: false, error: "Popup blocked by browser. Please allow popups for this site." };
    }
    
    return { success: false, error: error.message };
  }
};

// Export auth for other components to use
export { onAuthStateChanged };