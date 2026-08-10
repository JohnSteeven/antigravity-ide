import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiArrowRight,
  FiHash,
  FiUser,
  FiUsers,
  FiVolume2,
  FiVolumeX,
} from "react-icons/fi";
import { multiplayerApi } from "./api/multiplayerApi";
import { lifeAuctionEnabled } from "./config";
import { getGameComponent } from "./games/registry";
import messages from "./messages/en";
import useMultiplayerRoom from "./realtime/useMultiplayerRoom";
import {
  clearGameSession,
  normalizeRoomCode,
  readGameSession,
  saveGameSession,
} from "./session";
import {
  playSfx,
  startMusicLoop,
  stopMusicLoop,
  toggleGameMute,
} from "../../utils/gameAudioEngine";
import "./play-with-friends.css";

const gameChoices = [
  ...(lifeAuctionEnabled ? [{ key: "life-auction", icon: "🪙" }] : []),
  { key: "who-knows-me-better", icon: "👀" },
];

const EntryScreen = ({ deepCode, mode, setMode, selectedGame, setSelectedGame, onCreate, onJoin, busy, error }) => {
  const [nickname, setNickname] = useState("");
  const [code, setCode] = useState(deepCode || "");

  useEffect(() => {
    if (deepCode) {
      setCode(deepCode);
      setMode("join");
    }
  }, [deepCode, setMode]);

  const submit = (event) => {
    event.preventDefault();
    if (mode === "create") onCreate(nickname, selectedGame);
    else onJoin(code, nickname);
  };

  return (
    <main className="pwf-entry">
      <div className="pwf-entry-visual" aria-hidden="true" />
      <div className="pwf-entry-content">
        <Link to="/about#games" className="pwf-back-link"><FiArrowLeft /> {messages.common.aboutMe}</Link>
        <div className="pwf-entry-title">
          <span className="pwf-eyebrow">{messages.entry.presentedBy}</span>
          <h1>{messages.title}</h1>
          <p>{messages.tagline}</p>
        </div>

        <section className="pwf-entry-panel" aria-labelledby="pwf-entry-game">
          <div className="pwf-game-name"><FiUsers aria-hidden="true" /><div><span>{messages.entry.nowPlaying}</span><h2 id="pwf-entry-game">Play With Friends</h2></div></div>
          <div className="pwf-segmented" aria-label="Room action">
            <button type="button" className={mode === "create" ? "is-active" : ""} onClick={() => setMode("create")}>{messages.entry.createTab}</button>
            <button type="button" className={mode === "join" ? "is-active" : ""} onClick={() => setMode("join")}>{messages.entry.joinTab}</button>
          </div>
          {mode === "create" && (
            <div className="pwf-game-picker" role="radiogroup" aria-label="Game">
              {gameChoices.map((choice) => {
                const copy = messages.entry.games[choice.key];
                const active = selectedGame === choice.key;
                return (
                  <button key={choice.key} type="button" role="radio" aria-checked={active} className={active ? "is-active" : ""} onClick={() => setSelectedGame(choice.key)}>
                    <span className="pwf-game-picker-icon" aria-hidden="true">{choice.icon}</span>
                    <span><strong>{copy.title}</strong><small>{copy.description}</small><b>{copy.cta} →</b></span>
                  </button>
                );
              })}
            </div>
          )}
          <form onSubmit={submit}>
            {mode === "join" && (
              <label>
                {messages.entry.roomCode}
                <span className="pwf-input-wrap"><FiHash /><input
                  autoComplete="off"
                  inputMode="text"
                  maxLength="7"
                  placeholder="MJ-7K2P"
                  required
                  value={code}
                  onChange={(event) => setCode(normalizeRoomCode(event.target.value))}
                /></span>
              </label>
            )}
            <label>
              {messages.entry.nickname}
              <span className="pwf-input-wrap"><FiUser /><input
                autoComplete="nickname"
                maxLength="24"
                minLength="2"
                placeholder={mode === "create" ? messages.entry.hostPlaceholder : messages.entry.playerPlaceholder}
                required
                value={nickname}
                onChange={(event) => setNickname(event.target.value)}
              /></span>
            </label>
            {error && <div className="pwf-error" role="alert">{error}</div>}
            <button className="pwf-primary-button" type="submit" disabled={busy}>
              {busy ? messages.entry.opening : mode === "create" ? messages.entry.createTab : messages.entry.joinTab} <FiArrowRight />
            </button>
          </form>
        </section>
      </div>
    </main>
  );
};

