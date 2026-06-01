import { useState, useEffect, createContext } from "react";
import { firebaseAuth } from "./config";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";

const AuthContext = createContext();

const AuthContextProvider = ({ children }) => {
  const [error, setError] = useState("");
  const [authenticatedUser, setAuthenticatedUser] = useState(() => {
    try {
      const saved = localStorage.getItem("authenticated-user");
      return saved !== null ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      if (user) {
        setAuthenticatedUser(user.email);
        localStorage.setItem("authenticated-user", JSON.stringify(user.email));
      } else {
        setAuthenticatedUser(null);
        localStorage.removeItem("authenticated-user");
      }
    });
    return () => unsubscribe();
  }, []);

  function extractMessage(err) {
    if (!err) return null;
    if (typeof err === "string") return err;
    return err.message || err.code || "Something went wrong.";
  }

  async function createUser(email, password) {
    try {
      await createUserWithEmailAndPassword(firebaseAuth, email, password);
    } catch (err) {
      setError(extractMessage(err));
    }
  }

  async function returningUser(email, password) {
    try {
      await signInWithEmailAndPassword(firebaseAuth, email, password);
    } catch (err) {
      const invalidCred = ["auth/invalid-credential", "auth/wrong-password", "auth/user-not-found"];
      setError(invalidCred.includes(err.code) ? "Invalid email or password" : extractMessage(err));
    }
  }

  async function signInWithGoogle() {
    try {
      await signInWithPopup(firebaseAuth, new GoogleAuthProvider());
    } catch (err) {
      setError(extractMessage(err));
    }
  }

  async function logout() {
    await firebaseSignOut(firebaseAuth);
  }

  return (
    <AuthContext.Provider value={{ authenticatedUser, createUser, returningUser, signInWithGoogle, logout, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext, AuthContextProvider };
