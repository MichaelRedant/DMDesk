import { FormEvent, useState } from 'react';
import { Player, SourceRef } from '../types';
import { usePartyStore } from '../store/party';
import { useLibraryStore } from '../store/library';
import { retrieveTopChunks } from '../services/retriever';

export function PartyManager() {
  const { players, addPlayer, updatePlayer, removePlayer } = usePartyStore();
  const { chunks, classRaceNames } = useLibraryStore();
  const [lookup, setLookup] = useState<{ title: string; sources: SourceRef[]; text: string } | null>(null);
  const [form, setForm] = useState<Omit<Player, 'id'>>({
    name: '',
    className: '',
    level: undefined,
    ac: undefined,
    hp: undefined,
    notes: ''
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    addPlayer(form);
    setForm({ name: '', className: '', level: undefined, ac: undefined, hp: undefined, notes: '' });
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
          <p className="label">Party</p>
          <p className="muted small">{players.length} speler(s)</p>
        </div>
      </div>

      <form className="mini-form" onSubmit={onSubmit}>
        <input
          placeholder="Naam"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <input
          placeholder="Klasse"
          value={form.className ?? ''}
          onChange={(e) => setForm({ ...form, className: e.target.value })}
        />
        <div className="grid-3">
          <input
            placeholder="Lv"
            type="number"
            value={form.level ?? ''}
            onChange={(e) => setForm({ ...form, level: e.target.value ? Number(e.target.value) : undefined })}
          />
          <input
            placeholder="AC"
            type="number"
            value={form.ac ?? ''}
            onChange={(e) => setForm({ ...form, ac: e.target.value ? Number(e.target.value) : undefined })}
          />
          <input
            placeholder="HP"
            type="number"
            value={form.hp ?? ''}
            onChange={(e) => setForm({ ...form, hp: e.target.value ? Number(e.target.value) : undefined })}
          />
        </div>
        <textarea
          placeholder="Notities"
          value={form.notes ?? ''}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          rows={2}
        />
        <button className="primary small" type="submit">
          Speler toevoegen
        </button>
      </form>

      {classRaceNames.length > 0 ? (
        <div className="chips wrap">
          {classRaceNames.slice(0, 120).map((name) => (
            <button
              key={name}
              className="pill"
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, className: name }))}
              title="Stel in als klasse/ras"
            >
              {name}
            </button>
          ))}
        </div>
      ) : null}

      <div className="list">
        {players.length === 0 && <p className="muted small">Nog geen spelers.</p>}
        {players.map((p) => (
          <div key={p.id} className="list-row">
            <div>
              <strong>{p.name}</strong>{' '}
              <span className="muted small">
                {p.className ? `${p.className}` : ''} {p.level ? `· Lv ${p.level}` : ''}
              </span>
              <div className="muted small">
                {p.ac ? `AC ${p.ac}` : ''} {p.hp ? `HP ${p.hp}` : ''}
                {p.notes ? ` · ${p.notes}` : ''}
              </div>
            </div>
            <div className="row-actions">
              <button className="ghost small" onClick={() => handleLookup(p.name)}>
                Zoek in library
              </button>
              <button className="ghost small" onClick={() => removePlayer(p.id)}>
                ×
              </button>
            </div>
          </div>
        ))}
      </div>

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