const PlayWithFriendsPage = () => {
  const { code: routeCodeValue } = useParams();
  const routeCode = normalizeRoomCode(routeCodeValue);
  const navigate = useNavigate();
  const [mode, setMode] = useState(routeCode ? "join" : "create");
  const [selectedGame, setSelectedGame] = useState(lifeAuctionEnabled ? "life-auction" : "who-knows-me-better");
  const [token, setToken] = useState("");
  const [initialRoom, setInitialRoom] = useState(null);
  const [entryError, setEntryError] = useState("");
  const [busy, setBusy] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => window.localStorage.getItem("myjourney.pwf.sound") !== "off");
  const attemptedResume = useRef("");

  useEffect(() => {
    document.body.classList.add("play-with-friends-active");
    return () => document.body.classList.remove("play-with-friends-active");
  }, []);

  const invalidateSession = useCallback(() => {
    const code = initialRoom?.code || routeCode;
    if (code) clearGameSession(code);
    setToken("");
    setInitialRoom(null);
    if (code) navigate(`/play-with-friends/join/${code}`, { replace: true });
  }, [initialRoom?.code, routeCode, navigate]);

  const { command, connection, error: roomError, room } = useMultiplayerRoom({
    token,
    initialRoom,
    onInvalidSession: invalidateSession,
  });

  useEffect(() => {
    if (!routeCode || token || attemptedResume.current === routeCode) return;
    attemptedResume.current = routeCode;
    const savedToken = readGameSession(routeCode);
    if (!savedToken) {
      setMode("join");
      return;
    }
    setBusy(true);
    multiplayerApi.resumeRoom(routeCode, savedToken)
      .then((response) => {
        setInitialRoom(response.room);
        setToken(response.token);
      })
      .catch(() => {
        clearGameSession(routeCode);
        setMode("join");
      })
      .finally(() => setBusy(false));
  }, [routeCode, token]);

  const openSession = (response) => {
    saveGameSession(response.room.code, response.token);
    setInitialRoom(response.room);
    setToken(response.token);
    navigate(`/play-with-friends/room/${response.room.code}`, { replace: true });
  };

  const createRoom = async (nickname, gameKey) => {
    setBusy(true);
    setEntryError("");
    try {
      openSession(await multiplayerApi.createRoom({
        gameKey,
        nickname,
        locale: "en",
      }));
    } catch (error) {
      setEntryError(error.message);
    } finally {
      setBusy(false);
    }
  };

  const joinRoom = async (rawCode, nickname) => {
    const code = normalizeRoomCode(rawCode);
    if (!/^MJ-[A-HJ-NP-Z2-9]{4}$/.test(code)) {
      setEntryError(messages.entry.invalidCode);
      return;
    }
    setBusy(true);
    setEntryError("");
    try {
      openSession(await multiplayerApi.joinRoom(code, { nickname }));
    } catch (error) {
      setEntryError(error.message);
    } finally {
      setBusy(false);
    }
  };

  const toggleSound = () => {
    const isMutedNow = toggleGameMute();
    setSoundEnabled(!isMutedNow);
    window.localStorage.setItem("myjourney.pwf.sound", isMutedNow ? "off" : "on");
  };

  const activeRoom = room || initialRoom;

  useEffect(() => {
    if (!soundEnabled) {
      stopMusicLoop();
      return undefined;
    }
    const gameKey = (activeRoom?.game?.key || selectedGame || "").toLowerCase();
    if (gameKey.includes("auction") || gameKey.includes("life_auction")) {
      startMusicLoop("life-auction");
    } else {
      startMusicLoop("who-knows-me-better");
    }
    return () => {
      stopMusicLoop();
    };
  }, [activeRoom?.game?.key, selectedGame, soundEnabled]);

  const celebrate = useCallback((positive) => {
    if (!soundEnabled) return;
    navigator.vibrate?.(positive ? [35, 35, 55] : 25);
    playSfx(positive ? "win" : "outbid");
  }, [soundEnabled]);

  const GameComponent = useMemo(() => activeRoom ? getGameComponent(activeRoom.game?.key) : null, [activeRoom?.game?.key]);

  if (!token || !activeRoom) {
    return <EntryScreen deepCode={routeCode} mode={mode} setMode={setMode} selectedGame={selectedGame} setSelectedGame={setSelectedGame} onCreate={createRoom} onJoin={joinRoom} busy={busy} error={entryError} />;
  }

  return (
    <div className="pwf-shell">
      <header className="pwf-topbar">
        <Link to="/about#games" className="pwf-back-link"><FiArrowLeft /> {messages.common.myJourney}</Link>
        <div className="pwf-room-identity">
          <strong>Play With Friends</strong>
          <span>{activeRoom.code}</span>
        </div>
        <div className="pwf-top-actions">
          <span className={`pwf-connection is-${connection}`}><i />{messages.connection[connection] || connection}</span>
          <button type="button" className="pwf-icon-button" onClick={toggleSound} title={soundEnabled ? messages.sound.mute : messages.sound.enable} aria-label={soundEnabled ? messages.sound.mute : messages.sound.enable}>
            {soundEnabled ? <FiVolume2 /> : <FiVolumeX />}
          </button>
        </div>
      </header>
      {roomError && <div className="pwf-global-error" role="alert">{roomError}</div>}
      {GameComponent
        ? <Suspense fallback={<main className="pwf-game-stage"><div className="pwf-loading-game">{messages.common.loadingGame}</div></main>}><GameComponent room={activeRoom} command={command} celebrate={celebrate} /></Suspense>
        : <main className="pwf-game-stage"><div className="pwf-error">This game client is not available.</div></main>}
      <div className="pwf-live-region" aria-live="polite" aria-atomic="true">
        {activeRoom.status === "ROUND_REVEAL" ? messages.accessibility.reveal : ""}
      </div>
    </div>
  );
};

export default PlayWithFriendsPage;
