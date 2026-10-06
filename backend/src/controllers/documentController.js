const documentService = require('../services/documentService');

function getOwner(req, res) {
  const owner = req.get('X-User-Id')?.trim();
  if (!owner || owner.length > 128 || /[\u0000-\u001f\u007f]/.test(owner)) {
    res.status(400).json({
      error: { code: 'USER_REQUIRED', message: 'Informe um identificador de usuário válido.' }
    });
    return null;
  }

  return owner;
}

function requireOwner(req, res, next) {
  const owner = getOwner(req, res);
  if (!owner) return;

  req.documentOwner = owner;
  return next();
}

function upload(req, res) {
  if (!req.file) {
    return res.status(400).json({
      error: { code: 'FILE_REQUIRED', message: 'Envie um arquivo no campo "file".' }
    });
  }

  const document = documentService.createDocument({ id: req.documentId, file: req.file, owner: req.documentOwner });
  return res.status(201).json(document);
}

function list(req, res) {
  return res.json({ documents: documentService.listDocuments(req.documentOwner) });
}

function download(req, res) {
  const result = documentService.findDownload(req.params.id, req.documentOwner);
  if (!result) {
    return res.status(404).json({
      error: { code: 'DOCUMENT_NOT_FOUND', message: 'Documento não encontrado.' }
    });
  }

  return res.download(result.filePath, result.document.originalName, (error) => {
    if (error && !res.headersSent) {
      res.status(500).json({
        error: { code: 'INTERNAL_ERROR', message: 'Não foi possível baixar o documento.' }
      });
    }
  });
}

module.exports = {
  download,
  list,
  receiveFile: documentService.createUploadMiddleware(),
  requireOwner,
  upload
};