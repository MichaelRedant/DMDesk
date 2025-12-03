import { useState } from 'react';
import { Monster } from '../types/monsters';
import { STRINGS, LanguageCode } from '../config/strings';
import { SourceBadge } from './SourceBadge';
import { marked } from 'marked';

interface MonsterDetailProps {
  monster?: Monster;
  lang: LanguageCode;
}

export function MonsterDetail({ monster, lang }: MonsterDetailProps) {
  const t = STRINGS[lang];
  const [showDebug, setShowDebug] = useState(false);
  const [tab, setTab] = useState<'stat' | 'actions' | 'lore'>('stat');

  if (!monster) {
    return (
      <div className="card">
        <p className="muted small">{t.selectMonster}</p>
      </div>
    );
  }

  const renderMarkdown = (text?: string) =>
    text ? <div dangerouslySetInnerHTML={{ __html: marked.parse(text) }} /> : <p className="muted small">—</p>;
  const renderRawHtml = (text?: string) =>
    text ? <div className="monster-raw" dangerouslySetInnerHTML={{ __html: text }} /> : <p className="muted small">—</p>;

  return (
    <div className="card monster-detail">
      <header className="monster-detail-header">
        <div>
          <h2>{monster.name}</h2>
          <div className="muted small">
            {monster.size ? `${monster.size} ` : ''}
            {monster.type ?? ''} {monster.alignment ? `· ${monster.alignment}` : ''}
          </div>
          <div className="muted small">{monster.sourceFile}</div>
        </div>
        <div className="row-actions">
          <SourceBadge sourceId={monster.sourceId} />
          <button className="ghost small" onClick={() => setShowDebug((v) => !v)}>
            {t.debug}
          </button>
        </div>
      </header>

      {monster.imageUrls.length > 0 ? (
        <div className="image-strip">
          {monster.imageUrls.map((url, idx) => (
            <img key={idx} src={url} alt={monster.name} className="thumb large" />
          ))}
        </div>
      ) : null}

      <section className="stats-grid">
        <div>
          <p className="label">AC</p>
          <p>{monster.armorClass ?? '—'}</p>
        </div>
        <div>
          <p className="label">HP</p>
          <p>
            {monster.hitPoints ?? '—'} {monster.hitDice ? `(${monster.hitDice})` : ''}
          </p>
        </div>
        <div>
          <p className="label">Speed</p>
          <p>{monster.speed ?? '—'}</p>
        </div>
        <div>
          <p className="label">Senses</p>
          <p>{monster.senses ?? '—'}</p>
        </div>
        <div>
          <p className="label">Languages</p>
          <p>{monster.languages ?? '—'}</p>
        </div>
        <div>
          <p className="label">CR</p>
          <p>{monster.challengeRating ?? '—'}</p>
        </div>
      </section>

      {monster.abilityScores ? (
        <section className="ability-grid">
          {(['str', 'dex', 'con', 'int', 'wis', 'cha'] as const).map((key) => (
            <div key={key}>
              <p className="label">{key.toUpperCase()}</p>
              <p>{monster.abilityScores?.[key] ?? '—'}</p>
            </div>
          ))}
        </section>
      ) : null}

      <div className="tabs compact">
        <button className={tab === 'stat' ? 'tab active' : 'tab'} onClick={() => setTab('stat')}>
          {t.statblock}
        </button>
        <button className={tab === 'actions' ? 'tab active' : 'tab'} onClick={() => setTab('actions')}>
          {t.traitsActions}
        </button>
        <button className={tab === 'lore' ? 'tab active' : 'tab'} onClick={() => setTab('lore')}>
          {t.lore}
        </button>
      </div>

      {tab === 'stat' ? <div className="monster-section">{renderRawHtml(monster.rawBlock)}</div> : null}
      {tab === 'actions' ? (
        <div className="monster-section">
          {renderMarkdown(monster.traitsRaw)}
          {renderMarkdown(monster.actionsRaw)}
          {renderMarkdown(monster.reactionsRaw)}
          {renderMarkdown(monster.legendaryRaw)}
        </div>
      ) : null}
      {tab === 'lore' ? (
        <div className="monster-section">
          {renderMarkdown(monster.fluffRaw)}
          {monster.extraFluff?.map((f, idx) => (
            <div key={idx}>{renderMarkdown(f)}</div>
          ))}
        </div>
      ) : null}

      {showDebug ? (
        <details open className="monster-section debug">
          <summary>Raw block</summary>
          <pre>{monster.rawBlock}</pre>
        </details>
      ) : null}
    </div>
  );
}
