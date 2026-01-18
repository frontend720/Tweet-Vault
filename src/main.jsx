import { createRoot } from "react-dom/client";
import { AxiosContextProvider } from "./AxiosContext.jsx";
import "./index.css";
import App from "./App.jsx";
import { FirebaseContextProvider } from "./FirebaseContext.jsx";
import { AuthStateContextProvider } from "./AuthStateContext.jsx";
import { BrowserRouter } from "react-router-dom";
import { StrictMode } from "react";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthStateContextProvider>
        <AxiosContextProvider>
          <FirebaseContextProvider>
            <App />
          </FirebaseContextProvider>
        </AxiosContextProvider>
      </AuthStateContextProvider>
    </BrowserRouter>
  </StrictMode>
);
