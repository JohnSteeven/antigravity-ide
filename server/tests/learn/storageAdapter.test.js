const fs = require("fs/promises");
const os = require("os");
const path = require("path");

let directory;
jest.mock("../../config/env", () => ({ nodeEnv: "test", storage: { provider: "local", localDirectory: "" } }));
const env = require("../../config/env");
const storage = require("../../learn/storageService");

describe("private local object adapter", () => {
  beforeEach(async () => {
    directory = await fs.mkdtemp(path.join(os.tmpdir(), "myjourney-private-"));
    env.storage.localDirectory = directory;
  });
  afterEach(async () => { await fs.rm(directory, { recursive: true, force: true }); });

  test("stores, verifies, reads, and removes a server-generated private object", async () => {
    const key = storage.newKey("65b000000000000000000001");
    const buffer = Buffer.from("%PDF-1.4 sample");
    const stored = await storage.put({ key, buffer, mimeType: "application/pdf" });
    expect(stored.sizeBytes).toBe(buffer.length);
    expect(stored.checksum).toMatch(/^[0-9a-f]{64}$/);
    const asset = { provider: "local_development", storageKey: key, mimeType: "application/pdf" };
    expect(await storage.head(asset)).toEqual({ sizeBytes: buffer.length, mimeType: "application/pdf" });
    const chunks = [];
    for await (const chunk of await storage.read(asset)) chunks.push(chunk);
    expect(Buffer.concat(chunks)).toEqual(buffer);
    await storage.remove(asset);
    await expect(storage.head(asset)).rejects.toThrow();
  });

  test("rejects path traversal and refuses overwrite", async () => {
    await expect(storage.put({ key: "../outside", buffer: Buffer.from("x"), mimeType: "text/plain" })).rejects.toThrow("Invalid object key");
    const key = storage.newKey("65b000000000000000000001");
    await storage.put({ key, buffer: Buffer.from("first"), mimeType: "text/plain" });
    await expect(storage.put({ key, buffer: Buffer.from("second"), mimeType: "text/plain" })).rejects.toMatchObject({ code: "EEXIST" });
  });

  test("R2 mode fails closed without server credentials", () => {
    env.storage.provider = "r2";
    expect(() => storage.provider()).toThrow("Private object storage is not configured");
    env.storage.provider = "local";
  });
});
