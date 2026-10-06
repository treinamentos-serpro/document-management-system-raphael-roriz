const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const multer = require('multer');

const storageDirectory = path.resolve(__dirname, '../../storage');
fs.mkdirSync(storageDirectory, { recursive: true });

const configuredLimit = Number.parseInt(process.env.MAX_FILE_SIZE_BYTES, 10);
const maxFileSize = Number.isSafeInteger(configuredLimit) && configuredLimit > 0
  ? configuredLimit
  : 10 * 1024 * 1024;

function createUploadMiddleware() {
  const storage = multer.diskStorage({
    destination: storageDirectory,
    filename: (req, file, callback) => {
      const id = randomUUID();
      req.documentId = id;
      callback(null, id);
    }
  });

  return multer({ storage, limits: { fileSize: maxFileSize } }).single('file');
}

function getFilePath(storageName) {
  if (!storageName || path.basename(storageName) !== storageName) {
    return null;
  }

  return path.join(storageDirectory, storageName);
}

function exists(storageName) {
  const filePath = getFilePath(storageName);
  return Boolean(filePath && fs.existsSync(filePath));
}

function remove(storageName) {
  const filePath = getFilePath(storageName);
  if (filePath) {
    fs.rmSync(filePath, { force: true });
  }
}

module.exports = { createUploadMiddleware, exists, getFilePath, remove, storageDirectory };