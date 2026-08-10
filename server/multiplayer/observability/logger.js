const write = (level, event, fields = {}) => {
  const record = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    service: "myjourney-multiplayer",
    event,
    ...fields,
  });
  const method = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
  method(record);
};

module.exports = {
  error: (event, fields) => write("error", event, fields),
  info: (event, fields) => write("info", event, fields),
  warn: (event, fields) => write("warn", event, fields),
};
