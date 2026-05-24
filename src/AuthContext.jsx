import { useState, useEffect, createContext } from "react";
import { auth } from "./config";
import { signUp, signIn, signOut, onAuthStateChanged, getCurrentUser } from "@jah-cloud/auth";

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
    // Rehydrate session from refresh cookie, then unblock FirebaseContext.api()
    getCurrentUser(auth).finally(() => auth._markReady());

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
    const { error: err } = await signUp(auth, email, password);
    if (err) setError(err.message);
  }

  async function returningUser(email, password) {
    const { error: err } = await signIn(auth, email, password);
    if (err) {
      setError(err.code === "auth/invalid-credentials" ? "Invalid email or password" : err.message);
    }
  }

  async function logout() {
    await signOut(auth);
  }

  return (
    <AuthContext.Provider value={{ authenticatedUser, createUser, returningUser, logout, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext, AuthContextProvider };
