import React, { createContext, useEffect, useState } from 'react';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification
} from "firebase/auth";
import { app } from '../Authentication/firebaseConfig'; // ✅ import app

export const AuthContext = createContext(null);

const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

const AuthProvider = ({ children }) => { // ✅ fixed `children`
  const [user, setUser] = useState(null);

  // Create new user
  const createUser = (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password);
  };

  // Sign in existing user
  const signIn = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password); // ✅ fixed
  };

  // Google Sign In
  const signInWithGoogle = () => {
    return signInWithPopup(auth, googleProvider);
  };

  // Send email verification
  const sendVerificationEmail = async () => {
    if (!auth.currentUser) throw new Error('No user logged in');
    return sendEmailVerification(auth.currentUser);
  };

  // Reload user to get latest emailVerified status
  const reloadUser = async () => {
    if (!auth.currentUser) return;
    await auth.currentUser.reload();
    setUser({ ...auth.currentUser }); // Trigger state update
  };

  // Logout
  const logOut = () => {
    return signOut(auth);
  };

  // Track current user
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      console.log("Current User:", currentUser);
    });
    return () => unsubscribe();
  }, []);

  const authInfo = {
    user,
    createUser,
    signIn,
    signInWithGoogle,
    sendVerificationEmail,
    reloadUser,
    logOut
  };

  return (
    <AuthContext.Provider value={authInfo}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
