import type { MonsterFilters, MonsterSourceId, CreatureSize } from '../types/monsters';
import { STRINGS, LanguageCode } from '../config/strings';

const SIZE_OPTIONS: CreatureSize[] = ['Tiny', 'Small', 'Medium', 'Large', 'Huge', 'Gargantuan'];
const SOURCE_OPTIONS: { id: MonsterSourceId; label: string }[] = [
  { id: 'MM2025', label: 'Monster Manual (2025)' },
  { id: 'VOLOS', label: "Volo's Guide to Monsters" }
];

interface MonsterFiltersProps {
  filters: MonsterFilters;
  availableTypes: string[];
  lang: LanguageCode;
  onChange: (filters: MonsterFilters) => void;
}

export function MonsterFilters({ filters, availableTypes, lang, onChange }: MonsterFiltersProps) {
  const t = STRINGS[lang];

  const toggleSource = (id: MonsterSourceId) => {
    const has = filters.sources.includes(id);
    onChange({ ...filters, sources: has ? filters.sources.filter((s) => s !== id) : [...filters.sources, id] });
  };

  const toggleType = (type: string) => {
    const has = filters.types.includes(type);
    onChange({ ...filters, types: has ? filters.types.filter((t) => t !== type) : [...filters.types, type] });
  };

  const toggleSize = (size: CreatureSize) => {
    const has = filters.sizes.includes(size);
    onChange({ ...filters, sizes: has ? filters.sizes.filter((s) => s !== size) : [...filters.sizes, size] });
  };

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <p className="label">{t.search}</p>
        </div>
      </div>
      <div className="mini-form">
        <input
          placeholder={`${t.search}...`}
          value={filters.text}
          onChange={(e) => onChange({ ...filters, text: e.target.value })}
        />
        <div>
          <p className="label">{t.sources}</p>
          <div className="chips">
            {SOURCE_OPTIONS.map((s) => (
              <button
                key={s.id}
                className={filters.sources.includes(s.id) ? 'pill accent' : 'pill muted'}
                type="button"
                onClick={() => toggleSource(s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid-2">
          <label className="input-label">
            {t.min} CR
            <input
              type="number"
              step="0.125"
              value={filters.minCR ?? ''}
              onChange={(e) => onChange({ ...filters, minCR: e.target.value ? Number(e.target.value) : undefined })}
            />
          </label>
          <label className="input-label">
            {t.max} CR
            <input
              type="number"
              step="0.125"
              value={filters.maxCR ?? ''}
              onChange={(e) => onChange({ ...filters, maxCR: e.target.value ? Number(e.target.value) : undefined })}
            />
          </label>
        </div>

        <div>
          <p className="label">{t.type}</p>
          <div className="chips wrap">
            {availableTypes.map((type) => (
              <button
                key={type}
                className={filters.types.includes(type) ? 'pill accent' : 'pill muted'}
                type="button"
                onClick={() => toggleType(type)}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="label">{t.size}</p>
          <div className="chips">
            {SIZE_OPTIONS.map((size) => (
              <button
                key={size}
                className={filters.sizes.includes(size) ? 'pill accent' : 'pill muted'}
                type="button"
                onClick={() => toggleSize(size)}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
