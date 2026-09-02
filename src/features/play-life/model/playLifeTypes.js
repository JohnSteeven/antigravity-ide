/**
 * @typedef {"gentle"|"balanced"|"best-friend"|"coach"|"quiet"} PlayLifeTone
 * @typedef {"normal"|"urgent"} PlayLifeSafetyLevel
 *
 * @typedef {Object} PlayLifeMood
 * @property {string} id
 * @property {string} label
 * @property {string} emoji
 * @property {string} atmosphere
 *
 * @typedef {Object} PlayLifeSceneChoice
 * @property {string} id
 * @property {string} label
 * @property {string} next
 * @property {Object} [effect]
 *
 * @typedef {Object} PlayLifeScene
 * @property {string} id
 * @property {string} type
 * @property {string} atmosphere
 * @property {string} message
 * @property {string} [secondaryMessage]
 * @property {PlayLifeSceneChoice[]} choices
 *
 * @typedef {Object} PlayLifeState
 * @property {number} version
 * @property {{id: string|null, displayName: string, lifeStage: string|null}} user
 * @property {{startedAt: string, sessionCount: number}} journey
 * @property {PlayLifeMood|null} currentMood
 * @property {PlayLifeMood|null} previousMood
 * @property {Array<PlayLifeMood & {at: string, source: string}>} moodHistory
 * @property {string} currentSceneId
 * @property {string} currentMoment
 * @property {string[]} currentPath
 * @property {string|null} currentNeed
 * @property {"low"|"medium"|"high"|null} energy
 * @property {PlayLifeTone} tone
 * @property {{id: string, startedAt: string, startingMood: PlayLifeMood|null, endingMood: string|null, completedAt: string|null}} session
 * @property {Array<Object>} choices
 * @property {Array<Object>} actionsTaken
 * @property {Array<Object>} actionFeedback
 * @property {Array<Object>} savedMoments
 * @property {{tone: PlayLifeTone, jokeAffinity: number, reducedMotion: boolean}} preferences
 * @property {{music: boolean, ambient: boolean, volume: number}} soundSettings
 * @property {Array<Object>} interactionHistory
 * @property {PlayLifeSafetyLevel} safetyLevel
 */

export {};
