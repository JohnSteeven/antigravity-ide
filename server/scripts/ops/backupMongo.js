'use strict';

const path = require('path');
const fs = require('fs');

/**
 * Validates destination directory to prevent accidental backups into git-tracked code.
 */
const validateDestination = (targetDir) => {
  const resolved = path.resolve(targetDir);
  const normalized = resolved.replace(/\\/g, '/');

  // Forbidden targets: root code directories
  const forbiddenPatterns = ['/src', '/public', '/docs', '/server', '/node_modules'];
  for (const forbidden of forbiddenPatterns) {
    if (normalized.endsWith(forbidden) || normalized.includes(forbidden + '/')) {
      throw new Error(`Unsafe backup destination: cannot write database dumps into project source directory '${forbidden}'.`);
    }
  }
  return resolved;
};

/**
 * Generates exact backup plan and shell commands.
 */
const generateBackupPlan = (options = {}) => {
  const baseDir = options.outDir || path.resolve(process.cwd(), 'backups/mongo');
  const validDir = validateDestination(baseDir);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const targetFolder = path.join(validDir, `myjourney_dump_${timestamp}`);

  const mongoUri = options.mongoUri || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/myjourney';
  // Redact password from display string if present
  const displayUri = mongoUri.replace(/:([^@]+)@/, ':****@');

  const dumpCommand = `mongodump --uri="${mongoUri}" --out="${targetFolder}" --gzip`;
  const restoreCommand = `mongorestore --uri="${mongoUri}" --drop "${targetFolder}" --gzip`;

  return {
    validDir,
    targetFolder,
    displayUri,
    dumpCommand,
    restoreCommand,
    isDryRun: Boolean(options.dryRun),
  };
};

const runBackup = (options = {}) => {
  const plan = generateBackupPlan(options);

  if (plan.isDryRun) {
    return {
      success: true,
      mode: 'dry-run',
      plan,
      message: 'Dry-run validation successful. mongodump command prepared safely.',
    };
  }

  // Ensure target folder exists
  fs.mkdirSync(plan.validDir, { recursive: true });
  return {
    success: true,
    mode: 'executed',
    plan,
    message: `Backup directory prepared at ${plan.targetFolder}`,
  };
};

if (require.main === module) {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');
  const outArgIndex = args.indexOf('--out');
  const outDir = outArgIndex !== -1 ? args[outArgIndex + 1] : undefined;

  try {
    const result = runBackup({ dryRun: isDryRun, outDir });
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('Backup pre-flight error:', err.message);
    process.exit(1);
  }
}

module.exports = {
  validateDestination,
  generateBackupPlan,
  runBackup,
};
