const crypto = require("crypto");
const questionBank = require("./questions/en");
const { PLAYER_ROLES, ROOM_STATUSES } = require("../../domain/constants");

const manifest = Object.freeze({
  key: "who-knows-me-better",
  version: 1,
  title: "Who Knows Me Better?",
  minPlayers: 2,
  maxPlayers: 12,
  supportedLocales: ["en"],
  defaultQuestionCount: 5,
  defaultRoundDurationSec: 20,
});

const listCategories = () => [...new Set(questionBank.questions.map((question) => question.category))];

const selectQuestions = ({ categories, count, seed }) => {
  const allowed = new Set(categories?.length ? categories : listCategories());
  const pool = questionBank.questions.filter((question) => question.active && allowed.has(question.category));
  const ranked = pool
    .map((question) => ({
      question,
      rank: crypto.createHash("sha256").update(`${seed}:${question.id}`).digest("hex"),
    }))
    .sort((a, b) => a.rank.localeCompare(b.rank))
    .slice(0, count)
    .map(({ question }) => question);

  return ranked;
};

const scoreAnswer = ({ correct, elapsedMs, roundDurationSec }) => {
  if (!correct) return 0;
  const boundedElapsed = Math.max(0, Math.min(elapsedMs, roundDurationSec * 1000));
  return Math.max(500, Math.round(1000 - boundedElapsed / (roundDurationSec * 2)));
};

const mapObject = (value) => value instanceof Map ? Object.fromEntries(value) : { ...(value || {}) };

const createRoomState = ({ roomCode }) => {
  const categories = listCategories();
  return {
    settings: {
      maxPlayers: manifest.maxPlayers,
      minPlayers: manifest.minPlayers,
      questionCount: manifest.defaultQuestionCount,
      roundDurationSec: manifest.defaultRoundDurationSec,
      categories,
    },
    gameData: {
      questionBankVersion: questionBank.version,
      questions: selectQuestions({ categories, count: manifest.defaultQuestionCount, seed: roomCode }),
      hostAnswers: {},
      guesses: {},
      scores: {},
      currentRound: -1,
      roundStartedAt: null,
      roundDeadline: null,
      nextRoundAt: null,
      reveal: null,
      state: {},
    },
  };
};

const onPlayerJoined = ({ room, transition }) => {
  const answers = mapObject(room.gameData.hostAnswers);
  if (Object.keys(answers).length === room.gameData.questions.length && room.players.length >= room.settings.minPlayers) {
    transition(ROOM_STATUSES.READY);
  }
};

const projectState = ({ room, viewer, publicPlayer, standingsFor }) => {
  const currentQuestion = room.gameData.currentRound >= 0
    ? room.gameData.questions[room.gameData.currentRound]
    : null;
  const isReveal = [ROOM_STATUSES.ROUND_REVEAL, ROOM_STATUSES.FINISHED].includes(room.status);
  const guesses = currentQuestion ? room.gameData.guesses?.[currentQuestion.id] || {} : {};
  const ownGuess = guesses[viewer.playerId];
  const projection = {
    round: currentQuestion ? {
      number: room.gameData.currentRound + 1,
      total: room.gameData.questions.length,
      question: {
        id: currentQuestion.id,
        category: currentQuestion.category,
        prompt: currentQuestion.prompt,
        choices: currentQuestion.choices,
      },
      deadline: room.gameData.roundDeadline,
      answeredPlayerIds: Object.keys(guesses),
      ownChoiceId: ownGuess?.choiceId || null,
      reveal: isReveal ? room.gameData.reveal : null,
    } : null,
    nextRoundAt: room.gameData.nextRoundAt,
    standings: standingsFor(room),
  };

  if (viewer.role === PLAYER_ROLES.HOST && [ROOM_STATUSES.LOBBY, ROOM_STATUSES.HOST_SETUP, ROOM_STATUSES.READY].includes(room.status)) {
    projection.hostSetup = {
      categories: listCategories(),
      questions: room.gameData.questions,
      answers: mapObject(room.gameData.hostAnswers),
    };
  }
  return projection;
};

const onRoundDeadline = ({ room, reveal }) => reveal(room);

const onBetweenRoundDeadline = ({ room, transition, now }) => {
  transition(ROOM_STATUSES.IN_PROGRESS);
  const current = now();
  room.gameData.currentRound += 1;
  room.gameData.roundStartedAt = current;
  room.gameData.roundDeadline = new Date(current.getTime() + room.settings.roundDurationSec * 1000);
  room.gameData.nextRoundAt = null;
  room.gameData.reveal = null;
};

const createGameRecord = ({ room, standingsFor }) => ({
  roundCount: room.gameData.questions.length,
  standings: standingsFor(room).map(({ id, nickname, score, rank }) => ({ playerId: id, nickname, score, rank })),
});

module.exports = {
  listCategories,
  manifest,
  createRoomState,
  onPlayerJoined,
  onBetweenRoundDeadline,
  onRoundDeadline,
  projectState,
  createGameRecord,
  questionBankVersion: questionBank.version,
  scoreAnswer,
  selectQuestions,
};
