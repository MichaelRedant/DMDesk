import { useMemo, useState } from 'react';
import { Monster, MonsterFilters } from '../types/monsters';
import { MonsterFilters as MonsterFiltersPanel } from './MonsterFilters';
import { MonsterList } from './MonsterList';
import { MonsterDetail } from './MonsterDetail';
import { filterAndSortMonsters } from '../services/monsterSearch';
import { STRINGS, LanguageCode } from '../config/strings';

interface MonsterBrowserProps {
  monsters: Monster[];
  lang: LanguageCode;
}

export function MonsterBrowser({ monsters, lang }: MonsterBrowserProps) {
  const [filters, setFilters] = useState<MonsterFilters>({
    text: '',
    sources: [],
    minCR: undefined,
    maxCR: undefined,
    types: [],
    sizes: []
  });
  const [sortBy, setSortBy] = useState<'name' | 'cr' | 'source' | 'type'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedId, setSelectedId] = useState<string>();
  const t = STRINGS[lang];

  const availableTypes = useMemo(() => {
    const set = new Set<string>();
    monsters.forEach((m) => m.type && set.add(m.type));
    return Array.from(set).sort();
  }, [monsters]);

  const filtered = useMemo(
    () => filterAndSortMonsters(monsters, filters, sortBy, sortDirection),
    [monsters, filters, sortBy, sortDirection]
  );

  const selected = filtered.find((m) => m.id === selectedId) ?? filtered[0];

  return (
    <div className="monster-browser">
      <aside className="monster-sidebar">
        <MonsterFiltersPanel filters={filters} availableTypes={availableTypes} lang={lang} onChange={setFilters} />
        <div className="card">
          <div className="row-actions" style={{ justifyContent: 'space-between' }}>
            <div className="chips">
              <button
                className={sortBy === 'name' ? 'pill accent' : 'pill muted'}
                onClick={() => setSortBy('name')}
              >
                Name
              </button>
              <button className={sortBy === 'cr' ? 'pill accent' : 'pill muted'} onClick={() => setSortBy('cr')}>
                CR
              </button>
              <button
                className={sortBy === 'source' ? 'pill accent' : 'pill muted'}
                onClick={() => setSortBy('source')}
              >
                Source
              </button>
              <button className={sortBy === 'type' ? 'pill accent' : 'pill muted'} onClick={() => setSortBy('type')}>
                Type
              </button>
            </div>
            <button
              className="ghost small"
              onClick={() => setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'))}
              title="Toggle sort direction"
            >
              {sortDirection === 'asc' ? '▲' : '▼'}
            </button>
          </div>
        </div>
        <MonsterList monsters={filtered} selectedId={selected?.id} onSelect={setSelectedId} />
      </aside>
      <main className="monster-main">
        <MonsterDetail monster={selected} lang={lang} />
      </main>
    </div>
  );
}
