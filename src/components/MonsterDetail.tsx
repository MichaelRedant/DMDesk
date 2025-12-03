import { useState } from 'react';
import { Monster } from '../types/monsters';
import { STRINGS, LanguageCode } from '../config/strings';
import { SourceBadge } from './SourceBadge';
import { marked } from 'marked';
import { MonsterGroup } from './MonsterList';

interface MonsterDetailProps {
  monster?: Monster;
  group?: MonsterGroup;
  onSelectVariant: (id: string) => void;
  lang: LanguageCode;
}

export function MonsterDetail({ monster, group, onSelectVariant, lang }: MonsterDetailProps) {
  const t = STRINGS[lang];
  const [showDebug, setShowDebug] = useState(false);

  if (!monster) {
    return (
      <div className="card">
        <p className="muted small">{t.selectMonster}</p>
      </div>
    );
  }

  const renderMarkdown = (text?: string) =>
    text ? <div className="markdown" dangerouslySetInnerHTML={{ __html: marked.parse(text) }} /> : <p className="muted small">—</p>;

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

      {group && group.variants.length > 1 ? (
        <div className="variant-chips">
          {group.variants.map((v) => (
            <button
              key={v.id}
              className={v.id === monster.id ? 'pill accent' : 'pill muted'}
              onClick={() => onSelectVariant(v.id)}
            >
              {v.name}
            </button>
          ))}
        </div>
      ) : null}

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

      <div className="monster-section">
        <h4>{t.statblock}</h4>
        {renderMarkdown(monster.rawBlock)}
      </div>

      {(monster.traitsRaw || monster.actionsRaw || monster.reactionsRaw || monster.legendaryRaw) && (
        <div className="monster-section">
          <h4>{t.traitsActions}</h4>
          {renderMarkdown(monster.traitsRaw)}
          {renderMarkdown(monster.actionsRaw)}
          {renderMarkdown(monster.reactionsRaw)}
          {renderMarkdown(monster.legendaryRaw)}
        </div>
      )}

      {(monster.fluffRaw || (monster.extraFluff && monster.extraFluff.length > 0)) && (
        <div className="monster-section">
          <h4>{t.lore}</h4>
          {renderMarkdown(monster.fluffRaw)}
          {monster.extraFluff?.map((f, idx) => (
            <div key={idx}>{renderMarkdown(f)}</div>
          ))}
        </div>
      )}

      {showDebug ? (
        <details open className="monster-section debug">
          <summary>Raw block</summary>
          <pre>{monster.rawBlock}</pre>
        </details>
      ) : null}
    </div>
  );
}
