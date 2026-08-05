/**
 * StorageFactory.js  —  Storage Adapter Factory
 *
 * Reads STORAGE_DRIVER env → returns the correct storage adapter.
 * All adapters implement the same interface:
 *   upload(file, options)  → { url, key, size, mimetype }
 *   delete(key)            → boolean
 *   url(key)              → string
 *   health()              → { status, driver, ... }
 *
 * Default: LocalStorage (saves to /uploads, zero dependencies)
 * Optional: S3Storage | CloudinaryStorage | AzureStorage (via env config)
 */
const config = require('../config/configRegistry');

function create() {
  const driver = config.get('storage.driver', 'local');

  switch (driver) {
    case 's3': {
      const S3Storage = require('./S3Storage');
      return new S3Storage();
    }
    case 'cloudinary': {
      const CloudinaryStorage = require('./CloudinaryStorage');
      return new CloudinaryStorage();
    }
    case 'azure': {
      const AzureStorage = require('./AzureStorage');
      return new AzureStorage();
    }
    case 'local':
    default:
      const LocalStorage = require('./LocalStorage');
      return new LocalStorage();
  }
}

// Singleton
let _instance = null;
module.exports = {
  create,
  get instance() {
    if (!_instance) _instance = create();
    return _instance;
  },
};
