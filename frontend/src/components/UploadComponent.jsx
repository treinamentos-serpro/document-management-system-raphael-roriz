import { useState } from 'react';
import formatFileSize from '../utils/formatFileSize.js';

const maxFileSize = 10 * 1024 * 1024;

export default function UploadComponent({ file, onFileChange, onSubmit, uploading, resetKey }) {
  const [error, setError] = useState('');

  function handleChange(event) {
    const nextFile = event.target.files?.[0] || null;
    setError('');
    if (nextFile && nextFile.size > maxFileSize) {
      onFileChange(null);
      setError('O arquivo deve ter no máximo 10 MB.');
      event.target.value = '';
      return;
    }
    onFileChange(nextFile);
  }

  return (
    <form className="upload-panel" onSubmit={onSubmit}>
      <div className="upload-icon" aria-hidden="true">
        <span className="upload-arrow">↑</span>
        <span className="upload-tray" />
      </div>
      <div className="upload-copy">
        <h2>Adicionar um documento</h2>
        <p>Escolha um arquivo para guardar no seu espaço.</p>
      </div>
      <div className="upload-actions">
        <label className="file-picker" htmlFor="document-file">
          {file ? 'Trocar arquivo' : 'Escolher arquivo'}
        </label>
        <input
          key={resetKey}
          className="visually-hidden"
          id="document-file"
          type="file"
          onChange={handleChange}
          disabled={uploading}
          aria-invalid={Boolean(error)}
          aria-describedby="upload-meta"
          aria-label="Selecionar documento"
        />
        <button className="upload-button" type="submit" disabled={!file || uploading}>
          {uploading ? 'Enviando…' : 'Enviar documento'}
          {!uploading && <span aria-hidden="true">↗</span>}
        </button>
      </div>
      <div id="upload-meta" className="upload-meta" aria-live="polite">
        {error ? (
          <span role="alert">{error}</span>
        ) : file ? (
          <><strong>{file.name}</strong><span>{formatFileSize(file.size)}</span></>
        ) : (
          <span>Um arquivo por envio · máximo de 10 MB</span>
        )}
      </div>
    </form>
  );
}