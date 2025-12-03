import { BookMonster, LibraryFile, TextChunk } from '../types';

const DEFAULT_CHUNK_SIZE = 2600;

export const HARDCODED_BOOK_FILES: string[] = [
  "Acquisitions Incorporated.md",
  "Astral Adventurer's Guide.md",
  "Bigby Presents_ Glory of the Giants.md",
  "Boo's Astral Menagerie.md",
  "Dungeon Master's Guide (2024).md",
  "Dungeon Master's Screen (2024).md",
  "Fizban's Treasury of Dragons.md",
  "Forgotten Realms_ Adventures in Faer–n.md",
  "Forgotten Realms_ Heroes of Faer–n.md",
  "Heroes' Feast Flavors of the Multiverse.md",
  "Monster Manual (2025).md",
  "Monstrous Compendium Volume 4_ Eldraine Creatures.md",
  "Mordenkainen Presents_ Monsters of the Multiverse.md",
  "Mordenkainen's Tome of Foes.md",
  "Morte's Planar Parade.md",
  "Player's Handbook (2024).md",
  "Puncheons and Flagons.md",
  "Sigil and the Outlands.md",
  "Tarot Deck.md",
  "Tasha's Cauldron of Everything.md",
  "The Book of Many Things.md",
  "The Deck of Many Things_ Card Reference Guide.md",
  "Volo's Guide to Monsters.md",
  "Xanathar's Guide to Everything.md"
];

export async function readLibraryFiles(files: File[]): Promise<LibraryFile[]> {
  const results: LibraryFile[] = [];
  for (const file of files) {
    const content = await file.text();
    results.push({
      id: crypto.randomUUID(),
      name: file.name,
      path: (file as any).path ?? undefined,
      content
    });
  }
  return results;
}

export async function loadHardcodedBooks(): Promise<LibraryFile[]> {
  const results: LibraryFile[] = [];
  for (const name of HARDCODED_BOOK_FILES) {
    const url = `/books/${encodeURIComponent(name)}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Kon bestand niet laden: ${name} (${res.status})`);
    }
    const content = await res.text();
    results.push({
      id: crypto.randomUUID(),
      name,
      path: url,
      content
    });
  }
  return results;
}

function stripHtml(text: string): string {
  return text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeHeadings(raw: string): string {
  let text = raw.replace(/\r\n/g, '\n');
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<h([1-6])[^>]*>(.*?)<\/h\1>/gi, (_, level, inner) => {
    const hashes = '#'.repeat(Number(level) || 1);
    const cleaned = stripHtml(inner);
    return `\n${hashes} ${cleaned}\n`;
  });
  return text;
}

export function extractBookMonsters(file: LibraryFile): BookMonster[] {
  const normalized = normalizeHeadings(file.content);
  const lines = normalized.split('\n');
  const sections: { name: string; text: string }[] = [];

  let currentName: string | null = null;
  let buffer: string[] = [];
  const flush = () => {
    if (currentName) {
      sections.push({ name: currentName, text: buffer.join('\n').trim() });
    }
    buffer = [];
  };

  for (const line of lines) {
    const headingMatch = line.match(/^##\s+(.+)/);
    if (headingMatch) {
      flush();
      currentName = headingMatch[1].trim();
      continue;
    }
    if (currentName) {
      buffer.push(line);
    }
  }
  flush();

  const monsters: BookMonster[] = [];
  sections.forEach((section) => {
    const text = section.text;
    const hasStatMarkers = /Armor Class|Hit Points|Speed|Saving Throws|Actions/i.test(text);
    if (!hasStatMarkers) return;

    const acMatch = text.match(/Armor Class\s+(\d+)/i);
    const hpMatch = text.match(/Hit Points\s+(\d+)/i);
    const imageMatch =
      section.text.match(/!\[[^\]]*\]\(([^)]+)\)/) ||
      section.text.match(/<img[^>]*src=["']([^"']+)["'][^>]*>/i);

    const stripped = stripHtml(text);

    monsters.push({
      id: crypto.randomUUID(),
      fileName: file.name,
      name: section.name,
      sourceText: stripped.slice(0, 4000),
      ac: acMatch ? Number(acMatch[1]) : undefined,
      hp: hpMatch ? Number(hpMatch[1]) : undefined,
      imageUrl: imageMatch ? imageMatch[1] : undefined
    });
  });

  return monsters;
}

