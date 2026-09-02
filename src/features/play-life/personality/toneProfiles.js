export const toneProfiles = {
  gentle: { pace: "slow", humour: 0, directness: 1 },
  balanced: { pace: "natural", humour: 1, directness: 2 },
  "best-friend": { pace: "natural", humour: 2, directness: 2 },
  coach: { pace: "focused", humour: 1, directness: 3 },
  quiet: { pace: "slow", humour: 0, directness: 1 },
};

export const getToneProfile = (tone = "balanced", jokeAffinity = 0) => {
  const profile = toneProfiles[tone] || toneProfiles.balanced;
  return {
    ...profile,
    humour: Math.max(0, Math.min(3, profile.humour + Math.sign(jokeAffinity))),
  };
};
