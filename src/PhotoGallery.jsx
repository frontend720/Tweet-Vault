import { useState, useContext } from "react";
import "./PhotoGallery.css"
import { FirebaseContext } from "./FirebaseContext";
import { AxiosContext } from "./AxiosContext";
import { IoTrashOutline } from "react-icons/io5";
export default function PhotoGallery() {
  const { sortedImages, deleteImage, selectedImage, imageSelect, closeImage } = useContext(FirebaseContext);
  const {onMenuToggle} = useContext(AxiosContext);

  return (
    <>
      <div onClick={onMenuToggle} className="menu-toggle bookmark-menu-toggle">
        <i className="fa-solid fa-bars"></i>
      </div>
      <div
        style={
          selectedImage === undefined
            ? { filter: "none" }
            : { filter: "blur(5px)" }
        }
        className="gallery"
      >
        {sortedImages.map((image, index) => (
          <div key={image?.tweetId} onClick={() => imageSelect(index)}>
            <img src={image?.imageUrl} alt="" />
          </div>
        ))}
      </div>
      <div
        style={
          selectedImage === undefined
            ? { display: "none" }
            : { display: "block" }
        }
        className="modal"
        onClick={closeImage}
      >
        <button style={{background: "none", border: "none"}} onClick={() => deleteImage(sortedImages[selectedImage]?.tweetId)}><IoTrashOutline size="24px"/></button>
        <img className="opened-image" src={sortedImages[selectedImage]?.imageUrl} alt="" />
      </div>
    </>
  );
}
