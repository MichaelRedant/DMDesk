import { useMemo, useState } from 'react';
import { marked } from 'marked';
import { useLibraryStore } from '../store/library';

export function MonsterLibrary() {
  const { bookMonsters } = useLibraryStore();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return bookMonsters;
    return bookMonsters.filter(
      (m) =>
        m.name.toLowerCase().includes(term) ||
        m.sourceText.toLowerCase().includes(term) ||
        (m.fileName?.toLowerCase().includes(term) ?? false)
    );
  }, [bookMonsters, search]);

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <p className="label">Monster Manual Library</p>
          <p className="muted small">{filtered.length} monsters</p>
        </div>
        <input
          className="search-input"
          placeholder="Zoek naam of regel..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="monster-library">
        {filtered.length === 0 && <p className="muted small">Geen monsters gevonden.</p>}
        {filtered.map((m) => (
          <article key={m.id} className="monster-lib-card">
            <header className="monster-lib-header">
              <div>
                <h3>{m.name}</h3>
                <p className="muted small">{m.fileName}</p>
              </div>
              {m.imageUrl ? <img src={m.imageUrl} alt={m.name} className="thumb" /> : null}
            </header>
            <div
              className="monster-lib-body"
              dangerouslySetInnerHTML={{ __html: marked.parse(m.sourceText || '') }}
            />
          </article>
        ))}
      </div>
    </div>
  );
}
