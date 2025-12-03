import { Monster } from '../types/monsters';
import { SourceBadge } from './SourceBadge';

interface MonsterListProps {
  monsters: Monster[];
  selectedId?: string;
  onSelect: (id: string) => void;
}

export function MonsterList({ monsters, selectedId, onSelect }: MonsterListProps) {
  return (
    <div className="card monster-list-card">
      <div className="monster-list">
        {monsters.map((m) => (
          <button
            key={m.id}
            className={selectedId === m.id ? 'monster-list-item selected' : 'monster-list-item'}
            onClick={() => onSelect(m.id)}
          >
            <div>
              <div className="monster-row">
                <strong>{m.name}</strong>
                <SourceBadge sourceId={m.sourceId} />
              </div>
              <div className="muted small">
                {m.type ?? '—'} {m.challengeRating ? `· CR ${m.challengeRating}` : ''} {m.size ? `· ${m.size}` : ''}
              </div>
            </div>
          </button>
        ))}
        {monsters.length === 0 && <p className="muted small">No monsters match your filters.</p>}
      </div>
    </div>
  );
}
