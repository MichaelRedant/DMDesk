import { MonsterSourceId } from '../types/monsters';

const COLORS: Record<string, string> = {
  MM2025: '#1f7a8c',
  VOLOS: '#ef9273'
};

export function SourceBadge({ sourceId }: { sourceId: MonsterSourceId }) {
  const color = COLORS[sourceId] ?? '#888';
  return (
    <span className="pill" style={{ background: `${color}22`, color }}>
      {sourceId}
    </span>
  );
}
