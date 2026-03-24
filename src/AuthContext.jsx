import { useState, useEffect, createContext } from "react";
import { auth } from "./config";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  signInWithPopup,
} from "firebase/auth";

const AuthContext = createContext();
const googleProvider = new GoogleAuthProvider();

const AuthContextProvider = ({ children }) => {
  const [error, setError] = useState("");
  const [authenticatedUser, setAuthenticatedUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("authenticated-user");
      return savedUser !== null ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
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

  async function createUser(email, password) {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
      if (error.code === "auth/invalid-email") {
        setError("Must provide a valid E-mail to continue");
      } else {
        setError(error.message);
      }
    }
  }

  async function returningUser(email, password) {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      if (error.code === "auth/invalid-email") {
        setError("Must provide a valid E-mail to continue");
      } else {
        setError(error.message);
      }
    }
  }

  async function signInWithGoogle() {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.log(error);
    }
  }

  async function logout() {
    try {
      await signOut(auth);
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        authenticatedUser,
        createUser,
        returningUser,
        signInWithGoogle,
        logout,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext, AuthContextProvider };
