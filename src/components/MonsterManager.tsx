import { FormEvent, useMemo, useState } from 'react';
import { useMonsterStore } from '../store/monsters';
import { useLibraryStore } from '../store/library';
import { retrieveTopChunks } from '../services/retriever';
import { BookMonster, EncounterEntry, Monster, SourceRef } from '../types';
import { useEffect } from 'react';

function formatCr(cr?: number) {
  if (cr === undefined || cr === null) return '';
  if (cr === 0.125) return '1/8';
  if (cr === 0.25) return '1/4';
  if (cr === 0.5) return '1/2';
  return cr.toString();
}

export function MonsterManager() {
  const { monsters, encounter, addMonster, removeMonster, addEncounterEntry, removeEncounterEntry, clearEncounter } =
    useMonsterStore();
  const { chunks, bookMonsters } = useLibraryStore();
  const [form, setForm] = useState<Omit<Monster, 'id'>>({
    name: '',
    type: '',
    cr: undefined,
    hp: undefined,
    ac: undefined,
    notes: ''
  });
  const [encForm, setEncForm] = useState<Omit<EncounterEntry, 'id'>>({
    monsterId: '',
    quantity: 1
  });
  const [lookup, setLookup] = useState<{ title: string; sources: SourceRef[]; text: string } | null>(null);
  const [suggested, setSuggested] = useState<BookMonster[]>([]);
  const [search, setSearch] = useState('');

  const encounterSummary = useMemo(() => {
    let totalHp = 0;
    let totalCr = 0;
    let count = 0;
    encounter.forEach((e) => {
      const m = monsters.find((m) => m.id === e.monsterId);
      if (!m) return;
      const qty = e.quantity || 1;
      totalHp += (m.hp ?? 0) * qty;
      totalCr += (m.cr ?? 0) * qty;
      count += qty;
    });
    return { totalHp, totalCr, count };
  }, [encounter, monsters]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    addMonster(form);
    setForm({ name: '', type: '', cr: undefined, hp: undefined, ac: undefined, notes: '' });
  };

  const onEncounterSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!encForm.monsterId) return;
    addEncounterEntry(encForm);
    setEncForm({ monsterId: '', quantity: 1 });
  };

  const handleLookup = (term: string) => {
    if (!term.trim()) return;
    if (!chunks.length) {
      setLookup({ title: term, sources: [], text: 'Geen library geïmporteerd.' });
      return;
    }
    const retrieved = retrieveTopChunks(term, chunks, { limit: 3, focusTerms: ['monster', 'creature', 'statblock'] });
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
        return `Bron ${idx + 1}: ${r.chunk.fileName}${heading}\n${r.chunk.text.slice(0, 500)}${
          r.chunk.text.length > 500 ? '…' : ''
        }`;
      })
      .join('\n\n');
    setLookup({ title: term, sources, text });
  };

  const handleSuggestFromLibrary = () => {
    if (!bookMonsters.length) {
      setLookup({ title: 'Scan', sources: [], text: 'Geen monsters gevonden in je boeken.' });
      return;
    }
    setSuggested(bookMonsters.slice(0, 500));
  };

  const filteredMonsters = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return monsters;
    return monsters.filter((m) => m.name.toLowerCase().includes(term));
  }, [monsters, search]);

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <p className="label">Monsters</p>
          <p className="muted small">{monsters.length} opgeslagen</p>
        </div>
      </div>

      <form className="mini-form" onSubmit={onSubmit}>
        <input placeholder="Naam" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <div className="grid-2">
          <input placeholder="Type" value={form.type ?? ''} onChange={(e) => setForm({ ...form, type: e.target.value })} />
          <input
            placeholder="CR (bv. 0.5 = 1/2)"
            type="number"
            step="0.125"
            value={form.cr ?? ''}
            onChange={(e) => setForm({ ...form, cr: e.target.value ? Number(e.target.value) : undefined })}
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
          placeholder="Notities / specials"
          rows={2}
          value={form.notes ?? ''}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />
        <div className="row-actions">
          <button className="ghost small" type="button" onClick={() => handleLookup(form.name || 'monster')}>
            Zoek in library
          </button>
          <button className="primary small" type="submit">
            Monster opslaan
          </button>
        </div>
      </form>

      <div className="list">
        <div className="row-actions" style={{ justifyContent: 'space-between' }}>
          <strong>Monsterlijst</strong>
          <input
            className="search-input"
            placeholder="Zoek monster..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {filteredMonsters.length === 0 && <p className="muted small">Geen monsters gevonden.</p>}
        {filteredMonsters.map((m) => (
          <div key={m.id} className="monster-card">
            <div className="monster-main">
              <div>
                <strong>{m.name}</strong>{' '}
                <span className="muted small">
                  {m.type ? `${m.type}` : ''} {m.cr !== undefined ? `· CR ${formatCr(m.cr)}` : ''}
                </span>
                <div className="muted small stats-line">
                  {m.hp ? `HP ${m.hp}` : ''} {m.ac ? `· AC ${m.ac}` : ''}
                </div>
                {m.notes ? <div className="muted small">{m.notes}</div> : null}
              </div>
              <div className="row-actions">
                <button className="ghost small" onClick={() => handleLookup(m.name)}>
                  Zoek in library
                </button>
                <button className="ghost small" onClick={() => removeMonster(m.id)}>
                  ×
                </button>
              </div>
            </div>
            {m.imageUrl ? <img src={m.imageUrl} alt={m.name} className="thumb" /> : null}
          </div>
        ))}
      </div>

      <div className="divider" />

      <div className="card-header">
        <div>
          <p className="label">Encounter</p>
          <p className="muted small">
            {encounterSummary.count} wezens · Totale CR {encounterSummary.totalCr.toFixed(2)} · Totale HP{' '}
            {encounterSummary.totalHp}
          </p>
        </div>
        <div className="row-actions">
          <button className="ghost small" onClick={clearEncounter}>
            Clear
          </button>
        </div>
      </div>

      <form className="mini-form" onSubmit={onEncounterSubmit}>
        <div className="grid-2">
          <select
            value={encForm.monsterId}
            onChange={(e) => setEncForm({ ...encForm, monsterId: e.target.value })}
          >
            <option value="">Kies monster</option>
            {monsters.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} {m.cr ? `(CR ${formatCr(m.cr)})` : ''}
              </option>
            ))}
          </select>
          <input
            type="number"
            min={1}
            placeholder="Aantal"
            value={encForm.quantity}
            onChange={(e) => setEncForm({ ...encForm, quantity: Number(e.target.value) || 1 })}
          />
        </div>
        <button className="primary small" type="submit">
          Toevoegen aan encounter
        </button>
      </form>

      <div className="list">
        {encounter.length === 0 && <p className="muted small">Nog geen encounter-lijst.</p>}
        {encounter.map((e) => {
          const m = monsters.find((m) => m.id === e.monsterId);
          return (
            <div key={e.id} className="list-row">
              <div>
                <strong>{m?.name ?? 'Onbekend monster'}</strong> <span className="muted small">x{e.quantity}</span>{' '}
                {m?.cr !== undefined ? <span className="pill muted">CR {formatCr(m.cr)}</span> : null}
                {m?.hp ? <span className="muted small"> · HP {m.hp}</span> : null}
                {m?.ac ? <span className="muted small"> · AC {m.ac}</span> : null}
              </div>
              <div className="row-actions">
                <button className="ghost small" onClick={() => handleLookup(m?.name ?? '')}>
                  Zoek in library
                </button>
                <button className="ghost small" onClick={() => removeEncounterEntry(e.id)}>
                  ×
                </button>
              </div>
            </div>
          );
        })}
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

      <div className="card-header">
        <div>
          <p className="label">Monsters uit boeken</p>
          <p className="muted small">Scan headings uit monster-bestanden</p>
        </div>
        <button className="ghost small" onClick={handleSuggestFromLibrary}>
          Scan
        </button>
      </div>
      {suggested.length > 0 ? (
        <div className="chips wrap">
          {suggested.map((bm) => (
            <button
              key={bm.id}
              className="pill"
              type="button"
              onClick={() =>
                addMonster({
                  name: bm.name,
                  hp: bm.hp,
                  ac: bm.ac,
                  notes: bm.sourceText.slice(0, 200),
                  imageUrl: bm.imageUrl
                })
              }
              title={`HP ${bm.hp ?? '?'} · AC ${bm.ac ?? '?'}`}
            >
              {bm.name}
            </button>
          ))}
        </div>
      ) : (
        <p className="muted small">Klik “Scan” om monsters uit je boeken te laden.</p>
      )}
    </div>
  );
}
