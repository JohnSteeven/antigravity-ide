const crypto = require("crypto");
const LifeFinanceEntry = require("../models/LifeFinanceEntry");
const LifeImportBatch = require("../models/LifeImportBatch");
const profileService = require("./profileService");
const { LifeError, notFound } = require("../domain/errors");
const { assertDateKey } = require("../domain/time");

const parseCsvLine = (line) => {
  const values = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"' && quoted && line[index + 1] === '"') { value += '"'; index += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) { values.push(value.trim()); value = ""; }
    else value += char;
  }
  values.push(value.trim());
  return values;
};

const parseCsv = (text) => {
  const records = [];
  let record = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '"' && quoted && text[index + 1] === '"') { value += '"'; index += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) { record.push(value.trim()); value = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[index + 1] === "\n") index += 1;
      record.push(value.trim()); value = "";
      if (record.some((item) => item !== "")) records.push(record);
      record = [];
    } else value += char;
  }
  if (value || record.length) { record.push(value.trim()); if (record.some((item) => item !== "")) records.push(record); }
  if (quoted) throw new LifeError("CSV contains an unclosed quoted value.", 422, "LIFE_IMPORT_CSV_INVALID");
  return records;
};

const parseDateValue = (value) => {
  const raw = String(value || "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return assertDateKey(raw);
  const iso = raw.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (iso) return assertDateKey(`${iso[1]}-${iso[2].padStart(2, "0")}-${iso[3].padStart(2, "0")}`);
  const slash = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (slash) {
    const first = Number(slash[1]); const second = Number(slash[2]);
    if (first <= 12 && second <= 12) throw new Error("Ambiguous date. Use YYYY-MM-DD.");
    const month = first > 12 ? second : first; const day = first > 12 ? first : second;
    return assertDateKey(`${slash[3]}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
  }
  throw new Error("Date is invalid. Use YYYY-MM-DD.");
};

const normalizeHeader = (value) => String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
const rowHash = (values) => crypto.createHash("sha256").update(values.join("\u001f")).digest("hex").slice(0, 40);

const previewFinanceCsv = async (userId, csvText, mapping = {}) => {
  const text = String(csvText || "").replace(/^\uFEFF/, "").trim();
  if (!text) throw new LifeError("Choose a CSV file with a header row.", 422, "LIFE_IMPORT_EMPTY");
  if (Buffer.byteLength(text, "utf8") > 1024 * 1024) throw new LifeError("CSV preview is limited to 1 MB.", 413, "LIFE_IMPORT_TOO_LARGE");
  const records = parseCsv(text);
  if (records.length < 2) throw new LifeError("CSV needs a header and at least one transaction row.", 422, "LIFE_IMPORT_EMPTY");
  if (records.length > 1001) throw new LifeError("Preview up to 1,000 rows at a time.", 422, "LIFE_IMPORT_TOO_MANY_ROWS");
  const headers = records[0].map(normalizeHeader);
  const requested = {
    date: normalizeHeader(mapping.date || "date"), amount: normalizeHeader(mapping.amount || "amount"),
    type: normalizeHeader(mapping.type || "type"), currency: normalizeHeader(mapping.currency || "currency"),
    category: normalizeHeader(mapping.category || "category"), payee: normalizeHeader(mapping.payee || "payee"), note: normalizeHeader(mapping.note || "note"), id: normalizeHeader(mapping.id || "id"),
  };
  const indexes = Object.fromEntries(Object.entries(requested).map(([key, header]) => [key, headers.indexOf(header)]));
  if (indexes.date < 0 || indexes.amount < 0) throw new LifeError("Map both date and amount columns.", 422, "LIFE_IMPORT_MAPPING");
  const profile = await profileService.getOrCreateProfile(userId);
  const rows = [];
  const invalidRows = [];
  records.slice(1).forEach((values, offset) => {
    const rowNumber = offset + 2;
    try {
      const rawAmount = String(values[indexes.amount] || "").replace(/[^0-9.-]/g, "");
      const amount = Number(rawAmount);
      if (!Number.isFinite(amount)) throw new Error("Amount is invalid.");
      const rawType = indexes.type >= 0 ? String(values[indexes.type] || "expense").toLowerCase().replace(/\s+/g, "_") : amount < 0 ? "expense" : "expense";
      const type = ["expense", "income", "savings_contribution"].includes(rawType) ? rawType : "expense";
      const date = parseDateValue(values[indexes.date]);
      const currency = String(indexes.currency >= 0 ? values[indexes.currency] : profile.currency).trim().toUpperCase();
      if (!/^[A-Z]{3}$/.test(currency)) throw new Error("Currency must use a three-letter code.");
      const externalId = String(indexes.id >= 0 ? values[indexes.id] : "").trim() || rowHash(values);
      rows.push({ rowNumber, type, amountMinor: Math.round(Math.abs(amount) * 100), currency, localDate: date, category: indexes.category >= 0 ? values[indexes.category] || "Other" : "Other", payee: indexes.payee >= 0 ? values[indexes.payee] || "" : "", note: indexes.note >= 0 ? values[indexes.note] || "" : "", externalId });
    } catch (error) { invalidRows.push({ rowNumber, reason: error.message || "Invalid row." }); }
  });
  const externalIds = rows.map((row) => row.externalId);
  const duplicates = await LifeFinanceEntry.find({ user: userId, "source.provider": "csv", "source.externalId": { $in: externalIds } }).select("source.externalId").lean();
  const duplicateIds = new Set(duplicates.map((entry) => entry.source?.externalId));
  rows.forEach((row) => { row.duplicate = duplicateIds.has(row.externalId); });
  const batch = await LifeImportBatch.create({ user: userId, kind: "finance_csv", rows, invalidRows, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) });
  return { batchId: batch._id, rowsDetected: records.length - 1, validRows: rows.length, duplicateRows: rows.filter((row) => row.duplicate).length, invalidRows, importableRows: rows.filter((row) => !row.duplicate).length, preview: rows.slice(0, 25) };
};

const confirmFinanceImport = async (userId, batchId) => {
  const batch = await LifeImportBatch.findOneAndUpdate(
    { _id: batchId, user: userId, status: "preview", expiresAt: { $gt: new Date() } },
    { $set: { status: "importing" } },
    { new: true }
  );
  if (!batch) throw notFound("Import preview");
  const rows = batch.rows.filter((row) => !row.duplicate);
  const duplicatesSkipped = batch.rows.length - rows.length;
  let imported = 0;
  if (rows.length) {
    const importedAt = new Date();
    try {
      const documents = await LifeFinanceEntry.insertMany(rows.map((row) => ({ user: userId, type: row.type, amountMinor: row.amountMinor, currency: row.currency, category: row.category, payee: row.payee, note: row.note, localDate: row.localDate, occurredAt: new Date(`${row.localDate}T12:00:00.000Z`), source: { type: "import", provider: "csv", externalId: row.externalId, originalTimestamp: new Date(`${row.localDate}T12:00:00.000Z`), importedAt }, dedupeKey: `csv:${row.externalId}` })), { ordered: false });
      imported = documents.length;
    } catch (error) {
      if (error.code !== 11000) { batch.status = "preview"; await batch.save(); throw error; }
      imported = error.insertedDocs?.length || error.result?.insertedCount || 0;
    }
  }
  batch.status = "imported";
  batch.importedCount = imported;
  batch.rows = [];
  await batch.save();
  return { imported, duplicatesSkipped: duplicatesSkipped + (rows.length - imported), invalidSkipped: batch.invalidRows.length };
};

module.exports = { confirmFinanceImport, parseCsv, parseCsvLine, parseDateValue, previewFinanceCsv };
