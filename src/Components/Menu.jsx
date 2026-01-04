import { useState, useContext } from "react";
import "./Menu.css";
import { AxiosContext } from "../AxiosContext";
import {Link} from "react-router-dom"

export default function Menu() {
    const {onMenuToggle} = useContext(AxiosContext)
  const [isHomeSelected, setIsHomeSelected] = useState(false);
  const [isBookmarksSelected, setIsBookmarkSelected] = useState(false);
  const [isAccountSelected, setIsAccountSelected] = useState(false);

  function homeSelection() {
    setIsHomeSelected(true);
    setIsBookmarkSelected(false);
    setIsAccountSelected(false);
    onMenuToggle()
  }

  function bookmarksSelection() {
    setIsBookmarkSelected(true);
    setIsHomeSelected(false);
    setIsAccountSelected(false);
    onMenuToggle()
  }

  function accountSelection() {
    setIsAccountSelected(true);
    setIsHomeSelected(false);
    setIsBookmarkSelected(false);
    onMenuToggle()
  }

  return (
    <div className="Menu">
      <nav>
        <div onClick={onMenuToggle} className="close-button">
          <i class="fa-solid fa-xmark"></i>
        </div>
        <Link to="/">
        <div
          onClick={homeSelection}
          className={isHomeSelected ? "nav-item-selected" : "nav-item"}
        >
          Home
        </div>
        </Link>
        <Link to="bookmarks">
        
        <div
          onClick={bookmarksSelection}
          className={isBookmarksSelected ? "nav-item-selected" : "nav-item"}
        >
          Bookmarks
        </div>
        </Link>
        <div
          onClick={accountSelection}
          className={isAccountSelected ? "nav-item-selected" : "nav-item"}
        >
          Account
        </div>
      </nav>
    </div>
  );
}