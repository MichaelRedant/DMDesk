import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppSettings, LanguageCode } from '../types';

interface SettingsState extends AppSettings {
  setApiKey: (apiKey: string | null) => void;
  setPreferredLanguage: (lang: LanguageCode) => void;
  setActiveSetting: (setting: AppSettings['activeSetting']) => void;
  setModel: (model: string) => void;
  setChunkStrategy: (strategy: AppSettings['chunkStrategy']) => void;
  setUseLlmForRules: (use: boolean) => void;
}

const defaultSettings: AppSettings = {
  apiKey: null,
  preferredLanguage: 'nl-BE',
  activeSetting: 'generic',
  model: 'gpt-4o-mini',
  chunkStrategy: 'heading',
  useLlmForRules: true
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaultSettings,
      setApiKey: (apiKey) => set({ apiKey }),
      setPreferredLanguage: (preferredLanguage) => set({ preferredLanguage }),
      setActiveSetting: (activeSetting) => set({ activeSetting }),
      setModel: (model) => set({ model }),
      setChunkStrategy: (chunkStrategy) => set({ chunkStrategy }),
      setUseLlmForRules: (useLlmForRules) => set({ useLlmForRules })
    }),
    { name: 'dmdesk_settings' }
  )
);
