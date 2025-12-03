import { Mode } from '../types';
import { FileImporter } from './FileImporter';

interface SidebarProps {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
  onImport: (files: File[]) => void;
  isImporting: boolean;
  fileCount: number;
  chunkCount: number;
  lastImportAt?: number;
  onOpenSettings: () => void;
}

export function Sidebar({
  mode,
  onModeChange,
  onImport,
  isImporting,
  fileCount,
  chunkCount,
  lastImportAt,
  onOpenSettings
}: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="logo">
        <span className="logo-dot" />
        <div>
          <p className="muted small">DMDesk</p>
          <h1>DM assistent</h1>
        </div>
      </div>

      <div className="tabs">
        <button className={mode === 'rules' ? 'tab active' : 'tab'} onClick={() => onModeChange('rules')}>
          Q&A (Regels/Lore)
        </button>
        <button className={mode === 'story' ? 'tab active' : 'tab'} onClick={() => onModeChange('story')}>
          Story tools
        </button>
      </div>

      <FileImporter
        onImport={onImport}
        isImporting={isImporting}
        fileCount={fileCount}
        chunkCount={chunkCount}
        lastImportAt={lastImportAt}
      />

      <div className="card">
        <p className="label">Snel tips</p>
        <ul className="tips">
          <li>Gebruik duidelijke kernwoorden. Ze worden gebruikt voor matching.</li>
          <li>Hou de API key up-to-date in Instellingen.</li>
          <li>Herimporteren? Klik Instellingen of de import-knop.</li>
        </ul>
        <button className="ghost small" onClick={onOpenSettings}>
          Instellingen
        </button>
      </div>
    </aside>
  );
}
