export const playWithFriendsEnabled =
  typeof process === "undefined" || process.env?.PARCEL_MULTIPLAYER_ENABLED !== "false";

export const lifeAuctionEnabled =
  typeof process === "undefined" || process.env?.PARCEL_LIFE_AUCTION_ENABLED !== "false";
