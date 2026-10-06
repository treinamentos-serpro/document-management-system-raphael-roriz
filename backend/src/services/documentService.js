const documentRepository = require('../repositories/documentRepository');
const fileRepository = require('../repositories/fileRepository');

function createUploadMiddleware() {
  return fileRepository.createUploadMiddleware();
}

function createDocument({ id, file, owner }) {
  const document = {
    id,
    originalName: file.originalname,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    owner,
    storageName: file.filename
  };

  documentRepository.save(document);
  return toPublicDocument(document);
}

function listDocuments(owner) {
  return documentRepository.findByOwner(owner).map(toPublicDocument);
}

function findDownload(id, owner) {
  const document = documentRepository.findById(id);
  if (!document || document.owner !== owner || !fileRepository.exists(document.storageName)) {
    return null;
  }

  return {
    document: toPublicDocument(document),
    filePath: fileRepository.getFilePath(document.storageName)
  };
}

function toPublicDocument(document) {
  const { storageName, ...publicDocument } = document;
  return publicDocument;
}

module.exports = { createDocument, createUploadMiddleware, findDownload, listDocuments };