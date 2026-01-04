import "./App.css";
import { useContext } from "react";
import Bookmarks from "./Bookmarks";
import Carousel from "./Carousel";
import Menu from "./Components/Menu"; // Ensure path is correct
import { AxiosContext } from "./AxiosContext";
import { Routes, Route } from "react-router-dom";

export default function App() {
  // 1. Get the toggle state from context
  const { menuToggle } = useContext(AxiosContext);

  return (
  
      <>
     
      {menuToggle && <Menu />}
      <Routes>
        <Route index element={<Carousel />} />
        <Route path="bookmarks" element={<Bookmarks />} />
      </Routes>
      {/* <Carousel/> */}
    </>
   
  );
}
