import { useContext } from "react";
import "./PhotoGallery.css";
import { FirebaseContext } from "./FirebaseContext";
import { IoTrashOutline } from "react-icons/io5";
import { SkeletonGallery } from "./Components/Skeleton";
import EmptyState from "./Components/EmptyState";

export default function PhotoGallery() {
  const { sortedImages, deleteImage, selectedImage, imageSelect, closeImage, isLoading } = useContext(FirebaseContext);

  if (isLoading) {
    return (
      <div className="gallery-page">
        <h2 className="gallery-title">Gallery</h2>
        <SkeletonGallery count={12} />
      </div>
    );
  }

  return (
    <div className="gallery-page">
      <h2 className="gallery-title">Gallery</h2>
      {sortedImages.length === 0 && (
        <EmptyState
          icon="fa-solid fa-photo-film"
          title="No photos saved yet"
          body="Tap the heart on any image in the feed to save it to your gallery."
        />
      )}
      <div
        style={selectedImage === undefined ? { filter: "none" } : { filter: "blur(5px)" }}
        className="gallery"
      >
        {sortedImages.map((image, index) => (
          <div key={image?.tweetId} onClick={() => imageSelect(index)}>
            <img src={image?.imageUrl} alt="" />
          </div>
        ))}
      </div>
      <div
        style={selectedImage === undefined ? { display: "none" } : { display: "flex" }}
        className="modal"
        onClick={closeImage}
      >
        <button
          onClick={(e) => { e.stopPropagation(); deleteImage(sortedImages[selectedImage]?.tweetId); }}
        >
          <IoTrashOutline size="22px" />
        </button>
        <img className="opened-image" src={sortedImages[selectedImage]?.imageUrl} alt="" />
      </div>
    </div>
  );
}
