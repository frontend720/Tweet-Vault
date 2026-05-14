import { useContext } from "react";
import "./PhotoGallery.css";
import { FirebaseContext } from "./FirebaseContext";
import { SkeletonGallery } from "./Components/Skeleton";
import EmptyState from "./Components/EmptyState";
import GalleryCard from "./Components/GalleryCard";
import UserProfileSheet from "./Components/UserProfileSheet";

export default function PhotoGallery() {
  const {
    sortedImages,
    deleteImage,
    selectedImage,
    imageSelect,
    closeImage,
    isLoading,
  } = useContext(FirebaseContext);

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
          <GalleryCard
            key={image?._id}
            image={image}
            onOpenLightbox={() => imageSelect(index)}
            onDelete={() => deleteImage(image?.tweetId)}
            lightboxOpen={selectedImage !== undefined}
          />
        ))}
      </div>

      {/* Lightbox */}
      <div
        style={selectedImage === undefined ? { display: "none" } : { display: "flex" }}
        className="modal"
        onClick={closeImage}
      >
        <img
          className="opened-image"
          src={sortedImages[selectedImage]?.imageUrl}
          alt=""
        />
      </div>

      <UserProfileSheet />
    </div>
  );
}
