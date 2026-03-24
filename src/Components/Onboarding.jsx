import "./Onboarding.css";

const BULLETS = [
  { icon: "fa-solid fa-photo-film", text: "Browse photos and videos from any X account" },
  { icon: "fa-solid fa-heart", text: "Save what catches your eye with one tap" },
  { icon: "fa-solid fa-vault", text: "Revisit your saves — tagged and searchable by intent" },
];

export default function Onboarding({ onDismiss }) {
  return (
    <div className="onboarding">
      <div className="onboarding__card">
        <div className="onboarding__icon">
          <i className="fa-solid fa-vault" />
        </div>

        <h1 className="onboarding__title">TweetVault</h1>
        <p className="onboarding__tagline">Your personal media vault for X</p>

        <ul className="onboarding__bullets">
          {BULLETS.map(({ icon, text }) => (
            <li key={text} className="onboarding__bullet">
              <i className={`${icon} onboarding__bullet-icon`} />
              <span>{text}</span>
            </li>
          ))}
        </ul>

        <button className="onboarding__cta" onClick={onDismiss}>
          Start browsing
        </button>
      </div>
    </div>
  );
}
