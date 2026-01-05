import "./App.css";
import { useContext } from "react";
import Bookmarks from "./Bookmarks";
import Carousel from "./Carousel";
import Menu from "./Components/Menu"; // Ensure path is correct
import { AxiosContext } from "./AxiosContext";
import { Routes, Route } from "react-router-dom";
import Authentication from "./Authentication";
import { FirebaseContext } from "./FirebaseContext";

export default function App() {
  // 1. Get the toggle state from context
  const { menuToggle } = useContext(AxiosContext);
  const { authState, logout } = useContext(FirebaseContext);

  return (
    <>
      {menuToggle && <Menu />}
      <div style={menuToggle ? {display: "none"} : {display: ""}}>

     
      </div>
      {authState == null ? (
        <Authentication />
      ) : (
        <Routes>
          <Route index element={<Carousel />} />
          <Route path="bookmarks" element={<Bookmarks />} />
        </Routes>
      )}

      {/* <Authentication /> */}
      {/* <Carousel/> */}
    </>
  );
}
