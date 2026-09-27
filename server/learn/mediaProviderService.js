const Mux = require("@mux/mux-node");
const env = require("../config/env");

const unavailable = () => Object.assign(new Error("Production media delivery is not configured."), {
  status: 503,
  code: "MEDIA_PROVIDER_UNAVAILABLE",
});
let mux;
const configured = () => Boolean(env.mux?.tokenId && env.mux?.tokenSecret && env.mux?.webhookSecret && env.mux?.signingKey && env.mux?.privateKey);
const client = () => {
  if (!configured()) throw unavailable();
  if (!mux) mux = new Mux({ tokenId: env.mux.tokenId, tokenSecret: env.mux.tokenSecret, webhookSecret: env.mux.webhookSecret, jwtSigningKey: env.mux.signingKey, jwtPrivateKey: env.mux.privateKey, timeout: 10000, maxRetries: 1 });
  return mux;
};

class LearnMediaProviderService {
  static capability() {
    return {
      providerConfigured: configured(),
      directUploadAvailable: configured(),
      adaptiveStreamingAvailable: configured(),
      signedDeliveryAvailable: configured(),
      malwareScanningAvailable: false,
    };
  }

  static async createUploadSession({ assetId } = {}) {
    if (!configured()) throw unavailable();
    if (!assetId) throw Object.assign(new Error("Start a video upload from an owned Course lesson."), { status: 422, code: "COURSE_CONTEXT_REQUIRED" });
    const upload = await client().video.uploads.create({
      cors_origin: env.clientUrl,
      timeout: 3600,
      new_asset_settings: { playback_policies: ["signed"], passthrough: String(assetId), video_quality: "basic" },
    });
    return { uploadId: upload.id, uploadUrl: upload.url, expiresInSeconds: 3600 };
  }
  static async verifyWebhook(rawBody, headers) {
    return client().webhooks.unwrap(rawBody, headers, env.mux.webhookSecret);
  }
  static async issuePlayback(asset) {
    if (asset?.provider !== "mux" || !asset.muxPlaybackId) throw unavailable();
    const token = await client().jwt.signPlaybackId(asset.muxPlaybackId, { type: "playback", expiration: "15m" });
    return { playbackId: asset.muxPlaybackId, tokens: { playback: token }, expiresInSeconds: 900 };
  }
  static async issueDownload() { throw unavailable(); }
}

module.exports = LearnMediaProviderService;
