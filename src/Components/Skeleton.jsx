import "./Skeleton.css";

export function SkeletonBookmark() {
  return (
    <div className="sk-bookmark">
      <div className="sk sk-bookmark__video" />
      <div className="sk sk-bookmark__delete" />
      <div className="sk-bookmark__user">
        <div className="sk sk-bookmark__name" />
        <div className="sk sk-bookmark__time" />
      </div>
      <div className="sk-bookmark__controls">
        <div className="sk sk-bookmark__play" />
        <div className="sk sk-bookmark__scrubber" />
        <div className="sk sk-bookmark__speed" />
      </div>
    </div>
  );
}

export function SkeletonFeed() {
  return (
    <div className="sk-feed">
      <div className="sk sk-feed__video" />
      <div className="sk-feed__meta">
        <div className="sk-feed__meta-top">
          <div className="sk sk-feed__avatar" />
          <div className="sk-feed__lines">
            <div className="sk sk-feed__line--long" />
            <div className="sk sk-feed__line--short" />
          </div>
        </div>
        <div className="sk sk-feed__date" />
      </div>
    </div>
  );
}

export function SkeletonGallery({ count = 12 }) {
  return (
    <div className="sk-gallery">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="sk sk-gallery__cell" />
      ))}
    </div>
  );
}
