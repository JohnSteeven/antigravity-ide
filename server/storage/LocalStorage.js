/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  LocalStorage.js  —  Local File System Storage Adapter
 *  MyJourney CMS  |  Phase -1: CMS Core
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Default storage adapter. Saves files to /uploads on the local filesystem.
 *  Production should use S3/Cloudinary, but this works for development
 *  and small deployments.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

const path  = require('path');
const fs    = require('fs');
const fsp   = require('fs/promises');
const config = require('../config/configRegistry');

class LocalStorage {
  constructor() {
    this.uploadsDir = path.resolve(
      process.cwd(),
      config.get('storage.uploadsDir', './uploads')
    );
    this._ensureDir(this.uploadsDir);
    console.info(`[Storage] LocalStorage initialized at: ${this.uploadsDir}`);
  }

  _ensureDir(dir) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }

  /**
   * Save an uploaded file buffer/stream to disk.
   * @param {Buffer|string} file       File buffer or temp path
   * @param {object}        options
   * @param {string}        options.filename   Original filename
   * @param {string}        options.mimetype   MIME type
   * @param {string}        options.folder     Subdirectory (e.g. 'images')
   * @returns {{ url, key, size, mimetype }}
   */
  async upload(file, { filename, mimetype, folder = '' } = {}) {
    const subDir = path.join(this.uploadsDir, folder);
    this._ensureDir(subDir);

    const ext = path.extname(filename || '').toLowerCase();
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    const filePath = path.join(subDir, safeName);
    const key = folder ? `${folder}/${safeName}` : safeName;

    if (Buffer.isBuffer(file)) {
      await fsp.writeFile(filePath, file);
    } else if (typeof file === 'string') {
      await fsp.copyFile(file, filePath);
    } else {
      throw new Error('[LocalStorage] upload: file must be a Buffer or path string');
    }

    const stats = await fsp.stat(filePath);
    const baseUrl = config.get('app.url', 'http://localhost:5000');
    const url = `${baseUrl}/uploads/${key}`;

    return { url, key, size: stats.size, mimetype, filename: safeName };
  }

  /**
   * Delete a file by its key.
   * @param {string} key  Relative path within uploads dir
   */
  async delete(key) {
    const filePath = path.join(this.uploadsDir, key);
    try {
      await fsp.unlink(filePath);
      return true;
    } catch (err) {
      if (err.code === 'ENOENT') return false; // Already gone
      throw err;
    }
  }

  /**
   * Get the public URL for a file key.
   */
  url(key) {
    const baseUrl = config.get('app.url', 'http://localhost:5000');
    return `${baseUrl}/uploads/${key}`;
  }

  /**
   * Check storage health.
   */
  async health() {
    try {
      await fsp.access(this.uploadsDir, fs.constants.R_OK | fs.constants.W_OK);
      const stats = await fsp.statfs ? fsp.statfs(this.uploadsDir) : null;
      return {
        status: 'green',
        driver: 'local',
        path: this.uploadsDir,
        writable: true,
        ...(stats ? { freeGB: ((stats.bfree * stats.bsize) / 1e9).toFixed(1) } : {}),
      };
    } catch (err) {
      return { status: 'red', driver: 'local', error: err.message };
    }
  }
}

module.exports = LocalStorage;
