export type LanguageCode = 'nl-BE' | 'en';

export interface LibraryFile {
  id: string;
  name: string;
  path?: string;
  content: string;
}

export interface TextChunk {
  id: string;
  fileId: string;
  fileName: string;
  heading?: string;
  startOffset: number;
  endOffset: number;
  text: string;
}

export interface RetrievedChunk {
  chunk: TextChunk;
  score: number;
}

export interface AppSettings {
  apiKey: string | null;
  preferredLanguage: LanguageCode;
  activeSetting?: 'forgotten-realms' | 'eberron' | 'ravnica' | 'generic';
  model?: string;
  chunkStrategy?: 'heading' | 'file';
  useLlmForRules?: boolean;
}

export interface SourceRef {
  fileName: string;
  heading?: string;
  snippet?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  sources?: SourceRef[];
  timestamp: number;
}

export type Mode = 'rules' | 'story';

export type FocusType =
  | 'general'
  | 'class'
  | 'rule'
  | 'monster'
  | 'background'
  | 'feat'
  | 'race'
  | 'spell'
  | 'item';

export interface Player {
  id: string;
  name: string;
  className?: string;
  level?: number;
  ac?: number;
  hp?: number;
  notes?: string;
}

export interface InitiativeEntry {
  id: string;
  name: string;
  initiative: number;
  hp?: number;
  ac?: number;
  notes?: string;
}

export interface Monster {
  id: string;
  name: string;
  type?: string;
  cr?: number;
  hp?: number;
  ac?: number;
  notes?: string;
  imageUrl?: string;
}

export interface EncounterEntry {
  id: string;
  monsterId: string;
  quantity: number;
}

export interface BookMonster {
  id: string;
  fileName: string;
  name: string;
  sourceText: string;
  ac?: number;
  hp?: number;
  imageUrl?: string;
}
