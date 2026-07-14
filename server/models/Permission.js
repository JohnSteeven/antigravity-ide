const mongoose = require("mongoose");

const PermissionSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    module: { type: String, required: true, index: true },
    description: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Permission", PermissionSchema);
