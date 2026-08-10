import { useEffect, useMemo, useRef, useState } from "react";
import {
  FiBookOpen,
  FiCheck,
  FiClock,
  FiCopy,
  FiPlay,
  FiRefreshCw,
  FiShare2,
  FiUsers,
  FiX,
} from "react-icons/fi";
import messages from "./messages/en";
import { playSfx } from "../../../../utils/gameAudioEngine";
import "./life-auction.css";

const useCountdown = (deadline) => {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const update = () => setSeconds(deadline ? Math.max(0, Math.ceil((new Date(deadline).getTime() - Date.now()) / 1000)) : 0);
    update();
    const timer = window.setInterval(update, 250);
    return () => window.clearInterval(timer);
  }, [deadline]);
  return seconds;
};

const formatCoins = (value) => Number.isFinite(value) ? `${value} LC` : "Hidden";

const RulesPanel = ({ onClose }) => {
  const panelRef = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    panelRef.current?.focus();
    const close = (event) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", close);
    return () => {
      window.removeEventListener("keydown", close);
      previous?.focus?.();
    };
  }, [onClose]);
  return (
    <div className="la-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section ref={panelRef} tabIndex="-1" className="la-rules" role="dialog" aria-modal="true" aria-labelledby="la-rules-title">
        <button type="button" className="la-close" onClick={onClose} aria-label="Close rules"><FiX /></button>
        <span className="la-kicker">How it works</span>
        <h2 id="la-rules-title">{messages.rules.title}</h2>
        <ul>{messages.rules.items.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>
    </div>
  );
};

