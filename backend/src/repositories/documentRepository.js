const documents = new Map();

function save(document) {
  documents.set(document.id, document);
  return document;
}

function findById(id) {
  return documents.get(id) || null;
}

function remove(id) {
  return documents.delete(id);
}

function findByOwner(owner) {
  return [...documents.values()]
    .filter((document) => document.owner === owner)
    .sort((first, second) => second.uploadedAt.localeCompare(first.uploadedAt));
}

module.exports = { save, findById, findByOwner, remove };