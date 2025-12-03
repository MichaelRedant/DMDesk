import { FormEvent, useState } from 'react';
import { usePartyStore } from '../store/party';
import { InitiativeEntry, SourceRef } from '../types';
import { useLibraryStore } from '../store/library';
import { retrieveTopChunks } from '../services/retriever';

export function InitiativeTracker() {
  const { initiative, players, addInitiative, removeInitiative, sortInitiative, clearInitiative } = usePartyStore();
  const { chunks } = useLibraryStore();
  const [lookup, setLookup] = useState<{ title: string; sources: SourceRef[]; text: string } | null>(null);

  const [form, setForm] = useState<Omit<InitiativeEntry, 'id'>>({
    name: '',
    initiative: 0,
    hp: undefined,
    ac: undefined,
    notes: ''
  });

  const quickFillFromPlayer = (playerId: string) => {
    const player = players.find((p) => p.id === playerId);
    if (!player) return;
    setForm({
      name: player.name,
      initiative: form.initiative,
      hp: player.hp,
      ac: player.ac,
      notes: player.notes
    });
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    addInitiative(form);
    sortInitiative();
    setForm({ name: '', initiative: 0, hp: undefined, ac: undefined, notes: '' });
  };

  const handleLookup = (term: string) => {
    if (!term.trim()) return;
    if (!chunks.length) {
      setLookup({ title: term, sources: [], text: 'Geen library geïmporteerd.' });
      return;
    }
    const retrieved = retrieveTopChunks(term, chunks, { limit: 3 });
    if (retrieved.length === 0) {
      setLookup({ title: term, sources: [], text: 'Geen match gevonden in je .md bestanden.' });
      return;
    }
    const sources: SourceRef[] = retrieved.map((r) => ({
      fileName: r.chunk.fileName,
      heading: r.chunk.heading,
      snippet: r.chunk.text.slice(0, 140)
    }));
    const text = retrieved
      .map((r, idx) => {
        const heading = r.chunk.heading ? ` – ${r.chunk.heading}` : '';
        return `Bron ${idx + 1}: ${r.chunk.fileName}${heading}\n${r.chunk.text.slice(0, 400)}${r.chunk.text.length > 400 ? '…' : ''}`;
      })
      .join('\n\n');
    setLookup({ title: term, sources, text });
  };

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <p className="label">Initiative</p>
          <p className="muted small">{initiative.length} entries</p>
        </div>
        <div className="row-actions">
          <button className="ghost small" onClick={sortInitiative}>
            Sorteren
          </button>
          <button className="ghost small" onClick={clearInitiative}>
            Clear
          </button>
        </div>
      </div>

      <form className="mini-form" onSubmit={onSubmit}>
        <div className="grid-2">
          <input
            placeholder="Naam"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            list="party-names"
          />
          <input
            placeholder="Initiative"
            type="number"
            value={form.initiative}
            onChange={(e) => setForm({ ...form, initiative: Number(e.target.value) })}
          />
        </div>
        <div className="grid-2">
          <input
            placeholder="HP"
            type="number"
            value={form.hp ?? ''}
            onChange={(e) => setForm({ ...form, hp: e.target.value ? Number(e.target.value) : undefined })}
          />
          <input
            placeholder="AC"
            type="number"
            value={form.ac ?? ''}
            onChange={(e) => setForm({ ...form, ac: e.target.value ? Number(e.target.value) : undefined })}
          />
        </div>
        <textarea
          placeholder="Notities (conditions, buffs)"
          value={form.notes ?? ''}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          rows={2}
        />
        <div className="row-actions">
          <button className="ghost small" type="button" onClick={sortInitiative}>
            Sorteer
          </button>
          <button className="primary small" type="submit">
            Toevoegen
          </button>
        </div>
      </form>

      <datalist id="party-names">
        {players.map((p) => (
          <option key={p.id} value={p.name} />
        ))}
      </datalist>

      <div className="list">
        {initiative.length === 0 && <p className="muted small">Nog geen initiative entries.</p>}
        {initiative.map((entry) => (
          <div key={entry.id} className="list-row">
            <div>
              <strong>{entry.name}</strong>{' '}
              <span className="pill muted">Init {entry.initiative}</span>{' '}
              <span className="muted small">
                {entry.hp ? `HP ${entry.hp}` : ''} {entry.ac ? `· AC ${entry.ac}` : ''}
              </span>
              {entry.notes ? <div className="muted small">{entry.notes}</div> : null}
            </div>
            <div className="row-actions">
              <button className="ghost small" onClick={() => handleLookup(entry.name)}>
                Zoek in library
              </button>
              <button className="ghost small" onClick={() => removeInitiative(entry.id)}>
                ×
              </button>
            </div>
          </div>
        ))}
      </div>

      {players.length > 0 ? (
        <div className="muted small quickfill">
          Quickfill: klik een speler om naam/HP/AC te kopiëren:
          <div className="chips">
            {players.map((p) => (
              <button key={p.id} className="pill" type="button" onClick={() => quickFillFromPlayer(p.id)}>
                {p.name}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {lookup ? (
        <div className="lookup">
          <p className="label">Lookup: {lookup.title}</p>
          <pre className="lookup-text">{lookup.text}</pre>
          {lookup.sources.length > 0 ? (
            <p className="muted small">
              Bronnen: {lookup.sources.map((s) => `${s.fileName}${s.heading ? ` (${s.heading})` : ''}`).join(' · ')}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
