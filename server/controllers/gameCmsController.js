const GameContentPack = require("../models/GameContentPack");

class GameCmsController {
  async getPacks(req, res, next) {
    try {
      const filter = { isDeleted: false };
      if (req.query.gameKey) filter.gameKey = req.query.gameKey;
      if (req.query.status) filter.status = req.query.status;
      if (req.query.locale) filter.locale = req.query.locale;

      const page = Math.max(1, parseInt(req.query.page, 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
      const skip = (page - 1) * limit;

      const [packs, total] = await Promise.all([
        GameContentPack.find(filter)
          .sort({ updatedAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        GameContentPack.countDocuments(filter),
      ]);

      res.json({
        packs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async getPackById(req, res, next) {
    try {
      const pack = await GameContentPack.findOne({
        _id: req.params.id,
        isDeleted: false,
      }).select("+questions.correctAnswer");

      if (!pack) {
        return res.status(404).json({ message: "Game content pack not found." });
      }

      res.json({ pack });
    } catch (err) {
      next(err);
    }
  }

  async createPack(req, res, next) {
    try {
      const {
        key, gameKey, title, description, locale,
        difficulty, status, questions, tags,
      } = req.body;

      if (!key || !gameKey || !title) {
        return res.status(422).json({ message: "Key, gameKey, and title are required." });
      }

      const existing = await GameContentPack.findOne({ key: key.toLowerCase().trim() });
      if (existing) {
        return res.status(409).json({ message: "A game content pack with this key already exists." });
      }

      const pack = await GameContentPack.create({
        key: key.toLowerCase().trim(),
        gameKey,
        title: title.trim(),
        description: description ? description.trim() : "",
        locale: locale ? locale.toLowerCase().trim() : "en",
        difficulty: difficulty || "mixed",
        status: status || "draft",
        questions: Array.isArray(questions) ? questions : [],
        tags: Array.isArray(tags) ? tags : [],
        createdBy: req.user._id,
        updatedBy: req.user._id,
        publishedAt: status === "published" ? new Date() : null,
      });

      res.status(201).json({ pack, message: "Game content pack created successfully." });
    } catch (err) {
      if (err.code === 11000 || (err.name === "MongoServerError" && err.code === 11000) || err.message?.includes("E11000")) {
        return res.status(409).json({ message: "A game content pack with this key already exists." });
      }
      next(err);
    }
  }

  async updatePack(req, res, next) {
    try {
      const pack = await GameContentPack.findOne({
        _id: req.params.id,
        isDeleted: false,
      });

      if (!pack) {
        return res.status(404).json({ message: "Game content pack not found." });
      }

      const {
        title, description, locale, difficulty,
        status, questions, tags, version,
      } = req.body;

      if (title !== undefined) pack.title = title.trim();
      if (description !== undefined) pack.description = description.trim();
      if (locale !== undefined) pack.locale = locale.toLowerCase().trim();
      if (difficulty !== undefined) pack.difficulty = difficulty;
      if (tags !== undefined) pack.tags = Array.isArray(tags) ? tags : [];
      if (version !== undefined) pack.version = version;
      if (questions !== undefined) pack.questions = Array.isArray(questions) ? questions : [];

      if (status !== undefined) {
        if (status === "published" && pack.status !== "published") {
          pack.publishedAt = new Date();
        }
        pack.status = status;
      }

      pack.updatedBy = req.user._id;
      await pack.save();

      res.json({ pack, message: "Game content pack updated successfully." });
    } catch (err) {
      if (err.code === 11000 || (err.name === "MongoServerError" && err.code === 11000) || err.message?.includes("E11000")) {
        return res.status(409).json({ message: "A game content pack with this key already exists." });
      }
      next(err);
    }
  }

  async deletePack(req, res, next) {
    try {
      const pack = await GameContentPack.findOne({
        _id: req.params.id,
        isDeleted: false,
      });

      if (!pack) {
        return res.status(404).json({ message: "Game content pack not found." });
      }

      pack.isDeleted = true;
      pack.updatedBy = req.user._id;
      await pack.save();

      res.json({ message: "Game content pack deleted successfully." });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new GameCmsController();

