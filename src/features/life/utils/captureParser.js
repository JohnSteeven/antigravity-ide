const numberFrom = (text) => Number(String(text).replace(/,/g, "").match(/\d+(?:\.\d+)?/)?.[0] || 0);
const timeFrom = (text) => {
  const match = String(text).match(/\b(1[0-2]|0?[1-9])(?::([0-5]\d))?\s*(am|pm)\b/i);
  if (!match) return "";
  let hour = Number(match[1]);
  if (match[3].toLowerCase() === "pm" && hour !== 12) hour += 12;
  if (match[3].toLowerCase() === "am" && hour === 12) hour = 0;
  return `${String(hour).padStart(2, "0")}:${match[2] || "00"}`;
};

export const parseCaptureText = (rawText) => {
  const text = String(rawText || "").trim();
  const lower = text.toLowerCase();
  const amount = numberFrom(text);
  if (/\b(water|ml|millilit(?:er|re)|lit(?:er|re))s?\b/i.test(text) && amount) {
    const litres = /\b(l|lit(?:er|re))s?\b/i.test(text) && !/\bml\b/i.test(text);
    return { type: "water", confidence: "high", fields: { value: amount, unit: litres ? "l" : "ml" }, sourceText: text };
  }
  if (/\b(spent|expense|paid|bought)\b/i.test(text) || /[₹$€£]\s*\d/.test(text)) {
    const category = lower.replace(/.*?\d+(?:\.\d+)?/, "").replace(/\b(on|for|at)\b/, "").trim();
    return { type: "expense", confidence: amount ? "medium" : "low", fields: { amount: amount || "", category: category || "Other", currency: text.includes("₹") ? "INR" : text.includes("€") ? "EUR" : text.includes("£") ? "GBP" : "USD" }, sourceText: text };
  }
  if (/^journal(?: note)?\s*:/i.test(text) || /^note\s*:/i.test(text)) return { type: "journal", confidence: "high", fields: { note: text.replace(/^[^:]+:\s*/, "") }, sourceText: text };
  if (/\b(mood|felt|feeling)\b/i.test(text)) return { type: "mood", confidence: "low", fields: { note: text }, sourceText: text };
  if (/\b(completed|done|finished)\b/i.test(text)) return { type: "habit_lookup", confidence: "low", fields: { query: text.replace(/\b(completed|done|finished)\b/gi, "").trim() }, sourceText: text };
  if (/\b(remind|task|action|todo)\b/i.test(text)) return { type: "task", confidence: "medium", fields: { title: text.replace(/^(remind me to|task|action|todo)\s*/i, "").replace(/\s+at\s+\d.*$/i, "").trim(), time: timeFrom(text) }, sourceText: text };
  return { type: "journal", confidence: "low", fields: { note: text }, sourceText: text };
};

