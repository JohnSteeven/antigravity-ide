const urgentPatterns = [
  /kill myself/i,
  /end my life/i,
  /suicid/i,
  /hurt myself/i,
  /self[- ]?harm/i,
  /do not want to live/i,
  /don't want to live/i,
  /immediate danger/i,
  /not safe at home/i,
  /being abused/i,
];

const assessSafety = (text = "") => {
  const normalized = String(text).trim();
  if (!normalized) return { level: "normal", matched: false };

  const matched = urgentPatterns.some((pattern) => pattern.test(normalized));
  return {
    level: matched ? "urgent" : "normal",
    matched,
  };
};

module.exports = { assessSafety };
