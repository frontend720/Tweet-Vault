import "./App.css";
import { useContext, lazy, Suspense, useState } from "react";
import { Routes, Route } from "react-router-dom";
import Authentication from "./Authentication";
import { AuthContext } from "./AuthContext";
import CommandDock from "./Components/CommandDock";
import Onboarding from "./Components/Onboarding";

const Carousel     = lazy(() => import("./Carousel"));
const Bookmarks    = lazy(() => import("./Bookmarks"));
const PhotoGallery = lazy(() => import("./PhotoGallery"));
const Settings     = lazy(() => import("./Settings"));
const PersonaChat  = lazy(() => import("./Components/PersonaChat"));

export default function App() {
  const { authenticatedUser } = useContext(AuthContext);
  const [showOnboarding, setShowOnboarding] = useState(
    () => !localStorage.getItem("tv_onboarded"),
  );

  function dismissOnboarding() {
    localStorage.setItem("tv_onboarded", "1");
    setShowOnboarding(false);
  }

  return (
    <div className="App">
      {authenticatedUser == null ? (
        <Authentication />
      ) : (
        <>
          {showOnboarding && <Onboarding onDismiss={dismissOnboarding} />}
          <div className="page-content">
            <Suspense fallback={null}>
              <Routes>
                <Route index element={<Carousel />} />
                <Route path="bookmarks" element={<Bookmarks />} />
                <Route path="gallery" element={<PhotoGallery />} />
                <Route path="settings" element={<Settings />} />
                <Route path="chat/:username" element={<PersonaChat />} />
              </Routes>
            </Suspense>
          </div>
          <CommandDock />
        </>
      )}
    </div>
  );
}
