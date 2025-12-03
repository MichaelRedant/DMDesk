import { useEffect, useState } from 'react';
import { AppSettings, LanguageCode } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  settings: AppSettings;
  onSave: (next: AppSettings) => void;
  onClose: () => void;
}

export function SettingsModal({ isOpen, settings, onSave, onClose }: SettingsModalProps) {
  const [apiKey, setApiKey] = useState(settings.apiKey ?? '');
  const [preferredLanguage, setPreferredLanguage] = useState<LanguageCode>(settings.preferredLanguage);
  const [activeSetting, setActiveSetting] = useState<AppSettings['activeSetting']>(
    settings.activeSetting ?? 'generic'
  );
  const [model, setModel] = useState<string>(settings.model ?? 'gpt-4o-mini');
  const [chunkStrategy, setChunkStrategy] = useState<AppSettings['chunkStrategy']>(settings.chunkStrategy ?? 'heading');
  const [useLlmForRules, setUseLlmForRules] = useState<boolean>(settings.useLlmForRules ?? true);

  useEffect(() => {
    setApiKey(settings.apiKey ?? '');
    setPreferredLanguage(settings.preferredLanguage);
    setActiveSetting(settings.activeSetting ?? 'generic');
    setModel(settings.model ?? 'gpt-4o-mini');
    setChunkStrategy(settings.chunkStrategy ?? 'heading');
    setUseLlmForRules(settings.useLlmForRules ?? true);
  }, [settings]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({
      apiKey: apiKey.trim(),
      preferredLanguage,
      activeSetting,
      model,
      chunkStrategy,
      useLlmForRules
    });
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-header">
          <h2>Instellingen</h2>
          <button className="ghost" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <label className="input-label">
            OpenAI API key
            <input
              type="password"
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </label>
          <label className="input-label">
            Voorkeurstaal
            <select value={preferredLanguage} onChange={(e) => setPreferredLanguage(e.target.value as LanguageCode)}>
              <option value="nl-BE">Vlaams / Nederlands</option>
              <option value="en">English</option>
            </select>
          </label>
          <label className="input-label">
            Setting
            <select
              value={activeSetting ?? 'generic'}
              onChange={(e) => setActiveSetting(e.target.value as AppSettings['activeSetting'])}
            >
              <option value="generic">Generic</option>
              <option value="forgotten-realms">Forgotten Realms</option>
              <option value="eberron">Eberron</option>
              <option value="ravnica">Ravnica</option>
            </select>
          </label>
          <label className="input-label">
            OpenAI model
            <select value={model} onChange={(e) => setModel(e.target.value)}>
              <option value="gpt-4o-mini">gpt-4o-mini (snel, goedkoper)</option>
              <option value="gpt-4o">gpt-4o</option>
              <option value="gpt-4.1-mini">gpt-4.1-mini</option>
              <option value="gpt-4.1">gpt-4.1</option>
              <option value="gpt-4">gpt-4 (legacy)</option>
              <option value="gpt-5-mini">gpt-5-mini</option>
              <option value="gpt-5.1-mini">gpt-5.1-mini</option>
              <option value="gpt-5">gpt-5</option>
              <option value="gpt-5.1">gpt-5.1</option>
            </select>
          </label>
          <label className="input-label">
            Chunking
            <select value={chunkStrategy} onChange={(e) => setChunkStrategy(e.target.value as AppSettings['chunkStrategy'])}>
              <option value="heading">Per heading/sectie (aanbevolen)</option>
              <option value="file">Volledig bestand als 1 chunk (voor kleine/beknopte .md)</option>
            </select>
          </label>
          <label className="input-label checkbox-row">
            <input
              type="checkbox"
              checked={useLlmForRules}
              onChange={(e) => setUseLlmForRules(e.target.checked)}
            />
            <span>Gebruik LLM voor regels/RAW antwoorden (uit = pure lookup, geen tokens)</span>
          </label>
          <p className="muted small">
            Sleutels worden lokaal opgeslagen in je browser (localStorage). Je data blijft op dit toestel.
          </p>
        </div>
        <div className="modal-footer">
          <button className="ghost" onClick={onClose}>
            Annuleren
          </button>
          <button className="primary" onClick={handleSave}>
            Opslaan
          </button>
        </div>
      </div>
    </div>
  );
}
