import { createRoot } from "react-dom/client";
import { AxiosContextProvider } from "./AxiosContext.jsx";
import "./index.css";
import App from "./App.jsx";
import { FirebaseContextProvider } from "./FirebaseContext.jsx";
import { createBrowserRouter } from "react-router";
import {  BrowserRouter } from "react-router-dom";
import Carousel from "./Carousel.jsx";
import Bookmarks from "./Bookmarks.jsx";

const render = createBrowserRouter([
  {
    path: "/",
    element: <Carousel />
  },
  {
    path: "/bookmarks",
    element: <Bookmarks />
  }
])

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AxiosContextProvider>
      <FirebaseContextProvider>
        <App />
      </FirebaseContextProvider>
    </AxiosContextProvider>
   </BrowserRouter>
);
