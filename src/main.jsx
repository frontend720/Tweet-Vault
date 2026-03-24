import { createRoot } from "react-dom/client";
import { TweetContextProvider } from "./TweetContext.jsx";
import "./index.css";
import App from "./App.jsx";
import { FirebaseContextProvider } from "./FirebaseContext.jsx";
import { AuthContextProvider } from "./AuthContext.jsx";
import { BrowserRouter } from "react-router-dom";
import { StrictMode } from "react";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthContextProvider>
        <TweetContextProvider>
          <FirebaseContextProvider>
            <App />
          </FirebaseContextProvider>
        </TweetContextProvider>
      </AuthContextProvider>
    </BrowserRouter>
  </StrictMode>
);
