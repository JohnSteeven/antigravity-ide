jest.mock("../../config/env", () => ({
  clientUrl: "https://myjourney.example",
  mux: { tokenId: "test-id", tokenSecret: "test-secret", webhookSecret: "test-webhook-secret", signingKey: "test-key-id", privateKey: "test-private-key" },
}));
jest.mock("@mux/mux-node", () => jest.fn());

const Mux = require("@mux/mux-node");
const env = require("../../config/env");
const MediaProvider = require("../../learn/mediaProviderService");

const create = jest.fn(async () => ({ id: "upload_1", url: "https://upload.mux.com/signed" }));
const unwrap = jest.fn(async () => ({ type: "video.asset.ready", data: {} }));
const signPlaybackId = jest.fn(async () => "short-lived-jwt");
Mux.mockImplementation(() => ({ video: { uploads: { create } }, webhooks: { unwrap }, jwt: { signPlaybackId } }));

beforeEach(() => { jest.clearAllMocks(); });

test("Mux direct upload enforces signed playback, fixed CORS origin and server passthrough", async () => {
  const result = await MediaProvider.createUploadSession({ assetId: "65e000000000000000000001" });
  expect(create).toHaveBeenCalledWith(expect.objectContaining({
    cors_origin: "https://myjourney.example",
    new_asset_settings: expect.objectContaining({ playback_policies: ["signed"], passthrough: "65e000000000000000000001" }),
  }));
  expect(result).toEqual({ uploadId: "upload_1", uploadUrl: "https://upload.mux.com/signed", expiresInSeconds: 3600 });
  expect(JSON.stringify(result)).not.toContain("test-secret");
});

test("playback token is scoped to one playback ID and expires in 15 minutes", async () => {
  const result = await MediaProvider.issuePlayback({ provider: "mux", muxPlaybackId: "signed_playback" });
  expect(signPlaybackId).toHaveBeenCalledWith("signed_playback", { type: "playback", expiration: "15m" });
  expect(result).toEqual({ playbackId: "signed_playback", tokens: { playback: "short-lived-jwt" }, expiresInSeconds: 900 });
});

test("webhook verification passes raw body and server-only signing secret to SDK", async () => {
  await MediaProvider.verifyWebhook('{"type":"video.asset.ready"}', { "mux-signature": "signed" });
  expect(unwrap).toHaveBeenCalledWith('{"type":"video.asset.ready"}', { "mux-signature": "signed" }, "test-webhook-secret");
});

test("missing configuration fails closed without exposing credentials", () => {
  const previous = env.mux.privateKey;
  env.mux.privateKey = "";
  expect(MediaProvider.capability().signedDeliveryAvailable).toBe(false);
  env.mux.privateKey = previous;
});
