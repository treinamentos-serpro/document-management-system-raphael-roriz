const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');

process.env.MAX_FILE_SIZE_BYTES = '32';
const fileRepository = require('../src/repositories/fileRepository');
const app = require('../src/app');

test('o app backend é exportado', () => {
  assert.ok(app, 'o app deve estar definido');
  assert.strictEqual(typeof app, 'function', 'o app Express deve ser uma função');
});

test('upload, listagem, isolamento e download de documentos', async (context) => {
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const createdIds = [];

  context.after(async () => {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    for (const id of createdIds) {
      fileRepository.remove(id);
    }
  });

  const form = new FormData();
  form.append('file', new Blob(['document body']), 'notes.txt');
  const uploadResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': 'test-owner' },
    body: form
  });
  assert.strictEqual(uploadResponse.status, 201);
  const created = await uploadResponse.json();
  createdIds.push(created.id);
  assert.strictEqual(created.originalName, 'notes.txt');
  assert.strictEqual(created.size, 13);
  assert.ok(!Object.hasOwn(created, 'storageName'));
  assert.strictEqual(created.owner, 'test-owner');
  assert.ok(Number.isFinite(Date.parse(created.uploadedAt)));
  assert.strictEqual(fs.readFileSync(fileRepository.getFilePath(created.id), 'utf8'), 'document body');

  const listResponse = await fetch(`${baseUrl}/documents`, {
    headers: { 'X-User-Id': 'test-owner' }
  });
  assert.deepStrictEqual((await listResponse.json()).documents.map(({ id }) => id), [created.id]);

  const otherUserResponse = await fetch(`${baseUrl}/documents`, {
    headers: { 'X-User-Id': 'another-owner' }
  });
  assert.deepStrictEqual((await otherUserResponse.json()).documents, []);

  const deniedResponse = await fetch(`${baseUrl}/documents/${created.id}/download`, {
    headers: { 'X-User-Id': 'another-owner' }
  });
  assert.strictEqual(deniedResponse.status, 404);

  const deniedDelete = await fetch(`${baseUrl}/documents/${created.id}`, {
    method: 'DELETE',
    headers: { 'X-User-Id': 'another-owner' }
  });
  assert.strictEqual(deniedDelete.status, 404);
  assert.strictEqual(fs.existsSync(fileRepository.getFilePath(created.id)), true);

  const downloadResponse = await fetch(`${baseUrl}/documents/${created.id}/download`, {
    headers: { 'X-User-Id': 'test-owner' }
  });
  assert.strictEqual(downloadResponse.status, 200);
  assert.strictEqual(await downloadResponse.text(), 'document body');
  assert.match(downloadResponse.headers.get('content-disposition'), /notes\.txt/);

  const deleteResponse = await fetch(`${baseUrl}/documents/${created.id}`, {
    method: 'DELETE',
    headers: { 'X-User-Id': 'test-owner' }
  });
  assert.strictEqual(deleteResponse.status, 204);
  assert.strictEqual(fs.existsSync(fileRepository.getFilePath(created.id)), false);

  const listAfterDelete = await fetch(`${baseUrl}/documents`, {
    headers: { 'X-User-Id': 'test-owner' }
  });
  assert.deepStrictEqual((await listAfterDelete.json()).documents, []);
});

test('rejeita usuário ausente, arquivo ausente e arquivo acima do limite', async (context) => {
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  context.after(() => new Promise((resolve) => server.close(resolve)));

  const missingUserForm = new FormData();
  missingUserForm.append('file', new Blob(['x'.repeat(33)]), 'ok.txt');
  const storedFilesBefore = fs.readdirSync(fileRepository.storageDirectory);
  const missingUser = await fetch(`${baseUrl}/upload`, { method: 'POST', body: missingUserForm });
  assert.strictEqual(missingUser.status, 400);
  assert.strictEqual((await missingUser.json()).error.code, 'USER_REQUIRED');
  assert.deepStrictEqual(fs.readdirSync(fileRepository.storageDirectory), storedFilesBefore);

  const missingFile = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': 'test-owner' },
    body: new FormData()
  });
  assert.strictEqual(missingFile.status, 400);
  assert.strictEqual((await missingFile.json()).error.code, 'FILE_REQUIRED');

  const oversizedForm = new FormData();
  oversizedForm.append('file', new Blob(['x'.repeat(33)]), 'large.txt');
  const oversized = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': 'test-owner' },
    body: oversizedForm
  });
  assert.strictEqual(oversized.status, 413);
  assert.strictEqual((await oversized.json()).error.code, 'FILE_TOO_LARGE');
});
