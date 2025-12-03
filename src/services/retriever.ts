import { RetrievedChunk, TextChunk } from '../types';

interface RetrieveOptions {
  limit?: number;
  activeSetting?: string;
  focusTerms?: string[];
}

const FALLBACK_TERMS = ['regel', 'rule', 'lore', 'story'];

export function retrieveTopChunks(
  query: string,
  chunks: TextChunk[],
  options: RetrieveOptions = {}
): RetrievedChunk[] {
  const { limit = 8, activeSetting, focusTerms = [] } = options;
  const cleanedQuery = query.toLowerCase();
  const terms = cleanedQuery
    .split(/[^a-zA-Z0-9\u00C0-\u017F]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 1);

  const tokens = terms.length > 0 ? terms : FALLBACK_TERMS;
  const focusTokens = focusTerms.map((t) => t.toLowerCase());

  const scored: RetrievedChunk[] = chunks.map((chunk) => {
    const text = chunk.text.toLowerCase();
    const heading = chunk.heading?.toLowerCase() ?? '';
    const fileName = chunk.fileName.toLowerCase();

    let score = 0;
    tokens.forEach((term) => {
      if (!term) return;
      const occurrences = text.split(term).length - 1;
      score += occurrences;
      if (heading.includes(term)) score += 2;
      if (fileName.includes(term)) score += 1;
    });

    focusTokens.forEach((term) => {
      if (!term) return;
      if (text.includes(term)) score += 1.5;
      if (heading.includes(term)) score += 2;
      if (fileName.includes(term)) score += 1;
    });

    if (activeSetting && fileName.includes(activeSetting)) {
      score += 1.5;
    }

    return {
      chunk,
      score
    };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
