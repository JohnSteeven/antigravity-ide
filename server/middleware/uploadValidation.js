/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  uploadValidation.js  —  Strict File Upload Security Middleware
 *  MyJourney Platform  |  Private Beta Hardening
 * ─────────────────────────────────────────────────────────────────────────────
 */

const path = require('path');
const crypto = require('crypto');

// Allowed extension to MIME mapping
const ALLOWED_MIME_EXT_MAP = {
  // Images
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/pjpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
  // Audio
  'audio/mpeg': ['.mp3'],
  'audio/mp3': ['.mp3'],
  'audio/wav': ['.wav'],
  'audio/x-wav': ['.wav'],
  'audio/ogg': ['.ogg'],
  'audio/mp4': ['.m4a'],
  'audio/x-m4a': ['.m4a'],
  // Video
  'video/mp4': ['.mp4'],
  'video/webm': ['.webm'],
  // Documents
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'text/plain': ['.txt'],
};

// Disallowed extensions (case-insensitive)
const DISALLOWED_EXTENSIONS = new Set([
  '.html', '.htm', '.xhtml', '.svg', '.js', '.mjs', '.cjs', '.ts',
  '.exe', '.bat', '.cmd', '.sh', '.bash', '.php', '.php3', '.php4', '.phtml',
  '.dll', '.so', '.elf', '.vbs', '.ps1', '.jar', '.py', '.pl', '.cgi',
  '.asp', '.aspx', '.jsp', '.htaccess', '.env', '.config',
]);

/**
 * Sanitize original filename to prevent path traversal or special chars.
 */
function sanitizeFilename(originalName) {
  const ext = path.extname(originalName || '').toLowerCase();
  const base = path.basename(originalName || 'file', ext)
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 80);
  return `${base || 'file'}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}${ext}`;
}

/**
 * Inspect magic bytes of buffer.
 */
function checkMagicBytes(buffer, ext) {
  if (!buffer || !Buffer.isBuffer(buffer) || buffer.length === 0) return false;

  const hex4 = buffer.subarray(0, 4).toString('hex').toLowerCase();
  const hex8 = buffer.subarray(0, 8).toString('hex').toLowerCase();
  const ascii4 = buffer.toString('ascii', 0, 4);

  switch (ext) {
    case '.jpeg':
    case '.jpg':
      return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    case '.png':
      return hex8.startsWith('89504e47');
    case '.gif':
      return ascii4 === 'GIF8';
    case '.webp':
      return ascii4 === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';
    case '.pdf':
      return ascii4 === '%PDF';
    case '.mp3':
      return ascii4.startsWith('ID3') || (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0);
    case '.wav':
      return ascii4 === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WAVE';
    case '.ogg':
      return ascii4 === 'OggS';
    case '.mp4':
    case '.m4a':
      return buffer.length >= 8 && buffer.toString('ascii', 4, 8) === 'ftyp';
    case '.webm':
      return hex4 === '1a45dfa3';
    case '.doc':
      return hex8.startsWith('d0cf11e0');
    case '.docx':
      return hex4 === '504b0304'; // PK zip header
    case '.txt': {
      // Validate text content is valid UTF-8 and contains no HTML/script tags
      const text = buffer.toString('utf8');
      const lower = text.toLowerCase();
      if (lower.includes('<script') || lower.includes('<?php') || lower.includes('javascript:') || lower.includes('<!doctype html') || lower.includes('<html')) {
        return false;
      }
      return true;
    }
    default:
      return false;
  }
}

/**
 * Multer file filter (checks extension & declared MIME).
 */
function multerFileFilter(req, file, cb) {
  const ext = path.extname(file.originalname || '').toLowerCase();
  const mimetype = (file.mimetype || '').toLowerCase();

  if (DISALLOWED_EXTENSIONS.has(ext)) {
    const err = new Error(`File extension '${ext}' is not allowed for security reasons.`);
    err.statusCode = 400;
    return cb(err, false);
  }

  const allowedExts = ALLOWED_MIME_EXT_MAP[mimetype];
  if (!allowedExts || !allowedExts.includes(ext)) {
    const err = new Error(`MIME type '${mimetype}' and file extension '${ext}' mismatch or are unsupported.`);
    err.statusCode = 415;
    return cb(err, false);
  }

  cb(null, true);
}

/**
 * Post-Multer buffer validation middleware (checks magic bytes and content).
 */
function validateFileBuffer(req, res, next) {
  if (!req.file || !req.file.buffer) {
    return next();
  }

  const ext = path.extname(req.file.originalname || '').toLowerCase();
  const buffer = req.file.buffer;

  // Executable script content check on all buffers
  const sample = buffer.subarray(0, 1024).toString('utf8').toLowerCase();
  if (
    sample.includes('<script') ||
    sample.includes('<?php') ||
    sample.includes('javascript:') ||
    sample.includes('<!doctype html') ||
    sample.includes('<html')
  ) {
    return res.status(400).json({
      error: 'Security Error',
      message: 'File content contains disallowed executable or script tags.',
    });
  }

  const isValidMagic = checkMagicBytes(buffer, ext);
  if (!isValidMagic) {
    return res.status(415).json({
      error: 'Unsupported Media Type',
      message: `File content header (magic bytes) does not match declared extension '${ext}'.`,
    });
  }

  // Attach sanitized filename
  req.file.sanitizedFilename = sanitizeFilename(req.file.originalname);
  next();
}

module.exports = {
  multerFileFilter,
  validateFileBuffer,
  sanitizeFilename,
  checkMagicBytes,
};
