import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { FiArrowRight, FiHash, FiShield, FiUser, FiUsers } from "react-icons/fi";
import { PLAY_GAMES, getSoloGames, getMultiplayerGames } from "./playCatalog";
import "./play-hub.css";

const PlayHubPage = () => {
  const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState("");
  const [joinError, setJoinError] = useState("");

  const handleJoin = (e) => {
    e.preventDefault();
    setJoinError("");
    const cleaned = roomCode.trim().toUpperCase();
    if (!cleaned) return;
    if (!/^(MJ-)?[A-Z0-9]{4,8}$/.test(cleaned)) {
      setJoinError("Please enter a valid room code (e.g. MJ-7K2P).");
      return;
    }
    const finalCode = cleaned.startsWith("MJ-") ? cleaned : `MJ-${cleaned}`;
    navigate(`/play-with-friends/join/${finalCode}`);
  };

  const soloGames = getSoloGames();
  const multiplayerGames = getMultiplayerGames();

  return (
    <div className="play-hub-container">
      <header className="play-hub-hero">
        <span className="play-hub-eyebrow">Interactive Experiences</span>
        <h1 className="play-hub-title">MyJourney Play</h1>
        <p className="play-hub-subtitle">
          Reflective solo journeys and live social multiplayer games designed around connection,
          self-discovery, and meaningful trade-offs.
        </p>
      </header>

      {/* Quick Room Join Bar */}
      <section className="play-hub-join-bar" aria-labelledby="quick-join-heading">
        <div className="play-hub-join-info">
          <FiHash className="play-hub-join-icon" aria-hidden="true" />
          <div>
            <strong id="quick-join-heading">Have a room code?</strong>
            <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--text-secondary, #64748b)" }}>
              Join a friend's live party game instantly.
            </p>
          </div>
        </div>
        <form className="play-hub-join-form" onSubmit={handleJoin}>
          <input
            type="text"
            className="play-hub-code-input"
            placeholder="MJ-XXXX"
            maxLength={10}
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            aria-label="Room code"
          />
          <button type="submit" className="play-hub-join-btn">
            Join <FiArrowRight />
          </button>
        </form>
      </section>
      {joinError && (
        <div style={{ color: "#ef4444", fontSize: "0.875rem", marginTop: "-2rem", marginBottom: "2rem", textAlign: "right" }} role="alert">
          {joinError}
        </div>
      )}

      {/* Section 1: Solo Reflections */}
      <section className="play-hub-section" aria-labelledby="solo-heading">
        <div className="play-hub-section-header">
          <h2 id="solo-heading" className="play-hub-section-title">
            <FiUser aria-hidden="true" /> Solo Reflections
          </h2>
          <span style={{ fontSize: "0.875rem", color: "var(--text-muted, #94a3b8)" }}>
            Private · Zero Scoring
          </span>
        </div>
        <div className="play-hub-grid">
          {soloGames.map((game) => (
            <article key={game.id} className="play-game-card" aria-labelledby={`game-title-${game.id}`}>
              <div className="play-game-card-top">
                <span className="play-game-icon" aria-hidden="true">{game.icon}</span>
                <div className="play-game-badges">
                  <span className="play-badge play-badge-players">{game.players}</span>
                  {game.badge && <span className="play-badge play-badge-tag">{game.badge}</span>}
                </div>
              </div>
              <div className="play-game-card-body">
                <h3 id={`game-title-${game.id}`}>{game.title}</h3>
                <div className="play-game-tagline">{game.tagline}</div>
                <p className="play-game-desc">{game.description}</p>
              </div>
              <div className="play-game-card-footer">
                <span className="play-game-meta">{game.duration}</span>
                {game.status === "available" ? (
                  <Link to={game.route} className="play-game-action-btn">
                    Play Now <FiArrowRight />
                  </Link>
                ) : (
                  <span className="play-game-action-btn is-disabled" aria-disabled="true">
                    Coming Soon
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Section 2: Play With Friends (Multiplayer) */}
      <section className="play-hub-section" aria-labelledby="multiplayer-heading">
        <div className="play-hub-section-header">
          <h2 id="multiplayer-heading" className="play-hub-section-title">
            <FiUsers aria-hidden="true" /> Play With Friends
          </h2>
          <span style={{ fontSize: "0.875rem", color: "var(--text-muted, #94a3b8)" }}>
            Live Rooms · Real-Time Sync
          </span>
        </div>
        <div className="play-hub-grid">
          {multiplayerGames.map((game) => (
            <article key={game.id} className="play-game-card" aria-labelledby={`game-title-${game.id}`}>
              <div className="play-game-card-top">
                <span className="play-game-icon" aria-hidden="true">{game.icon}</span>
                <div className="play-game-badges">
                  <span className="play-badge play-badge-players">{game.players}</span>
                  {game.badge && <span className="play-badge play-badge-tag">{game.badge}</span>}
                </div>
              </div>
              <div className="play-game-card-body">
                <h3 id={`game-title-${game.id}`}>{game.title}</h3>
                <div className="play-game-tagline">{game.tagline}</div>
                <p className="play-game-desc">{game.description}</p>
              </div>
              <div className="play-game-card-footer">
                <span className="play-game-meta">{game.duration}</span>
                <Link to={game.route} className="play-game-action-btn">
                  Launch Room <FiArrowRight />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Privacy Notice */}
      <footer className="play-hub-privacy-callout">
        <FiShield style={{ fontSize: "1.75rem", flexShrink: 0, color: "#0284c7" }} aria-hidden="true" />
        <div>
          <strong>Server-Authoritative & Private by Default</strong>
          <p style={{ margin: 0 }}>
            All multiplayer game scores and budgets are managed strictly server-side. Play experiences
            never read or write to your personal MyJourney Life workspace, journals, or private health data.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default PlayHubPage;
