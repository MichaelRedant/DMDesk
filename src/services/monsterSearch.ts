import { Monster, MonsterFilters } from '../types/monsters';

function matchesText(monster: Monster, tokens: string[]): boolean {
  const haystack = `${monster.name} ${monster.type ?? ''} ${monster.fluffRaw ?? ''}`.toLowerCase();
  return tokens.every((t) => haystack.includes(t));
}

export function filterAndSortMonsters(
  monsters: Monster[],
  filters: MonsterFilters,
  sortBy: 'name' | 'cr' | 'source' | 'type',
  sortDirection: 'asc' | 'desc'
): Monster[] {
  const tokens = filters.text
    ? filters.text
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean)
    : [];

  const filtered = monsters.filter((m) => {
    if (filters.sources.length && !filters.sources.includes(m.sourceId)) return false;
    if (filters.types.length && (!m.type || !filters.types.some((t) => m.type?.toLowerCase().includes(t.toLowerCase()))))
      return false;
    if (filters.sizes.length && (!m.size || !filters.sizes.includes(m.size))) return false;
    if (filters.minCR !== undefined && (m.challengeRatingValue ?? -Infinity) < filters.minCR) return false;
    if (filters.maxCR !== undefined && (m.challengeRatingValue ?? Infinity) > filters.maxCR) return false;
    if (tokens.length && !matchesText(m, tokens)) return false;
    return true;
  });

  const sorted = filtered.sort((a, b) => {
    const dir = sortDirection === 'asc' ? 1 : -1;
    if (sortBy === 'name') return dir * a.name.localeCompare(b.name);
    if (sortBy === 'source') return dir * (a.sourceId.localeCompare(b.sourceId) || a.name.localeCompare(b.name));
    if (sortBy === 'type') return dir * ((a.type || '').localeCompare(b.type || '') || a.name.localeCompare(b.name));
    if (sortBy === 'cr') {
      const av = a.challengeRatingValue ?? -Infinity;
      const bv = b.challengeRatingValue ?? -Infinity;
      if (av === bv) return dir * a.name.localeCompare(b.name);
      return dir * (av - bv);
    }
    return 0;
  });

  return sorted;
}
