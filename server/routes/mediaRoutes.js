const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const mediaController = require("../controllers/mediaController");
const { authenticate } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/admin");

const router = express.Router();

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const folder = (req.body.folder || req.query.folder || "misc").toLowerCase();
    const allowedFolders = ["articles", "covers", "gallery", "profile", "newsletters", "logos", "uploads", "misc"];
    const targetFolder = allowedFolders.includes(folder) ? folder : "misc";
    const dest = path.resolve(__dirname, "../../uploads", targetFolder);
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    cb(null, dest);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const cleanName = path.basename(file.originalname, ext).toLowerCase().replace(/[^a-z0-9]+/g, "-");
    cb(null, `${cleanName}-${uniqueSuffix}${ext}`);
  }
});

// File Type Filter Validation
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
  if (allowedMimeTypes.includes(file.mimetype.toLowerCase())) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only JPG, JPEG, PNG, WEBP, and GIF are allowed."), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter
});

// Routes
router.get("/", authenticate, requireAdmin, mediaController.getMediaFiles);
router.get("/folders", authenticate, requireAdmin, mediaController.getFolders);

// File Upload - Using Multer single file upload with field name "file"
router.post("/", authenticate, requireAdmin, upload.single("file"), mediaController.uploadFile);

router.put("/:id/rename", authenticate, requireAdmin, mediaController.renameMedia);
router.put("/:id/move", authenticate, requireAdmin, mediaController.moveMedia);
router.post("/:id/restore", authenticate, requireAdmin, mediaController.restoreFile);
router.delete("/:id", authenticate, requireAdmin, mediaController.deleteFile);

module.exports = router;
