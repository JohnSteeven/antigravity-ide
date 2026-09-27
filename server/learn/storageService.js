const crypto = require("crypto");
const fs = require("fs/promises");
const path = require("path");
const { Readable } = require("stream");
const { S3Client, PutObjectCommand, HeadObjectCommand, GetObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const env = require("../config/env");

const unavailable = () => Object.assign(new Error("Private object storage is not configured."), { status: 503, code: "STORAGE_UNAVAILABLE" });
const safeKey = (key) => {
  if (!/^resources\/[0-9a-f]{24}\/[0-9a-f-]{36}$/.test(String(key))) throw Object.assign(new Error("Invalid object key."), { status: 400 });
  return key;
};
const newKey = (creatorId) => `resources/${creatorId}/${crypto.randomUUID()}`;
const localRoot = () => path.resolve(env.storage.localDirectory || path.join(process.cwd(), "private-objects"));
const localPath = (key) => path.join(localRoot(), ...safeKey(key).split("/"));
let client;
const r2 = () => {
  const { r2AccountId, r2Bucket, r2AccessKeyId, r2SecretAccessKey } = env.storage;
  if (!r2AccountId || !r2Bucket || !r2AccessKeyId || !r2SecretAccessKey) throw unavailable();
  if (!client) client = new S3Client({
    region: "auto",
    endpoint: `https://${r2AccountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: r2AccessKeyId, secretAccessKey: r2SecretAccessKey },
    forcePathStyle: true,
  });
  return { client, bucket: r2Bucket };
};
const provider = () => {
  if (env.storage.provider === "r2") { r2(); return "r2"; }
  if (env.storage.provider === "local" && env.nodeEnv !== "production") return "local_development";
  throw unavailable();
};
const put = async ({ key, buffer, mimeType }) => {
  const active = provider();
  if (active === "local_development") {
    const target = localPath(key);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, buffer, { flag: "wx" });
  } else {
    const { client: s3, bucket } = r2();
    await s3.send(new PutObjectCommand({ Bucket: bucket, Key: safeKey(key), Body: buffer, ContentType: mimeType }));
  }
  return { sizeBytes: buffer.length, checksum: crypto.createHash("sha256").update(buffer).digest("hex") };
};
const head = async (asset) => {
  if (asset.provider === "local_development") {
    const stat = await fs.stat(localPath(asset.storageKey));
    return { sizeBytes: stat.size, mimeType: asset.mimeType };
  }
  if (asset.provider === "r2") {
    const { client: s3, bucket } = r2();
    const data = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: safeKey(asset.storageKey) }));
    return { sizeBytes: data.ContentLength, mimeType: data.ContentType };
  }
  throw unavailable();
};
const read = async (asset) => {
  if (asset.provider === "local_development") return Readable.from(await fs.readFile(localPath(asset.storageKey)));
  if (asset.provider === "r2") {
    const { client: s3, bucket } = r2();
    const data = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: safeKey(asset.storageKey) }));
    return data.Body;
  }
  throw unavailable();
};
const remove = async (asset) => {
  if (asset.provider === "local_development") return fs.unlink(localPath(asset.storageKey));
  if (asset.provider === "r2") {
    const { client: s3, bucket } = r2();
    return s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: safeKey(asset.storageKey) }));
  }
  throw unavailable();
};

module.exports = { provider, newKey, put, head, read, remove };
