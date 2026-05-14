import { useContext, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { TweetContext } from "../TweetContext";
import "./UserProfileSheet.css";

function formatCount(n) {
  if (!n && n !== 0) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function UserRow({ user, onSelect }) {
  return (
    <button className="ups-user-row" onClick={() => onSelect(user.username)}>
      <img
        className="ups-user-row__avatar"
        src={user.profile_pic_url}
        alt=""
      />
      <div className="ups-user-row__info">
        <div className="ups-user-row__name-line">
          <span className="ups-user-row__name">{user.name}</span>
          {(user.is_blue_verified || user.is_verified) && (
            <i className="fa-solid fa-circle-check ups-user-row__badge" />
          )}
        </div>
        <span className="ups-user-row__handle">@{user.username}</span>
        {user.description ? (
          <p className="ups-user-row__bio">{user.description}</p>
        ) : null}
      </div>
      <div className="ups-user-row__counts">
        <span>{formatCount(user.follower_count)}</span>
        <span className="ups-user-row__counts-label">followers</span>
      </div>
    </button>
  );
}

export default function UserProfileSheet() {
  const {
    profileSheet,
    closeProfileSheet,
    profileList,
    profileListType,
    profileListToken,
    profileListLoading,
    fetchProfileList,
    fetchMoreProfileList,
    resetProfileList,
    retweetRequest,
  } = useContext(TweetContext);

  const sentinelRef = useRef(null);
  const navigate = useNavigate();

  // Infinite scroll sentinel
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !profileSheet) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && profileListToken && !profileListLoading) {
          fetchMoreProfileList(profileListType, profileSheet.userId);
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [profileSheet, profileListToken, profileListLoading, profileListType, fetchMoreProfileList]);

  if (!profileSheet) return null;

  const inList = profileListType !== null;

  function handleSelectUser(username) {
    retweetRequest(username);
    closeProfileSheet();
    navigate("/");
  }

  return (
    <>
      <div className="ups-backdrop" onClick={closeProfileSheet} />
      <div className="ups-sheet">
        <div className="ups-handle" />

        {/* Header */}
        <div className="ups-header">
          {inList && (
            <button className="ups-back-btn" onClick={resetProfileList}>
              <i className="fa-solid fa-arrow-left" />
            </button>
          )}
          <img className="ups-header__avatar" src={profileSheet.avatarUrl} alt="" />
          <div className="ups-header__meta">
            <span className="ups-header__username">@{profileSheet.username}</span>
            {inList && (
              <span className="ups-header__list-label">
                {profileListType === "followers" ? "Followers" : "Following"}
              </span>
            )}
          </div>
          <button className="ups-close-btn" onClick={closeProfileSheet}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {/* Landing — three action buttons */}
        {!inList && (
          <div className="ups-actions">
            <button
              className="ups-action-btn"
              onClick={() => { retweetRequest(profileSheet.username); closeProfileSheet(); navigate("/"); }}
            >
              <i className="fa-solid fa-photo-film" />
              <span>Feed</span>
            </button>
            <button
              className="ups-action-btn"
              onClick={() => fetchProfileList("followers", profileSheet.userId)}
            >
              <i className="fa-solid fa-users" />
              <span>Followers</span>
            </button>
            <button
              className="ups-action-btn"
              onClick={() => fetchProfileList("following", profileSheet.userId)}
            >
              <i className="fa-solid fa-user-plus" />
              <span>Following</span>
            </button>
          </div>
        )}

        {/* List view */}
        {inList && (
          <div className="ups-list">
            {(profileSheet.followerCount != null || profileSheet.followingCount != null) && (
              <p className="ups-list__total">
                {profileListType === "followers"
                  ? `${formatCount(profileSheet.followerCount)} followers`
                  : `${formatCount(profileSheet.followingCount)} following`}
              </p>
            )}
            {profileList.map((user) => (
              <UserRow
                key={user.user_id}
                user={user}
                onSelect={handleSelectUser}
              />
            ))}
            {profileListLoading && (
              <div className="ups-loading">
                <i className="fa-solid fa-circle-notch fa-spin" />
              </div>
            )}
            {profileListToken && !profileListLoading && (
              <div ref={sentinelRef} style={{ height: 1 }} />
            )}
            {!profileListLoading && profileList.length === 0 && (
              <p className="ups-empty">Nothing to show</p>
            )}
          </div>
        )}
      </div>
    </>
  );
}
