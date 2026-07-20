const mongoose = require("mongoose");
const MONGO_URI = "mongodb://127.0.0.1:27017/myjourney";

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB!");

  const Setting = mongoose.model("Setting", new mongoose.Schema({}, { strict: false }), "settings");

  const settings = await Setting.find({});
  console.log(`Found ${settings.length} settings documents.`);

  for (const s of settings) {
    let modified = false;
    const value = s.value;
    if (value) {
      if (value.socials && (value.socials.instagram === "https://instagram.com" || !value.socials.instagram)) {
        value.socials.instagram = "https://www.instagram.com/j.steeven_?igsh=MWh6aHFyNmIxZTV6Mg==";
        modified = true;
      }
      if (value.socialLinks && (value.socialLinks.instagram === "https://instagram.com" || !value.socialLinks.instagram)) {
        value.socialLinks.instagram = "https://www.instagram.com/j.steeven_?igsh=MWh6aHFyNmIxZTV6Mg==";
        modified = true;
      }
    }
    if (modified) {
      await Setting.updateOne({ _id: s._id }, { $set: { value } });
      console.log(`Updated setting document ${s.key || s._id} Instagram link!`);
    }
  }

  console.log("Database Instagram update complete!");
  await mongoose.disconnect();
}

run().catch(console.error);
