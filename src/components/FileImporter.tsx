import { useRef } from 'react';

interface FileImporterProps {
  onImport: (files: File[]) => void;
  isImporting: boolean;
  fileCount: number;
  chunkCount: number;
  lastImportAt?: number;
}

export function FileImporter({
  onImport,
  isImporting,
  fileCount,
  chunkCount,
  lastImportAt
}: FileImporterProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      onImport(Array.from(files));
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <p className="label">D&D library</p>
          <p className="muted small">
            {fileCount} file(s), {chunkCount} chunks
            {lastImportAt ? ` • geïmporteerd ${new Date(lastImportAt).toLocaleTimeString()}` : ''}
          </p>
        </div>
        <div>
          <button className="ghost small" onClick={() => inputRef.current?.click()} disabled={isImporting}>
            {isImporting ? 'Bezig...' : 'Importeer'}
          </button>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".md,text/markdown"
        multiple
        onChange={handleChange}
        hidden
      />
      <p className="muted small">
        Selecteer Markdown-bestanden of een map (als je browser dit toelaat) om rules en lore lokaal te laden.
      </p>
    </div>
  );
}
