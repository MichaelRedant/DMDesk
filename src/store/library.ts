import { create } from 'zustand';
import { get, set as setCache, del } from 'idb-keyval';
import { LibraryFile, TextChunk } from '../types';
import {
  chunkMarkdown,
  readLibraryFiles,
  loadHardcodedBooks,
  extractBookMonsters,
  extractClassRaceNames
} from '../services/libraryLoader';
import { BookMonster } from '../types';

interface LibraryState {
  files: LibraryFile[];
  chunks: TextChunk[];
  bookMonsters: BookMonster[];
  classRaceNames: string[];
  isImporting: boolean;
  error?: string;
  lastImportAt?: number;
  importFiles: (files: File[], chunkStrategy?: 'heading' | 'file') => Promise<void>;
  loadFromCache: () => Promise<void>;
  loadFromPublicBooks: (chunkStrategy?: 'heading' | 'file') => Promise<void>;
  clearLibrary: () => void;
}

export const useLibraryStore = create<LibraryState>((set) => ({
  files: [],
  chunks: [],
  bookMonsters: [],
  classRaceNames: [],
  isImporting: false,
  error: undefined,
  lastImportAt: undefined,
  async importFiles(fileList: File[], chunkStrategy: 'heading' | 'file' = 'heading') {
    set({ isImporting: true, error: undefined });
    try {
      const libraryFiles = await readLibraryFiles(fileList);
      const chunked = libraryFiles.flatMap((file) => chunkMarkdown(file, undefined, chunkStrategy));
      // Alleen Monster Manual monsters auto-parsen
      const parsedMonsters = libraryFiles
        .filter((f) => /monster manual/i.test(f.name))
        .flatMap((file) => extractBookMonsters(file));
      const classRaceNames = extractClassRaceNames(libraryFiles);
      await setCache('dmdesk_files', libraryFiles);
      await setCache('dmdesk_chunks', chunked);
      await setCache('dmdesk_lastImportAt', Date.now());
      set({
        files: libraryFiles,
        chunks: chunked,
        bookMonsters: parsedMonsters,
        classRaceNames,
        lastImportAt: Date.now()
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Onbekende fout tijdens import.';
      set({ error: message });
    } finally {
      set({ isImporting: false });
    }
  },
  async loadFromCache() {
    set({ isImporting: true, error: undefined });
    try {
      const [files, chunks, lastImportAt] = await Promise.all([
        get<LibraryFile[]>('dmdesk_files'),
        get<TextChunk[]>('dmdesk_chunks'),
        get<number>('dmdesk_lastImportAt')
      ]);
      if (files && chunks) {
        const parsedMonsters = files.flatMap((file) => extractBookMonsters(file));
        const classRaceNames = extractClassRaceNames(files);
        set({ files, chunks, bookMonsters: parsedMonsters, classRaceNames, lastImportAt: lastImportAt ?? undefined });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Kon cached library niet laden.';
      set({ error: message });
    } finally {
      set({ isImporting: false });
    }
  },
  async loadFromPublicBooks(chunkStrategy: 'heading' | 'file' = 'heading') {
    set({ isImporting: true, error: undefined });
    try {
      const libraryFiles = await loadHardcodedBooks();
      const chunked = libraryFiles.flatMap((file) => chunkMarkdown(file, undefined, chunkStrategy));
      const parsedMonsters = libraryFiles
        .filter((f) => /monster manual/i.test(f.name))
        .flatMap((file) => extractBookMonsters(file));
      const classRaceNames = extractClassRaceNames(libraryFiles);
      set({ files: libraryFiles, chunks: chunked, bookMonsters: parsedMonsters, classRaceNames, lastImportAt: Date.now() });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Kon public/books niet laden.';
      set({ error: message });
    } finally {
      set({ isImporting: false });
    }
  },
  clearLibrary() {
    del('dmdesk_files');
    del('dmdesk_chunks');
    del('dmdesk_lastImportAt');
    set({ files: [], chunks: [], bookMonsters: [], lastImportAt: undefined, error: undefined });
  }
}));