const InviteCard = ({ room }) => {
  const [copied, setCopied] = useState(false);
  const inviteUrl = `${window.location.origin}/play-with-friends/join/${room.code}`;
  const copy = async () => {
    await navigator.clipboard?.writeText(inviteUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };
  return (
    <section className="la-invite" aria-label="Party invite">
      <span>{messages.lobby.invite}</span>
      <strong>{room.code}</strong>
      <button type="button" onClick={copy}><FiCopy /> {copied ? "Copied" : "Copy invite"}</button>
    </section>
  );
};

const PartyRail = ({ room, game, manage = false, command, run, busy }) => (
  <aside className="la-party-rail" aria-label="Players">
    <header><FiUsers /><strong>{game.players.length} players</strong></header>
    <ul>
      {game.players.map((player) => (
        <li key={player.id} className={player.id === room.self.id ? "is-self" : ""}>
          <span className={`la-presence ${player.connected ? "is-live" : ""}`} aria-label={player.connected ? "Connected" : "Away"} />
          <span><b>{player.nickname}</b><small>{player.role === "HOST" ? "Host" : `${player.ownedCount} lots`}</small></span>
          <strong>{player.balance}</strong>
          {manage && player.id !== room.self.id && (
            <div className="la-party-actions">
              <button type="button" disabled={busy} onClick={() => run(() => command("host:transfer", { targetPlayerId: player.id }))}>Make host</button>
              <button type="button" disabled={busy} onClick={() => run(() => command("player:remove", { targetPlayerId: player.id }))}>Remove</button>
            </div>
          )}
        </li>
      ))}
    </ul>
  </aside>
);

const Lobby = ({ room, game, run, busy, gameCommand, command }) => {
  const [modeKey, setModeKey] = useState(game.modeKey);
  const [lengthKey, setLengthKey] = useState(game.lengthKey);
  const [startingCoins, setStartingCoins] = useState(room.settings.startingCoins || 100);
  const isHost = room.self.role === "HOST";

  useEffect(() => {
    setModeKey(game.modeKey);
    setLengthKey(game.lengthKey);
    setStartingCoins(room.settings.startingCoins || 100);
  }, [game.modeKey, game.lengthKey, room.settings.startingCoins]);

  const start = () => run(async () => {
    await gameCommand("setup:update", { modeKey, lengthKey, startingCoins });
    await gameCommand("session:start", {});
  });

  return (
    <main className="la-lobby">
      <section className="la-lobby-copy">
        <span className="la-kicker">{messages.eyebrow}</span>
        <h1>{messages.lobby.title}</h1>
        <div className="la-how-to">
          {messages.lobby.intro.map((line, index) => <p key={line}><i>{index + 1}</i>{line}</p>)}
        </div>
        {isHost ? (
          <div className="la-setup" aria-label="Life Auction setup">
            <fieldset>
              <legend>{messages.lobby.mode}</legend>
              <div className="la-mode-grid">
                {game.setup.modes.map((mode) => (
                  <button key={mode.key} type="button" className={modeKey === mode.key ? "is-active" : ""} onClick={() => setModeKey(mode.key)} aria-pressed={modeKey === mode.key}>
                    <span>{mode.emoji}</span><strong>{mode.title}</strong><small>{mode.description}</small>
                  </button>
                ))}
              </div>
            </fieldset>
            <div className="la-setup-row">
              <label>{messages.lobby.length}<select value={lengthKey} onChange={(event) => setLengthKey(event.target.value)}>{game.setup.lengths.map((length) => <option value={length.key} key={length.key}>{length.label} · {length.lotCount} lots</option>)}</select></label>
              <label>{messages.lobby.coins}<select value={startingCoins} onChange={(event) => setStartingCoins(Number(event.target.value))}>{game.setup.startingCoinOptions.map((coins) => <option value={coins} key={coins}>{coins} Life Coins</option>)}</select></label>
            </div>
            <button type="button" className="la-primary" disabled={busy || room.status !== "READY"} onClick={start}><FiPlay /> {room.status === "READY" ? messages.lobby.start : "Waiting for one friend"}</button>
          </div>
        ) : (
          <section className="la-waiting" aria-live="polite"><span className="la-orbit" aria-hidden="true">🪙</span><h2>{messages.lobby.waiting}</h2><p>You will receive your wallet when the host starts.</p></section>
        )}
      </section>
      <aside className="la-lobby-side"><InviteCard room={room} /><PartyRail room={room} game={game} manage={isHost} command={command} run={run} busy={busy} /></aside>
    </main>
  );
};

const Wallet = ({ wallet, currencyLabel }) => {
  if (!wallet) return null;
  return (
    <section className="la-wallet" aria-label={`${currencyLabel} wallet`}>
      <div><span>{messages.bidding.available}</span><strong>{wallet.available === null ? "Hidden" : wallet.available}</strong></div>
      <div><span>{messages.bidding.reserved}</span><strong>{wallet.reserved === null ? "Sealed" : wallet.reserved}</strong></div>
      <div><span>Spent</span><strong>{wallet.spent}</strong></div>
    </section>
  );
};

const BidControls = ({ room, game, run, busy, gameCommand }) => {
  const auction = game.auction;
  const [amount, setAmount] = useState(auction?.minimumNextBid || auction?.startingPrice || 1);
  useEffect(() => setAmount(auction?.minimumNextBid || auction?.startingPrice || 1), [game.lot?.id, auction?.minimumNextBid, auction?.startingPrice]);
  if (!auction) return null;
  const submit = (nextAmount) => run(async () => {
    playSfx("bid");
    await gameCommand("auction:bid", { amount: Number(nextAmount) });
  });

  if (auction.type === "SEALED_BID") {
    if (auction.ownBidSubmitted) return <div className="la-submitted"><FiCheck /><strong>{messages.bidding.submitted}</strong><span>{auction.submittedPlayerIds.length}/{game.players.length} submitted</span></div>;
    return (
      <form className="la-bid-form la-sealed-form" onSubmit={(event) => { event.preventDefault(); submit(amount); }}>
        <label htmlFor="la-sealed-amount">How much would you spend?</label>
        <div><input id="la-sealed-amount" type="number" inputMode="numeric" min={1} max={game.wallet?.balance || 0} value={amount} onChange={(event) => setAmount(event.target.value)} /><button className="la-primary" disabled={busy || !amount}>{messages.bidding.submitSecret}</button></div>
        <small>No other player—including the host—can see this before reveal.</small>
      </form>
    );
  }

  if (auction.type === "FIXED_PRICE") {
    const bought = auction.purchasedPlayerIds.includes(room.self.id);
    return bought
      ? <div className="la-submitted"><FiCheck /><strong>This lot is in your portfolio.</strong><span>{auction.remainingPurchases} purchase spots remain.</span></div>
      : <div className="la-fixed-controls"><button type="button" className="la-primary" disabled={busy || (game.wallet?.available || 0) < auction.price} onClick={() => submit(auction.price)}>{messages.bidding.buy} {auction.price} LC</button><span>{messages.bidding.pass}</span></div>;
  }

  const minimum = auction.minimumNextBid;
  const options = [...new Set([minimum, minimum + auction.minimumIncrement * 2, minimum + 5])].filter((value) => value <= (game.wallet?.balance || 0));
  return (
    <div className="la-open-controls">
      <div className="la-quick-bids">{options.map((value) => <button type="button" key={value} disabled={busy} onClick={() => submit(value)}>Bid {value}</button>)}</div>
      <form className="la-bid-form" onSubmit={(event) => { event.preventDefault(); submit(amount); }}>
        <label htmlFor="la-open-amount">Custom whole-coin bid</label>
        <div><input id="la-open-amount" type="number" inputMode="numeric" min={minimum} max={game.wallet?.balance || 0} value={amount} onChange={(event) => setAmount(event.target.value)} /><button className="la-primary" disabled={busy}>Place bid</button></div>
      </form>
    </div>
  );
};

const AuctionStage = ({ room, game, run, busy, gameCommand, celebrate }) => {
  const seconds = useCountdown(game.auction?.deadline);
  const highest = game.auction?.highestBid;
  const isFinalSeconds = seconds <= 5;
  return (
    <main className={`la-game ${isFinalSeconds ? "is-final-seconds" : ""}`}>
      <section className="la-stage">
        <header className="la-round-header">
          <span>{game.round ? `Lot ${game.round.number} of ${game.round.total}` : "Life Event"}</span>
          <strong className="la-timer" aria-label={`${seconds} seconds remaining`}><FiClock /> {seconds}</strong>
        </header>
        <article className={`la-lot la-theme-${game.lot?.visualTheme || "mystery"}`} aria-labelledby="la-lot-title">
          <span className="la-lot-icon" aria-hidden="true">{game.lot?.icon}</span>
          <span className="la-kicker">{game.auction?.type === "SEALED_BID" ? messages.bidding.sealed : game.auction?.type === "FIXED_PRICE" ? messages.bidding.fixed : messages.bidding.open}</span>
          <h1 id="la-lot-title">{game.lot?.title}</h1>
          <p>{game.lot?.shortDescription}</p>
          {game.auction?.type === "OPEN_ASCENDING" && (
            <div className="la-current-bid"><span>{highest ? messages.bidding.current : messages.bidding.noBids}</span><strong>{highest ? `${highest.amount} LC` : `Starts at ${game.auction.startingPrice}`}</strong>{highest && <small>{highest.nickname}</small>}</div>
          )}
          {game.auction?.type === "SEALED_BID" && <div className="la-current-bid"><span>Starting point</span><strong>{game.auction.startingPrice} LC</strong><small>{game.auction.submittedPlayerIds.length} sealed</small></div>}
          {game.auction?.extensionCount > 0 && <span className="la-extension" role="status">Fair-play extension +{game.auction.extensionCount * 3}s</span>}
        </article>
        <BidControls room={room} game={game} run={run} busy={busy} gameCommand={gameCommand} celebrate={celebrate} />
        <div className="la-live-bid" aria-live="polite" aria-atomic="true">{highest ? `${highest.nickname} leads at ${highest.amount} Life Coins.` : ""}</div>
      </section>
      <div className="la-game-side"><Wallet wallet={game.wallet} currencyLabel={game.currencyLabel} /><PartyRail room={room} game={game} /></div>
    </main>
  );
};

const EventStage = ({ game, run, busy, gameCommand }) => {
  const event = game.event;
  const seconds = useCountdown(event?.deadline);
  const [targetPlayerId, setTargetPlayerId] = useState("");
  if (!event) return null;
  const choose = (choiceId) => run(() => gameCommand("life_event:choose", { choiceId, ...(choiceId === "gift" && targetPlayerId ? { targetPlayerId } : {}) }));
  return (
    <main className="la-event-stage">
      <section className="la-event-card" aria-labelledby="la-event-title">
        <header><span className="la-kicker">Life interrupts</span><strong><FiClock /> {seconds}</strong></header>
        <span className="la-event-icon" aria-hidden="true">{event.icon}</span>
        <h1 id="la-event-title">{event.title}</h1>
        <p>{event.description}</p>
        {event.kind === "GIFT" && !event.ownChoiceId && <label>Friend<select value={targetPlayerId} onChange={(e) => setTargetPlayerId(e.target.value)}><option value="">Choose someone</option>{game.players.filter((player) => player.id !== game.selfId).map((player) => <option key={player.id} value={player.id}>{player.nickname}</option>)}</select></label>}
        {event.choiceRequired && !event.ownChoiceId ? <div className="la-event-choices">{event.choices.map((choice) => <button type="button" key={choice.id} disabled={busy || (choice.id === "gift" && !targetPlayerId)} onClick={() => choose(choice.id)}>{choice.label}</button>)}</div> : event.ownChoiceId ? <div className="la-submitted"><FiCheck /><strong>Choice locked</strong><span>{event.submittedPlayerIds.length}/{game.players.length} ready</span></div> : <p className="la-event-wait">This event resolves automatically.</p>}
      </section>
    </main>
  );
};

const RevealStage = ({ room, game, gameCommand, busy, run }) => {
  const result = game.result;
  if (!result) return null;
  if (result.kind === "LIFE_EVENT") return <main className="la-reveal"><span className="la-reveal-icon">{result.icon}</span><span className="la-kicker">Life Event resolved</span><h1>{result.title}</h1><p>{result.summary}</p><small>{messages.result.next}</small></main>;
  const primary = result.winners?.[0];
  return (
    <main className="la-reveal">
      <span className="la-kicker">{result.unsold ? messages.result.unsold : result.winners.length > 1 ? messages.result.shared : messages.result.sold}</span>
      <span className="la-reveal-icon" aria-hidden="true">{result.lot.icon}</span>
      <h1>{result.lot.title}</h1>
      {result.unsold ? <p>Nobody chose this one tonight.</p> : result.winners.length === 1 ? <p><strong>{primary.nickname}</strong> · {formatCoins(primary.bidAmount)}{primary.discount ? ` · ${primary.discount} coin discount` : ""}</p> : <p>{result.winners.map((winner) => winner.nickname).join(", ")} chose this one.</p>}
      {result.auctionType === "SEALED_BID" && result.bids.length > 0 && <ol className="la-sealed-reveal">{result.bids.map((bid) => <li key={bid.playerId}><span>{bid.nickname}</span><strong>{bid.amount} LC</strong></li>)}</ol>}
      {result.tie && <p className="la-tie-note">{messages.result.tie}</p>}
      <ReactionBar gameCommand={gameCommand} busy={busy} run={run} />
      <small>{messages.result.next}</small>
    </main>
  );
};

const ReactionBar = ({ gameCommand, busy, run }) => <div className="la-reactions" aria-label="React to this moment">{["😂", "😮", "❤️", "👀", "🔥"].map((emoji) => <button type="button" key={emoji} disabled={busy} onClick={() => run(() => gameCommand("reaction:send", { emoji }))} aria-label={`React ${emoji}`}>{emoji}</button>)}</div>;

const Portfolio = ({ room, game, run, busy, command, gameCommand }) => {
  const own = game.portfolios?.portfolios?.find((portfolio) => portfolio.playerId === room.self.id);
  const [shared, setShared] = useState(false);
  const viewed = useRef(false);
  useEffect(() => {
    if (!own || viewed.current) return;
    viewed.current = true;
    gameCommand("telemetry:record", { event: "portfolio_viewed" }).catch(() => {});
  }, [own, gameCommand]);
  if (!own) return null;
  const share = async () => {
    const breakdown = own.themes.map((theme) => `${theme.theme} ${theme.percentage}%`).join(" · ");
    const text = `My Life Auction — ${breakdown}. ${own.coinsSpent} fictional Life Coins, these were tonight's choices.`;
    if (navigator.share) await navigator.share({ title: "My Life Auction", text });
    else await navigator.clipboard?.writeText(text);
    await gameCommand("telemetry:record", { event: "result_shared" }).catch(() => {});
    setShared(true);
  };
  return (
    <main className="la-portfolio">
      <header><span className="la-kicker">{messages.portfolio.eyebrow}</span><h1>{messages.portfolio.title}</h1><p>{own.summary}</p></header>
      <div className="la-portfolio-grid">
        <section className="la-won-items"><h2>{own.nickname}</h2>{own.items.length ? <ul>{own.items.map((item) => <li key={item.lotId}><span>{item.icon}</span><div><strong>{item.title}</strong><small>{item.category}</small></div><b>{item.purchasePrice}</b></li>)}</ul> : <p>You kept every coin. The empty gallery is part of tonight's story.</p>}<footer><span>{messages.portfolio.remaining}</span><strong>{own.coinsRemaining}</strong></footer></section>
        <section className="la-value-map"><h2>{messages.portfolio.choices}</h2>{own.themes.map((theme) => <div key={theme.theme}><span>{theme.theme}<b>{theme.percentage}%</b></span><i><em style={{ width: `${theme.percentage}%` }} /></i></div>)}<small>Describes this session only. It is not a personality assessment.</small></section>
      </div>
      <section className="la-awards"><h2>{messages.portfolio.group}</h2><div>{game.portfolios.awards.map((award) => <article key={award.id}><span>{award.icon}</span><strong>{award.title}</strong><p>{award.nickname}{award.value ? ` · ${award.value} LC` : ""}</p></article>)}</div></section>
      <div className="la-portfolio-actions"><button type="button" className="la-secondary" onClick={share}><FiShare2 /> {shared ? "Shared or copied" : messages.portfolio.share}</button>{room.self.role === "HOST" ? <><button type="button" className="la-primary" disabled={busy} onClick={() => run(() => command("game:rematch"))}><FiRefreshCw /> {messages.portfolio.rematch}</button><button type="button" className="la-secondary" disabled={busy} onClick={() => run(() => command("party:switch-game", { gameKey: "who-knows-me-better" }))}>{messages.portfolio.otherGame}</button></> : <p>{messages.portfolio.waiting}</p>}</div>
    </main>
  );
};

const LifeAuctionGame = ({ room, command, celebrate }) => {
  const game = room.lifeAuction;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [rulesOpen, setRulesOpen] = useState(false);
  const lastResult = useRef("");
  const viewed = useRef(false);
  const gameCommand = (commandName, payload = {}) => command("game:command", { command: commandName, payload });
  const run = async (action) => {
    setBusy(true);
    setError("");
    try { await action(); } catch (actionError) { setError(actionError.message); } finally { setBusy(false); }
  };

  useEffect(() => {
    if (viewed.current) return undefined;
    const timer = window.setTimeout(() => {
      gameCommand("telemetry:record", { event: "life_auction_viewed" })
        .then(() => { viewed.current = true; })
        .catch(() => {});
    }, 500);
    return () => window.clearTimeout(timer);
  }, [gameCommand]);

  useEffect(() => {
    const key = game.result ? `${game.result.kind}:${game.result.closedAt || game.result.eventId}` : "";
    if (key && key !== lastResult.current) {
      lastResult.current = key;
      const won = game.result.winners?.some((winner) => winner.playerId === room.self.id);
      celebrate(Boolean(won || game.result.kind === "LIFE_EVENT"));
    }
  }, [game.result, room.self.id, celebrate]);

  const render = useMemo(() => {
    if (["LOBBY", "READY"].includes(room.status)) return <Lobby room={room} game={game} run={run} busy={busy} gameCommand={gameCommand} command={command} />;
    if (room.status === "FINISHED") return <Portfolio room={room} game={game} run={run} busy={busy} command={command} gameCommand={gameCommand} />;
    if (["CANCELLED", "EXPIRED"].includes(room.status)) return <main className="la-reveal"><span className="la-kicker">Auction closed</span><h1>{room.cancelReason || "This room has expired."}</h1></main>;
    if (game.phase === "LIFE_EVENT") return <EventStage game={{ ...game, selfId: room.self.id }} run={run} busy={busy} gameCommand={gameCommand} />;
    if (["AUCTION_REVEAL", "EVENT_REVEAL"].includes(game.phase)) return <RevealStage room={room} game={game} gameCommand={gameCommand} busy={busy} run={run} />;
    return <AuctionStage room={room} game={game} run={run} busy={busy} gameCommand={gameCommand} celebrate={celebrate} />;
  }, [room, game, busy]);

  return (
    <div className="la-shell">
      <div className="la-utility"><span><b>Life Auction</b> · {game.modeKey.replace(/-/g, " ")}</span><button type="button" onClick={() => setRulesOpen(true)}><FiBookOpen /> Rules</button></div>
      {error && <div className="la-error" role="alert">{error}</div>}
      {render}
      <div className="la-reaction-stream" aria-hidden="true">{game.reactions.slice(-4).map((reaction) => <span key={reaction.id}>{reaction.emoji}</span>)}</div>
      <p className="la-disclaimer">{game.disclaimer}</p>
      <div className="la-status" aria-live="polite" aria-atomic="true">{game.phase === "BIDDING" ? `${game.lot?.title}. ${game.auction?.highestBid ? `${game.auction.highestBid.nickname} leads.` : "Bidding open."}` : game.result?.summary || ""}</div>
      {rulesOpen && <RulesPanel onClose={() => setRulesOpen(false)} />}
    </div>
  );
};

export default LifeAuctionGame;
