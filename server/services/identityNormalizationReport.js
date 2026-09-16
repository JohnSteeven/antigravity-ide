const {
  isValidE164,
  isValidEmail,
  normalizeE164,
  normalizeEmail,
} = require("../utils/accountIdentity");

const duplicateStats = (groups) => {
  const duplicates = [...groups.values()].filter((items) => items.length > 1);
  return {
    groups: duplicates.length,
    accounts: duplicates.reduce((total, items) => total + items.length, 0),
    verifiedGroups: duplicates.filter((items) => items.filter((item) => item.verified).length > 1).length,
    accountIndexes: duplicates.flatMap((items) => items.map((item) => item.index)),
  };
};

const buildIdentityNormalizationReport = (users = []) => {
  const emailGroups = new Map();
  const mobileGroups = new Map();
  const manualReview = new Set();
  let normalizableEmails = 0;
  let normalizableMobiles = 0;
  let invalidEmails = 0;
  let invalidMobiles = 0;
  let ambiguousMobiles = 0;

  users.forEach((user, index) => {
    const rawEmail = String(user?.email || "");
    const email = normalizeEmail(rawEmail);
    if (!isValidEmail(email)) {
      invalidEmails += 1;
      manualReview.add(index);
    } else {
      if (rawEmail !== email) normalizableEmails += 1;
      const entries = emailGroups.get(email) || [];
      entries.push({ index, verified: Boolean(user?.verified?.email) });
      emailGroups.set(email, entries);
    }

    const rawMobile = String(user?.mobile || "").trim();
    const mobile = normalizeE164(rawMobile);
    if (isValidE164(mobile)) {
      if (rawMobile !== mobile) normalizableMobiles += 1;
      const entries = mobileGroups.get(mobile) || [];
      entries.push({ index, verified: Boolean(user?.verified?.mobile) });
      mobileGroups.set(mobile, entries);
    } else if (/^\d{8,15}$/.test(rawMobile.replace(/\D/g, "")) && !rawMobile.startsWith("+")) {
      ambiguousMobiles += 1;
      manualReview.add(index);
    } else {
      invalidMobiles += 1;
      manualReview.add(index);
    }
  });

  const emailDuplicates = duplicateStats(emailGroups);
  const mobileDuplicates = duplicateStats(mobileGroups);
  [...emailDuplicates.accountIndexes, ...mobileDuplicates.accountIndexes].forEach((index) => manualReview.add(index));

  return {
    dryRun: true,
    totalAccounts: users.length,
    normalizableValues: {
      emails: normalizableEmails,
      mobiles: normalizableMobiles,
      total: normalizableEmails + normalizableMobiles,
    },
    invalidValues: {
      emails: invalidEmails,
      mobiles: invalidMobiles,
      total: invalidEmails + invalidMobiles,
    },
    ambiguousValues: {
      emails: 0,
      mobiles: ambiguousMobiles,
      total: ambiguousMobiles,
    },
    normalizedDuplicates: {
      emailGroups: emailDuplicates.groups,
      emailAccounts: emailDuplicates.accounts,
      mobileGroups: mobileDuplicates.groups,
      mobileAccounts: mobileDuplicates.accounts,
      totalGroups: emailDuplicates.groups + mobileDuplicates.groups,
      totalAccounts: emailDuplicates.accounts + mobileDuplicates.accounts,
    },
    verifiedConflicts: {
      emailGroups: emailDuplicates.verifiedGroups,
      mobileGroups: mobileDuplicates.verifiedGroups,
      totalGroups: emailDuplicates.verifiedGroups + mobileDuplicates.verifiedGroups,
    },
    manualReviewCases: manualReview.size,
    writesPerformed: 0,
  };
};

module.exports = { buildIdentityNormalizationReport };
