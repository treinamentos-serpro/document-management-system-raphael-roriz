import { useEffect, useState } from 'react';
import { downloadDocument, listDocuments, uploadDocument } from './services/documentsApi.js';
import UploadComponent from './components/UploadComponent.jsx';
import DocumentList from './components/DocumentList.jsx';
import './styles.css';

export default function App() {
  const [owner, setOwner] = useState(() => window.localStorage.getItem('dms-user-id') || 'usuario-demo');
  const [documents, setDocuments] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [resetUpload, setResetUpload] = useState(0);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    window.localStorage.setItem('dms-user-id', owner);
    setDocuments([]);
    setLoading(true);
    setError('');
    setNotice('');

    let active = true;
    listDocuments(owner)
      .then((result) => {
        if (active) setDocuments(result);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [owner]);

  async function handleUpload(event) {
    event.preventDefault();
    if (!selectedFile || uploading) return;

    setUploading(true);
    setError('');
    setNotice('');
    try {
      await uploadDocument(owner, selectedFile);
      setSelectedFile(null);
      setResetUpload((value) => value + 1);
      setNotice('Documento enviado.');
      setDocuments(await listDocuments(owner));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleDownload(document) {
    if (downloadingId) return;
    setDownloadingId(document.id);
    setError('');
    try {
      const blob = await downloadDocument(owner, document.id);
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = document.originalName;
      window.document.body.append(link);
      try {
        link.click();
      } finally {
        link.remove();
        URL.revokeObjectURL(url);
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="wordmark" href="#main" aria-label="Arquivo, início">
          <span className="brand-mark" aria-hidden="true"><span /></span>
          <span>arquivo<span className="wordmark-period">.</span></span>
        </a>
        <div className="identity-control">
          <label htmlFor="owner-id">Identificador</label>
          <input
            id="owner-id"
            value={owner}
            maxLength={128}
            disabled={uploading || Boolean(downloadingId)}
            onChange={(event) => setOwner(event.target.value)}
            aria-describedby="identity-note"
          />
          <span id="identity-note">Identificação local, sem login</span>
        </div>
      </header>

      <main id="main" className="workspace">
        <section className="page-heading" aria-labelledby="page-title">
          <div>
            <p className="eyebrow">ESPAÇO PESSOAL <span /></p>
            <h1 id="page-title">Seus documentos</h1>
            <p className="heading-copy">Arquivos reunidos em um só lugar.</p>
          </div>
          <div className="document-total" aria-live="polite">
            <strong>{documents.length.toString().padStart(2, '0')}</strong>
            <span>{documents.length === 1 ? 'arquivo' : 'arquivos'}</span>
          </div>
        </section>

        {error && <div className="message message-error" role="alert">{error}</div>}
        {notice && <div className="message message-success" role="status">{notice}</div>}

        <UploadComponent
          file={selectedFile}
          onFileChange={(file) => {
            setSelectedFile(file);
            setError('');
            setNotice('');
          }}
          onSubmit={handleUpload}
          uploading={uploading}
          resetKey={resetUpload}
        />

        <section className="documents-section" aria-labelledby="documents-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">BIBLIOTECA</p>
              <h2 id="documents-title">Todos os arquivos</h2>
            </div>
            <span className="sort-label">Mais recentes primeiro <span aria-hidden="true">↓</span></span>
          </div>
          <DocumentList
            documents={documents}
            loading={loading}
            downloadingId={downloadingId}
            onDownload={handleDownload}
          />
        </section>
      </main>
      <footer className="footer"><span>ARQUIVO PESSOAL</span><span>DOCUMENTOS LOCAIS</span></footer>
    </div>
  );
}