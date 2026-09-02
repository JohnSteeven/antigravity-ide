const AIProviderService = require("../../services/aiProviderService");
const LifeJournalEntry = require("../models/LifeJournalEntry");
const { LifeError } = require("../domain/errors");
const metrics = require("./observability");
const profileService = require("./profileService");
const reportService = require("./reportService");

const assertEnabled = async (userId) => {
  const profile = await profileService.getOrCreateProfile(userId);
  if (process.env.LIFE_AI_ENABLED !== "true") throw new LifeError("Life AI is unavailable. Deterministic reports remain available.", 503, "LIFE_AI_UNAVAILABLE");
  if (!profile.aiInsightsEnabled) throw new LifeError("Enable Life AI summaries in Settings before sharing any Life summary.", 403, "LIFE_AI_OPT_IN_REQUIRED");
  return profile;
};

const normalizedReviewInput = async (userId, query = {}) => {
  const profile = await assertEnabled(userId);
  const report = await reportService.buildReport(userId, query);
  const scopes = profile.aiReview || {};
  const input = { period: { start: report.start, end: report.end }, habits: report.habits, goals: report.goals.map(({ title, status, progress }) => ({ title, status, progress })) };
  if (scopes.includeHealth) input.health = report.health;
  if (scopes.includeFinance) input.money = report.money;
  if (scopes.includeJournal) {
    const journals = await LifeJournalEntry.find({ user: userId, deletedAt: null, localDate: { $gte: report.start, $lte: report.end } }).sort({ localDate: -1 }).limit(12).select("title body localDate type").lean();
    input.reflections = journals.map((entry) => ({ date: entry.localDate, type: entry.type, title: entry.title, excerpt: String(entry.body).slice(0, 500) }));
  }
  return input;
};

const generateReview = async (userId, query = {}) => {
  const input = await normalizedReviewInput(userId, query);
  const messages = [
    { role: "system", content: "You are MyJourney Life's optional review assistant. Use only the supplied structured summary. Never diagnose, shame, provide financial advice, invent events, or imply causation. Write five brief sections: Your period, What moved forward, What was difficult, Patterns worth noticing, A gentle focus." },
    { role: "user", content: JSON.stringify(input) },
  ];
  try {
    const result = await AIProviderService.complete({ messages, action: "life-review", source: "life-private-review", userId, overrides: { temperature: 0.35, maxTokens: 900 } });
    return { available: true, review: result.content, deterministicInput: input.period, scopes: Object.keys(input).filter((key) => !["period", "habits", "goals"].includes(key)) };
  } catch (error) {
    metrics.increment("life_ai_review_failures");
    throw new LifeError("The optional AI review is unavailable. Your deterministic report is still intact.", 503, "LIFE_AI_FAILED");
  }
};

const ask = async (userId, question, query = {}) => {
  const input = await normalizedReviewInput(userId, query);
  const prompt = String(question || "").trim().slice(0, 500);
  if (!prompt) throw new LifeError("Ask a question about your Life summary.", 422, "LIFE_AI_QUESTION_REQUIRED");
  try {
    const result = await AIProviderService.complete({ messages: [
      { role: "system", content: "Answer only from this user's authorized structured Life summary. This is read-only. Do not propose or execute record mutations. State when the summary cannot answer. Avoid medical diagnosis and financial advice." },
      { role: "user", content: `SUMMARY\n${JSON.stringify(input)}\n\nQUESTION\n${prompt}` },
    ], action: "life-ask", source: "life-private-ask", userId, overrides: { temperature: 0.25, maxTokens: 700 } });
    return { answer: result.content, mode: "read_only", grounded: true };
  } catch (error) {
    metrics.increment("life_ai_ask_failures");
    throw new LifeError("Life AI could not answer right now.", 503, "LIFE_AI_FAILED");
  }
};

module.exports = { ask, generateReview, normalizedReviewInput };
