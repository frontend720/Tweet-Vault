import { createRoot } from "react-dom/client";
import { AxiosContextProvider } from "./AxiosContext.jsx";
import "./index.css";
import App from "./App.jsx";
import { FirebaseContextProvider } from "./FirebaseContext.jsx";

createRoot(document.getElementById("root")).render(
  <AxiosContextProvider>
    <FirebaseContextProvider>
      <App />
    </FirebaseContextProvider>
  </AxiosContextProvider>
);