export function extractClassRaceNames(files: LibraryFile[]): string[] {
  const names = new Set<string>();
  files.forEach((file) => {
    if (!/player's handbook|phb|class|race|heritage/i.test(file.name)) return;
    const normalized = normalizeHeadings(file.content);
    normalized.split('\n').forEach((line) => {
      const match = line.match(/^##\s+([A-Z][A-Za-z'’ -]{2,40})$/);
      if (match) {
        const name = match[1].trim();
        if (name.toLowerCase().includes('chapter')) return;
        if (name.length > 2 && name.length < 40) {
          names.add(name);
        }
      }
    });
  });
  return Array.from(names).sort();
}

export function chunkMarkdown(
  file: LibraryFile,
  maxChunkSize: number = DEFAULT_CHUNK_SIZE,
  strategy: 'heading' | 'file' = 'heading'
): TextChunk[] {
  const content = normalizeHeadings(file.content);

  if (strategy === 'file') {
    return [
      {
        id: crypto.randomUUID(),
        fileId: file.id,
        fileName: file.name,
        heading: 'Full file',
        startOffset: 0,
        endOffset: content.length,
        text: content
      }
    ];
  }

  const headingMatches = [...content.matchAll(/^#{1,6}\s+.*$/gm)];
  const sections: { heading?: string; text: string; start: number; end: number }[] = [];

  if (headingMatches.length === 0) {
    sections.push({
      heading: 'Intro',
      text: content,
      start: 0,
      end: content.length
    });
  } else {
    const firstIndex = headingMatches[0].index ?? 0;
    if (firstIndex > 0) {
      sections.push({
        heading: 'Intro',
        text: content.slice(0, firstIndex),
        start: 0,
        end: firstIndex
      });
    }

    headingMatches.forEach((match, idx) => {
      const start = match.index ?? 0;
      const end = headingMatches[idx + 1]?.index ?? content.length;
      const headingText = match[0].replace(/^#{1,6}\s+/, '').trim();
      const text = content.slice(start, end);
      sections.push({
        heading: headingText,
        text,
        start,
        end
      });
    });
  }

  const chunks: TextChunk[] = [];

  const sliceIntoChunks = (
    text: string,
    heading: string | undefined,
    absoluteStart: number,
    absoluteEnd: number
  ) => {
    let localStart = 0;
    const length = text.length;

    while (localStart < length) {
      const remaining = length - localStart;
      const targetEnd = localStart + Math.min(remaining, maxChunkSize);
      const window = text.slice(localStart, targetEnd);

      const paragraphBreak = window.lastIndexOf('\n\n');
      const sentenceBreak = window.lastIndexOf('. ');

      let cutIndex = targetEnd;
      if (paragraphBreak > maxChunkSize * 0.5) {
        cutIndex = localStart + paragraphBreak + 2;
      } else if (sentenceBreak > maxChunkSize * 0.5) {
        cutIndex = localStart + sentenceBreak + 2;
      }

      const rawChunk = text.slice(localStart, cutIndex);
      const chunkText = stripHtml(rawChunk).trim();
      if (chunkText) {
        const startOffset = absoluteStart + localStart;
        const endOffset = absoluteStart + cutIndex;
        chunks.push({
          id: crypto.randomUUID(),
          fileId: file.id,
          fileName: file.name,
          heading,
          startOffset,
          endOffset,
          text: chunkText
        });
      }

      localStart = cutIndex;
      if (cutIndex === length) break;
    }
  };

  sections.forEach((section) => {
    sliceIntoChunks(section.text, section.heading, section.start, section.end);
  });

  return chunks;
}
