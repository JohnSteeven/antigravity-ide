import {
  AUTH_STORAGE_KEYS,
  CLOUDINARY_CONFIG,
  DEFAULT_PROFILE,
} from "../utils/constants";
import {
  getToday,
  readStorage,
  stripSensitiveUserFields,
  writeStorage,
} from "../utils/helpers";

const getUsers = () => readStorage(AUTH_STORAGE_KEYS.users, []);
const saveUsers = (users) => writeStorage(AUTH_STORAGE_KEYS.users, users);

export const userService = {
  findById(userId) {
    return getUsers().find((user) => user.id === userId) || null;
  },

  findByIdentifier(identifier) {
    const normalized = String(identifier || "").trim().toLowerCase();
    const normalizedDigits = normalized.replace(/\D/g, "");
    return (
      getUsers().find(
        (user) => {
          const userMobile = String(user.mobile || "").replace(/\s+/g, "");
          const userMobileDigits = userMobile.replace(/\D/g, "");

          return (
            user.email.toLowerCase() === normalized ||
            userMobile === normalized.replace(/\s+/g, "") ||
            (normalizedDigits.length >= 10 &&
              userMobileDigits.endsWith(normalizedDigits))
          );
        }
      ) || null
    );
  },

  getPublicUser(userId) {
    return stripSensitiveUserFields(this.findById(userId));
  },

  updateProfile(userId, updates) {
    let updatedUser = null;
    const users = getUsers().map((user) => {
      if (user.id !== userId) return user;

      updatedUser = {
        ...user,
        ...updates,
        profile: {
          ...DEFAULT_PROFILE,
          ...(user.profile || {}),
          ...(updates.profile || {}),
        },
        updatedAt: getToday(),
      };

      return updatedUser;
    });

    saveUsers(users);
    return stripSensitiveUserFields(updatedUser);
  },

  replaceUser(nextUser) {
    saveUsers(getUsers().map((user) => (user.id === nextUser.id ? nextUser : user)));
    return stripSensitiveUserFields(nextUser);
  },

  async uploadImage(file, fallbackDataUrl) {
    if (!CLOUDINARY_CONFIG.cloudName || !CLOUDINARY_CONFIG.uploadPreset) {
      return fallbackDataUrl;
    }

    const formData = new FormData();
    formData.append("file", file || fallbackDataUrl);
    formData.append("upload_preset", CLOUDINARY_CONFIG.uploadPreset);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error("Cloudinary upload failed. Your local preview was kept.");
    }

    const data = await response.json();
    return data.secure_url;
  },
};
