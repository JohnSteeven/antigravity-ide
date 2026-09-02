const MAX_INTEGER = 1000000;
const AUDIT_LIMIT = 400;

const assertAmount = (amount, { allowZero = false, maximum = MAX_INTEGER } = {}) => {
  if (!Number.isSafeInteger(amount) || amount < (allowZero ? 0 : 1) || amount > maximum) {
    const error = new Error("Life Coin amount must be a valid whole number.");
    error.code = "MULTIPLAYER_BAD_REQUEST";
    error.status = 422;
    throw error;
  }
  return amount;
};

const createWallet = (startingBalance) => {
  assertAmount(startingBalance);
  return {
    startingBalance,
    balance: startingBalance,
    reserved: 0,
    spent: 0,
    refunded: 0,
    bonuses: 0,
    penalties: 0,
    transfersIn: 0,
    transfersOut: 0,
    lotWinnings: 0,
  };
};

const initializeWallets = (players, startingBalance) => Object.fromEntries(
  players.map((player) => [player.playerId, createWallet(startingBalance)])
);

const walletFor = (state, playerId) => {
  const wallet = state.wallets?.[playerId];
  if (!wallet) {
    const error = new Error("This player does not have an active Life Coin wallet.");
    error.code = "MULTIPLAYER_INVALID_ACTION";
    error.status = 403;
    throw error;
  }
  return wallet;
};

const availableBalance = (wallet) => Math.max(0, wallet.balance - wallet.reserved);

const audit = (state, mutation, now) => {
  state.economySequence = Number(state.economySequence || 0) + 1;
  state.economyAudit = [
    ...(state.economyAudit || []),
    { sequence: state.economySequence, at: now.toISOString(), ...mutation },
  ].slice(-AUDIT_LIMIT);
};

const setReservation = (state, playerId, amount, metadata, now) => {
  assertAmount(amount, { allowZero: true });
  const wallet = walletFor(state, playerId);
  if (amount > wallet.balance) {
    const error = new Error("You do not have enough available Life Coins for that bid.");
    error.code = "MULTIPLAYER_INVALID_ACTION";
    error.status = 409;
    throw error;
  }
  const before = wallet.reserved;
  wallet.reserved = amount;
  audit(state, {
    type: amount >= before ? "BID_RESERVED" : "BID_RELEASED",
    playerId,
    amount: Math.abs(amount - before),
    balanceAfter: wallet.balance,
    reservedAfter: wallet.reserved,
    ...metadata,
  }, now);
};

const commitReservation = (state, playerId, amount, metadata, now) => {
  assertAmount(amount);
  const wallet = walletFor(state, playerId);
  if (wallet.reserved < amount || wallet.balance < amount) {
    const error = new Error("Reserved Life Coins no longer cover this purchase.");
    error.code = "MULTIPLAYER_INVALID_STATE";
    error.status = 409;
    throw error;
  }
  wallet.reserved -= amount;
  wallet.balance -= amount;
  wallet.spent += amount;
  wallet.lotWinnings += 1;
  audit(state, {
    type: "PURCHASE_COMMITTED",
    playerId,
    amount,
    balanceAfter: wallet.balance,
    reservedAfter: wallet.reserved,
    ...metadata,
  }, now);
};

const spendAvailable = (state, playerId, amount, metadata, now) => {
  assertAmount(amount);
  const wallet = walletFor(state, playerId);
  if (availableBalance(wallet) < amount) {
    const error = new Error("You do not have enough available Life Coins.");
    error.code = "MULTIPLAYER_INVALID_ACTION";
    error.status = 409;
    throw error;
  }
  wallet.balance -= amount;
  wallet.spent += amount;
  audit(state, { type: "SPENT", playerId, amount, balanceAfter: wallet.balance, reservedAfter: wallet.reserved, ...metadata }, now);
};

const credit = (state, playerId, amount, metadata, now) => {
  assertAmount(amount);
  const wallet = walletFor(state, playerId);
  const before = wallet.balance;
  wallet.balance = Math.min(MAX_INTEGER, wallet.balance + amount);
  const actual = wallet.balance - before;
  wallet.bonuses += actual;
  audit(state, { type: "BONUS", playerId, amount: actual, balanceAfter: wallet.balance, reservedAfter: wallet.reserved, ...metadata }, now);
};

const penalize = (state, playerId, amount, metadata, now) => {
  assertAmount(amount);
  const wallet = walletFor(state, playerId);
  const actual = Math.min(amount, availableBalance(wallet));
  if (!actual) return 0;
  wallet.balance -= actual;
  wallet.penalties += actual;
  audit(state, { type: "PENALTY", playerId, amount: actual, balanceAfter: wallet.balance, reservedAfter: wallet.reserved, ...metadata }, now);
  return actual;
};

const transfer = (state, fromPlayerId, toPlayerId, amount, metadata, now) => {
  if (fromPlayerId === toPlayerId) {
    const error = new Error("Choose another player for this gift.");
    error.code = "MULTIPLAYER_BAD_REQUEST";
    error.status = 422;
    throw error;
  }
  assertAmount(amount);
  const sender = walletFor(state, fromPlayerId);
  const recipient = walletFor(state, toPlayerId);
  if (availableBalance(sender) < amount) {
    const error = new Error("You no longer have enough available Life Coins for that gift.");
    error.code = "MULTIPLAYER_INVALID_ACTION";
    error.status = 409;
    throw error;
  }
  sender.balance -= amount;
  sender.transfersOut += amount;
  recipient.balance = Math.min(MAX_INTEGER, recipient.balance + amount);
  recipient.transfersIn += amount;
  audit(state, { type: "TRANSFER", playerId: fromPlayerId, targetPlayerId: toPlayerId, amount, balanceAfter: sender.balance, reservedAfter: sender.reserved, ...metadata }, now);
};

const releaseAllReservations = (state, metadata, now) => {
  Object.entries(state.wallets || {}).forEach(([playerId, wallet]) => {
    if (wallet.reserved > 0) setReservation(state, playerId, 0, metadata, now);
  });
};

const publicWallet = (wallet) => ({
  startingBalance: wallet.startingBalance,
  balance: wallet.balance,
  reserved: wallet.reserved,
  available: availableBalance(wallet),
  spent: wallet.spent,
  refunded: wallet.refunded,
  bonuses: wallet.bonuses,
  penalties: wallet.penalties,
  transfersIn: wallet.transfersIn,
  transfersOut: wallet.transfersOut,
  lotWinnings: wallet.lotWinnings,
});

module.exports = {
  MAX_INTEGER,
  assertAmount,
  availableBalance,
  commitReservation,
  credit,
  initializeWallets,
  penalize,
  publicWallet,
  releaseAllReservations,
  setReservation,
  spendAvailable,
  transfer,
  walletFor,
};
