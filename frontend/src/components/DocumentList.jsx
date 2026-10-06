import DownloadButton from './DownloadButton.jsx';
import formatFileSize from '../utils/formatFileSize.js';

function formatDate(value) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(new Date(value));
}

function getExtension(name) {
  const extension = name.split('.').pop();
  return extension && extension !== name ? extension.slice(0, 4).toUpperCase() : 'FILE';
}

export default function DocumentList({ documents, loading, downloadingId, onDownload }) {
  if (loading) {
    return <div className="list-state" role="status">Carregando documentos…</div>;
  }

  if (documents.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-mark" aria-hidden="true">—</span>
        <p>Nenhum documento por aqui.</p>
      </div>
    );
  }

  return (
    <div className="document-list">
      {documents.toSorted((first, second) => new Date(second.uploadedAt) - new Date(first.uploadedAt)).map((document) => (
        <article className="document-row" key={document.id}>
          <span className="file-type" aria-hidden="true">{getExtension(document.originalName)}</span>
          <div className="document-name">
            <h3 title={document.originalName}>{document.originalName}</h3>
            <p>Enviado em {formatDate(document.uploadedAt)}</p>
          </div>
          <span className="document-size">{formatFileSize(document.size)}</span>
          <DownloadButton
            downloading={downloadingId === document.id}
            disabled={Boolean(downloadingId)}
            fileName={document.originalName}
            onClick={() => onDownload(document)}
          />
        </article>
      ))}
    </div>
  );
}