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

  const loadProvider = (moduleName) => {
    try {
      const Provider = require(moduleName);
      return new Provider();
    } catch (_error) {
      const error = new Error('The configured shared storage adapter is unavailable.');
      error.status = 503;
      error.code = 'STORAGE_DRIVER_UNAVAILABLE';
      throw error;
    }
  };

  switch (driver) {
    case 's3': return loadProvider('./S3Storage');
    case 'cloudinary': return loadProvider('./CloudinaryStorage');
    case 'azure': return loadProvider('./AzureStorage');
    case 'local':
      const LocalStorage = require('./LocalStorage');
      return new LocalStorage();
    default: {
      const error = new Error('The configured storage driver is unsupported.');
      error.status = 503;
      error.code = 'STORAGE_DRIVER_UNAVAILABLE';
      throw error;
    }
  }
}

// Singleton
let _instance = null;
module.exports = {
  create,
  capability() {
    const driver = config.get('storage.driver', 'local');
    return {
      driver,
      available: driver === 'local',
      shared: false,
      protectedDelivery: false,
    };
  },
  get instance() {
    if (!_instance) _instance = create();
    return _instance;
  },
};
