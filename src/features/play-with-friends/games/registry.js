import { lazy } from "react";
import WhoKnowsMeBetterGame from "./who-knows-me-better/WhoKnowsMeBetterGame";
import { lifeAuctionEnabled } from "../config";

const LifeAuctionGame = lazy(() => import("./life-auction/LifeAuctionGame"));

const gameRegistry = {
  "who-knows-me-better": WhoKnowsMeBetterGame,
  ...(lifeAuctionEnabled ? { "life-auction": LifeAuctionGame } : {}),
};

export const getGameComponent = (gameKey) => gameRegistry[gameKey] || null;
