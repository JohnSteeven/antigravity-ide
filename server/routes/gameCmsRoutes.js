/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  gameCmsRoutes.js  —  Game Content Packs CMS API Routes
 *  MyJourney CMS  |  Phase 3: Play Content Management
 * ─────────────────────────────────────────────────────────────────────────────
 */

const express = require("express");
const router = express.Router();
const gameCmsController = require("../controllers/gameCmsController");
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');
const apiRegistry = require("../core/apiRegistry");

// Content packs for games are managed exclusively by Admins in the CMS
router.use(authenticate, requireAdmin);

router.get("/", gameCmsController.getPacks);
router.get("/:id", gameCmsController.getPackById);
router.post("/", gameCmsController.createPack);
router.put("/:id", gameCmsController.updatePack);
router.delete("/:id", gameCmsController.deletePack);

apiRegistry.register({
  name: "GameContentPacks",
  prefix: "/api/cms/game-packs",
  router,
  public: false,
});

module.exports = router;
