import React, { createContext, useEffect, useMemo, useRef, useState } from 'react';
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
  const [loading, setLoading] = useState(true);
  const [isSuspended, setIsSuspended] = useState(false);
  const suspensionTimerRef = useRef(null);

  const API_BASE = useMemo(() => (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, ''), []);

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

  const checkSuspension = async (uid) => {
    try {
      const res = await fetch(`${API_BASE}/api/users/${encodeURIComponent(uid)}`);
      if (!res.ok) return false;
      const doc = await res.json();
      return !!doc?.isSuspended;
    } catch {
      return false;
    }
  };

  // Track current user
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(true);
      setIsSuspended(false);

      if (suspensionTimerRef.current) {
        clearInterval(suspensionTimerRef.current);
        suspensionTimerRef.current = null;
      }

      if (!currentUser) {
        setLoading(false);
        return;
      }

      const uid = currentUser.uid;
      // Initial suspension check
      (async () => {
        const suspended = await checkSuspension(uid);
        setIsSuspended(suspended);
        setLoading(false);
      })();

      // Periodically re-check (so admin suspensions take effect without reload)
      suspensionTimerRef.current = setInterval(async () => {
        const suspended = await checkSuspension(uid);
        setIsSuspended(suspended);
      }, 30000);
    });
    return () => unsubscribe();
  }, []);

  const getIdToken = async () => {
    if (!auth.currentUser) return null;
    return auth.currentUser.getIdToken();
  };

  const authInfo = {
    user,
    loading,
    isSuspended,
    createUser,
    signIn,
    signInWithGoogle,
    sendVerificationEmail,
    reloadUser,
    logOut,
    getIdToken,
    API_BASE,
  };

  return (
    <AuthContext.Provider value={authInfo}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
