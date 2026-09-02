export const AUTH_STORAGE_KEYS = {
  users: "myjourney-auth-users",
  session: "myjourney-auth-session",
  otps: "myjourney-auth-otps",
  currentChallenge: "myjourney-auth-current-challenge",
  passwordReset: "myjourney-auth-password-reset",
};

const env =
  typeof process !== "undefined" && process.env ? process.env : {};

export const AUTH_API_URL =
  env.REACT_APP_API_URL || env.PARCEL_AUTH_API_URL || "";

export const CLOUDINARY_CONFIG = {
  cloudName: env.REACT_APP_CLOUDINARY_CLOUD_NAME || "",
  uploadPreset: env.REACT_APP_CLOUDINARY_UPLOAD_PRESET || "",
};

export const OTP_LENGTH = 6;
export const OTP_EXPIRY_MS = 5 * 60 * 1000;
export const OTP_RESEND_MS = 60 * 1000;

export const AUTH_BACKGROUND_IMAGE =
  "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1900&q=85";

export const VERIFICATION_PURPOSES = {
  register: "register",
  loginOtp: "login-otp",
  passwordReset: "password-reset",
};

export const AUTH_PROVIDERS = {
  google: "Google",
  github: "GitHub",
};

export const DEFAULT_PROFILE = {
  avatar: "",
  coverImage: "",
  bio: "",
  location: "",
  website: "",
  skills: [],
};
