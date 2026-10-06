export default function DownloadButton({ disabled, downloading, fileName, onClick }) {
  return (
    <button
      className="download-button"
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={`${downloading ? 'Baixando' : 'Baixar'} ${fileName}`}
      aria-busy={downloading}
      title={`Baixar ${fileName}`}
    >
      <span aria-hidden="true">{downloading ? '…' : '↓'}</span>
      <span className="download-label">{downloading ? 'Baixando' : 'Baixar'}</span>
    </button>
  );
}