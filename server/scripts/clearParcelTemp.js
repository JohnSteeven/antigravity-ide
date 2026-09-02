/**
 * Explicit Windows recovery for stale Parcel atomic-write files.
 *
 * Normal startup never runs this command. It refuses to operate while the
 * Parcel port is in use and only removes regular project-prefixed files that
 * have been untouched for at least one hour.
 */

"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { checkPortAvailable } = require("../config/runtimeDiagnostics");

const ONE_HOUR_MS = 60 * 60 * 1000;

const clearStaleParcelTemp = ({
  fsModule = fs,
  tempDirectory = os.tmpdir(),
  projectName = path.basename(path.resolve(__dirname, "..", "..")),
  now = Date.now(),
  minimumAgeMs = ONE_HOUR_MS,
} = {}) => {
  let removed = 0;
  let skipped = 0;
  const staleBefore = now - minimumAgeMs;

  const entries = fsModule.readdirSync(tempDirectory);
  for (const entry of entries) {
    if (!entry.startsWith(`${projectName}.`)) continue;
    const fullPath = path.join(tempDirectory, entry);
    try {
      const stat = fsModule.statSync(fullPath);
      if (!stat.isFile() || stat.mtimeMs > staleBefore) {
        skipped += 1;
        continue;
      }
      fsModule.unlinkSync(fullPath);
      removed += 1;
    } catch (error) {
      if (!["ENOENT", "EACCES", "EPERM"].includes(error.code)) throw error;
      skipped += 1;
    }
  }

  return { removed, skipped };
};

const main = async () => {
  const parcelPort = Number(process.env.PARCEL_PORT || 1234);
  const port = await checkPortAvailable({ port: parcelPort });
  if (!port.available) {
    process.stderr.write(
      `[clearParcelTemp] Refusing cleanup while Parcel port ${parcelPort} is in use. Stop the existing UI process first.\n`
    );
    process.exitCode = 1;
    return;
  }

  try {
    const result = clearStaleParcelTemp();
    process.stdout.write(
      `[clearParcelTemp] Removed ${result.removed} stale file(s); skipped ${result.skipped} active, locked, or non-file entry/entries.\n`
    );
  } catch (error) {
    process.stderr.write(`[clearParcelTemp] Cleanup failed safely (${error.code || error.name || "Error"}).\n`);
    process.exitCode = 1;
  }
};

if (require.main === module) main();

module.exports = { ONE_HOUR_MS, clearStaleParcelTemp };
