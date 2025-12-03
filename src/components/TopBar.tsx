import { AppSettings } from '../types';

interface TopBarProps {
  settings: AppSettings;
  onOpenSettings: () => void;
  onClear: () => void;
}

export function TopBar({ settings, onOpenSettings, onClear }: TopBarProps) {
  const languageLabel = settings.preferredLanguage === 'nl-BE' ? 'NL (Vlaams)' : 'EN';
  const settingLabel = settings.activeSetting?.replace('-', ' ') ?? 'Generic';
  const modelLabel = settings.model ?? 'gpt-4o-mini';

  return (
    <header className="topbar">
      <div className="badge">
        <span className="pill">{languageLabel}</span>
        <span className="pill muted">{settingLabel}</span>
        <span className="pill accent">{modelLabel}</span>
      </div>
      <div className="topbar-actions">
        <button className="ghost" onClick={onClear}>
          Clear chat
        </button>
        <button className="primary" onClick={onOpenSettings}>
          Settings
        </button>
      </div>
    </header>
  );
}
