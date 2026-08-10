import { useEffect, useRef, useState } from "react";
import {
  FiArrowRight,
  FiCheck,
  FiClock,
  FiCopy,
  FiAward,
  FiRefreshCw,
  FiShare2,
  FiUserMinus,
  FiUsers,
} from "react-icons/fi";
import { multiplayerApi } from "../../api/multiplayerApi";
import messages from "../../messages/en";
import { lifeAuctionEnabled } from "../../config";

import { playSfx } from "../../../../utils/gameAudioEngine";

const useCountdown = (deadline) => {
  const [remaining, setRemaining] = useState(0);
  useEffect(() => {
    const update = () => setRemaining(deadline ? Math.max(0, Math.ceil((new Date(deadline).getTime() - Date.now()) / 1000)) : 0);
    update();
    const timer = window.setInterval(update, 250);
    return () => window.clearInterval(timer);
  }, [deadline]);
  return remaining;
};

const PlayerRoster = ({ room, command, busy, run }) => {
  const isHost = room.self.role === "HOST";
  return (
    <section className="pwf-roster" aria-labelledby="pwf-players-title">
      <div className="pwf-section-heading">
        <div>
          <span className="pwf-eyebrow">{messages.lobby.room}</span>
          <h2 id="pwf-players-title">{messages.lobby.players} <small>{room.players.length}/{room.settings.maxPlayers}</small></h2>
        </div>
        <FiUsers aria-hidden="true" />
      </div>
      <ul>
        {room.players.map((player) => (
          <li key={player.id}>
            <span className={`pwf-presence ${player.connected ? "is-online" : ""}`} aria-label={player.connected ? messages.lobby.connected : messages.lobby.away} />
            <strong>{player.nickname}{player.id === room.self.id ? " (you)" : ""}</strong>
            {player.role === "HOST" && <span className="pwf-host-mark"><FiAward /> {messages.lobby.host}</span>}
            {isHost && player.id !== room.self.id && ["LOBBY", "HOST_SETUP", "READY"].includes(room.status) && (
              <span className="pwf-player-actions">
                <button
                  type="button"
                  className="pwf-icon-button"
                  title={messages.lobby.makeHost}
                  aria-label={`${messages.lobby.makeHost}: ${player.nickname}`}
                  disabled={busy}
                  onClick={() => run(() => command("host:transfer", { targetPlayerId: player.id }))}
                ><FiAward /></button>
                <button
                  type="button"
                  className="pwf-icon-button"
                  title={messages.lobby.removePlayer}
                  aria-label={`${messages.lobby.removePlayer}: ${player.nickname}`}
                  disabled={busy}
                  onClick={() => run(() => command("player:remove", { targetPlayerId: player.id }))}
                ><FiUserMinus /></button>
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
};

const InvitePanel = ({ room }) => {
  const [copied, setCopied] = useState(false);
  const inviteUrl = `${window.location.origin}/play-with-friends/join/${room.code}`;
  const copyInvite = async () => {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };
  const shareInvite = async () => {
    if (navigator.share) {
      await navigator.share({ title: messages.title, text: messages.lobby.shareText(room.code), url: inviteUrl });
      return;
    }
    await copyInvite();
  };
  return (
    <section className="pwf-invite" aria-labelledby="pwf-invite-title">
      <div>
        <span className="pwf-eyebrow">{messages.lobby.invite}</span>
        <h2 id="pwf-invite-title">{room.code}</h2>
        <div className="pwf-invite-actions">
          <button type="button" className="pwf-secondary-button" onClick={copyInvite}>
            {copied ? <FiCheck /> : <FiCopy />} {copied ? messages.lobby.copied : messages.lobby.copyLink}
          </button>
          <button type="button" className="pwf-icon-button pwf-share-button" onClick={shareInvite} title={messages.lobby.shareInvite} aria-label={messages.lobby.shareInvite}>
            <FiShare2 />
          </button>
        </div>
      </div>
      <img src={multiplayerApi.inviteQrUrl(room.code)} alt={`QR code for room ${room.code}`} />
    </section>
  );
};

const HostSetup = ({ room, command, busy, run }) => {
  const [categories, setCategories] = useState(room.settings.categories);
  const [questionCount, setQuestionCount] = useState(room.settings.questionCount);
  const [roundDurationSec, setRoundDurationSec] = useState(room.settings.roundDurationSec);
  const [answers, setAnswers] = useState(room.hostSetup?.answers || {});
  const questions = room.hostSetup?.questions || [];
  const questionKey = questions.map((question) => question.id).join("|");
  const savedAnswerKey = JSON.stringify(room.hostSetup?.answers || {});

  const [saved, setSaved] = useState(() => Boolean(room.hostSetup?.answers && Object.keys(room.hostSetup.answers).length > 0));

  useEffect(() => {
    setCategories(room.settings.categories);
    setQuestionCount(room.settings.questionCount);
    setRoundDurationSec(room.settings.roundDurationSec);
    setAnswers(room.hostSetup?.answers || {});
    if (room.hostSetup?.answers && Object.keys(room.hostSetup.answers).length > 0) {
      setSaved(true);
    }
  }, [questionKey, savedAnswerKey]);

  const complete = questions.length > 0 && questions.every((question) => answers[question.id]);
  const toggleCategory = (category) => {
    setSaved(false);
    setCategories((current) =>
      current.includes(category) ? current.filter((item) => item !== category) : [...current, category]
    );
  };

  const prepare = () => run(async () => {
    await command("host:prepare", {
      categories,
      questionCount: Number(questionCount),
      roundDurationSec: Number(roundDurationSec),
    });
    setSaved(false);
  });
  const save = () => run(async () => {
    await command("host:setup", { answers });
    setSaved(true);
    playSfx("win");
  });

  return (
    <section className="pwf-setup" aria-labelledby="pwf-setup-title">
      <div className="pwf-section-heading">
        <div>
          <span className="pwf-eyebrow">{messages.lobby.hostSetup}</span>
          <h2 id="pwf-setup-title">{messages.lobby.chooseTruth}</h2>
        </div>
        <span className="pwf-private-label">{messages.lobby.private}</span>
      </div>

      <div className="pwf-settings-row">
        <label>{messages.lobby.questions}
          <select value={questionCount} onChange={(event) => { setQuestionCount(event.target.value); setSaved(false); }}>
            {[3, 5, 7, 10, 12].map((value) => <option value={value} key={value}>{value}</option>)}
          </select>
        </label>
        <label>{messages.lobby.roundTime}
          <select value={roundDurationSec} onChange={(event) => { setRoundDurationSec(event.target.value); setSaved(false); }}>
            {[10, 15, 20, 30, 45, 60].map((value) => <option value={value} key={value}>{value}s</option>)}
          </select>
        </label>
      </div>

      <fieldset className="pwf-category-picker">
        <legend>{messages.lobby.categories}</legend>
        <div>
          {room.hostSetup.categories.map((category) => (
            <label key={category}>
              <input
                type="checkbox"
                checked={categories.includes(category)}
                onChange={() => toggleCategory(category)}
              />
              <span>{category}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <button type="button" className="pwf-secondary-button" disabled={busy || !categories.length} onClick={prepare}>
        <FiRefreshCw /> {messages.lobby.refreshQuestions}
      </button>

      <ol className="pwf-setup-questions">
        {questions.map((question, index) => (
          <li key={question.id}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <fieldset>
              <legend>{question.prompt}</legend>
              <div>
                {question.choices.map((choice) => (
                  <label key={choice.id} className={answers[question.id] === choice.id ? "is-selected" : ""}>
                    <input
                      type="radio"
                      name={question.id}
                      value={choice.id}
                      checked={answers[question.id] === choice.id}
                      onChange={() => { setAnswers((current) => ({ ...current, [question.id]: choice.id })); setSaved(false); }}
                    />
                    {choice.label}
                  </label>
                ))}
              </div>
            </fieldset>
          </li>
        ))}
      </ol>

      <div className="pwf-setup-footer">
        <span>{messages.lobby.answered(Object.keys(answers).length, questions.length)} {saved && <strong style={{ color: "var(--pwf-yellow)", marginLeft: "8px" }}>✓ Locked</strong>}</span>
        <button type="button" className={`pwf-primary-button ${saved ? "is-saved" : ""}`} disabled={busy || !complete} onClick={save}>
          <FiCheck /> {saved ? "Answers Saved ✓" : messages.lobby.lockAnswers}
        </button>
      </div>
    </section>
  );
};

const Standings = ({ room, compact = false }) => (
  <section className={`pwf-standings ${compact ? "is-compact" : ""}`} aria-labelledby="pwf-standings-title">
    <span className="pwf-eyebrow">{messages.standings.eyebrow}</span>
    <h2 id="pwf-standings-title">{messages.standings.title}</h2>
    <ol>
      {room.standings.map((player) => (
        <li key={player.id} className={player.id === room.self.id ? "is-self" : ""}>
          <span>{player.rank}</span>
          <strong>{player.nickname}</strong>
          <b>{player.score}</b>
        </li>
      ))}
    </ol>
  </section>
);

const ActiveRound = ({ room, command, busy, run, celebrate }) => {
  const seconds = useCountdown(room.status === "BETWEEN_ROUNDS" ? room.nextRoundAt : room.round?.deadline);
  const round = room.round;
  const isHost = room.self.role === "HOST";
  const revealed = room.status === "ROUND_REVEAL";
  const ownReveal = round?.reveal?.answers?.[room.self.id];
  const lastCelebratedQuestion = useRef("");
  useEffect(() => {
    if (revealed && round?.question.id !== lastCelebratedQuestion.current) {
      lastCelebratedQuestion.current = round.question.id;
      celebrate(ownReveal?.points > 0);
    }
  }, [revealed, round?.question.id, ownReveal?.points, celebrate]);

  if (room.status === "BETWEEN_ROUNDS") {
    return (
      <section className="pwf-between" aria-live="polite">
        <span className="pwf-eyebrow">{messages.round.next}</span>
        <strong>{seconds}</strong>
        <p>{messages.round.scoresLocked}</p>
      </section>
    );
  }

  const submitAnswer = (choiceId) => run(() => command("round:answer", {
    questionId: round.question.id,
    choiceId,
  }));

  return (
    <div className="pwf-round-layout">
      <section className={`pwf-round ${revealed ? "is-revealed" : ""}`} aria-labelledby="pwf-question-title">
        <header>
          <span>{messages.round.progress(round.number, round.total)}</span>
          {!revealed && <span className="pwf-timer"><FiClock /> {seconds}s</span>}
        </header>
        <span className="pwf-eyebrow">{round.question.category}</span>
        <h1 id="pwf-question-title">{round.question.prompt}</h1>
        <div className="pwf-choice-grid">
          {round.question.choices.map((choice, index) => {
            const isOwn = round.ownChoiceId === choice.id;
            const isCorrect = revealed && round.reveal.correctChoiceId === choice.id;
            const isWrong = revealed && isOwn && !isCorrect;
            return (
              <button
                type="button"
                key={choice.id}
                disabled={busy || isHost || Boolean(round.ownChoiceId) || revealed}
                className={`${isOwn ? "is-own" : ""} ${isCorrect ? "is-correct" : ""} ${isWrong ? "is-wrong" : ""}`}
                onClick={() => submitAnswer(choice.id)}
              >
                <span>{String.fromCharCode(65 + index)}</span>
                {choice.label}
                {isCorrect && <FiCheck />}
              </button>
            );
          })}
        </div>
        <footer aria-live="polite">
          {revealed
            ? <strong>{isHost ? messages.round.answerRevealed : ownReveal?.points > 0 ? messages.round.points(ownReveal.points) : messages.round.missed}</strong>
            : isHost
              ? <span>{messages.lobby.answered(round.answeredPlayerIds.length, room.players.filter((player) => player.role === "PLAYER").length)}</span>
              : round.ownChoiceId ? <span>{messages.round.answerLocked}</span> : <span>{messages.round.chooseOne}</span>}
          {revealed && isHost && (
            <button type="button" className="pwf-primary-button" disabled={busy} onClick={() => run(() => command("round:advance"))}>
              {round.number === round.total ? messages.round.finalResults : messages.round.next} <FiArrowRight />
            </button>
          )}
        </footer>
      </section>
      <Standings room={room} compact />
    </div>
  );
};

const Finished = ({ room, command, busy, run, celebrate }) => {
  useEffect(() => celebrate(true), []);
  const winners = room.standings.filter((player) => player.rank === 1);
  return (
    <section className="pwf-finished" aria-labelledby="pwf-finished-title">
      <FiAward aria-hidden="true" />
      <span className="pwf-eyebrow">{messages.round.finalResults}</span>
      <h1 id="pwf-finished-title">{winners.map((winner) => winner.nickname).join(" & ")}</h1>
      <p>{winners.length > 1 ? messages.standings.tie : messages.standings.winner}</p>
      <Standings room={room} />
      {room.self.role === "HOST" && (
        <div className="pwf-finished-actions">
          <button type="button" className="pwf-primary-button" disabled={busy} onClick={() => run(() => command("game:rematch"))}>
            <FiRefreshCw /> {messages.standings.rematch}
          </button>
          {lifeAuctionEnabled && (
            <button type="button" className="pwf-secondary-button" disabled={busy} onClick={() => run(() => command("party:switch-game", { gameKey: "life-auction" }))}>
              🪙 Play Life Auction
            </button>
          )}
        </div>
      )}
    </section>
  );
};

const WhoKnowsMeBetterGame = ({ room, command, celebrate }) => {
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const run = async (action) => {
    setBusy(true);
    setActionError("");
    try {
      await action();
    } catch (error) {
      setActionError(error.message);
    } finally {
      setBusy(false);
    }
  };
  const isPregame = ["LOBBY", "HOST_SETUP", "READY"].includes(room.status);

  return (
    <>
      {actionError && <div className="pwf-error" role="alert">{actionError}</div>}
      {isPregame && (
        <main className="pwf-lobby">
          <div className="pwf-lobby-main">
            {room.self.role === "HOST" && room.hostSetup
              ? <HostSetup room={room} command={command} busy={busy} run={run} />
              : (
                <section className="pwf-waiting" aria-live="polite">
                  <span className="pwf-pulse-ring" aria-hidden="true" />
                  <span className="pwf-eyebrow">{messages.lobby.room}</span>
                  <h1>{room.status === "READY" ? messages.lobby.waitingReady : messages.lobby.waitingSetup}</h1>
                </section>
              )}
          </div>
          <aside className="pwf-lobby-side">
            <InvitePanel room={room} />
            <PlayerRoster room={room} command={command} busy={busy} run={run} />
            {room.self.role === "HOST" && room.status === "READY" && (
              <button type="button" className="pwf-primary-button pwf-start-button" disabled={busy} onClick={() => run(() => command("game:start"))}>
                {messages.lobby.start} <FiArrowRight />
              </button>
            )}
          </aside>
        </main>
      )}
      {["IN_PROGRESS", "ROUND_REVEAL", "BETWEEN_ROUNDS"].includes(room.status) && (
        <main className="pwf-game-stage"><ActiveRound room={room} command={command} busy={busy} run={run} celebrate={celebrate} /></main>
      )}
      {room.status === "FINISHED" && <main className="pwf-game-stage"><Finished room={room} command={command} busy={busy} run={run} celebrate={celebrate} /></main>}
      {["CANCELLED", "EXPIRED"].includes(room.status) && (
        <main className="pwf-game-stage">
          <section className="pwf-ended">
            <span className="pwf-eyebrow">{messages.common.roomClosed}</span>
            <h1>{room.cancelReason || "This room has expired."}</h1>
            <a href="/play-with-friends" className="pwf-primary-button">{messages.common.anotherRoom}</a>
          </section>
        </main>
      )}
    </>
  );
};

export default WhoKnowsMeBetterGame;
