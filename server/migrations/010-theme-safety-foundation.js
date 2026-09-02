"use strict";

/**
 * Migration 010 — theme safety foundation
 *
 * Early Dark Pro seed records omitted dark surface/panel/muted fields. Mongoose
 * filled those paths with light defaults, making light text unreadable on a
 * white surface. Update only the built-in Dark Pro record and only values that
 * exactly match those known legacy defaults. Custom themes are untouched.
 */

module.exports = {
  version: "1.0.0",

  async up(db) {
    await db.collection("themes").updateMany(
      { key: "dark-pro", isBuiltIn: true },
      [
        {
          $set: {
            "tokens.colors.surface": {
              $cond: [
                { $eq: ["$tokens.colors.surface", "#ffffff"] },
                "#161b22",
                "$tokens.colors.surface",
              ],
            },
            "tokens.colors.panel": {
              $cond: [
                { $eq: ["$tokens.colors.panel", "#fdfbf7"] },
                "#161b22",
                "$tokens.colors.panel",
              ],
            },
            "tokens.colors.muted": {
              $cond: [
                { $eq: ["$tokens.colors.muted", "#666d6d"] },
                "#8b949e",
                "$tokens.colors.muted",
              ],
            },
          },
        },
      ]
    );
  },

  async down() {
    // The corrected values are valid theme data and intentionally remain.
  },
};
