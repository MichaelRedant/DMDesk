import { Monster, MonsterSourceId, AbilityScores } from '../types/monsters';

const MANIFEST_PATH = '/monsters-manifest.json';

interface MonsterFile {
  path: string;
  sourceId: MonsterSourceId;
  sourceFile: string;
}

const FRACTION_MAP: Record<string, number> = {
  '0': 0,
  '1/8': 0.125,
  '1/4': 0.25,
  '1/2': 0.5
};

function parseCR(raw?: string): { raw?: string; value?: number } {
  if (!raw) return { raw: undefined, value: undefined };
  const cleaned = raw.trim();
  if (FRACTION_MAP[cleaned] !== undefined) return { raw: cleaned, value: FRACTION_MAP[cleaned] };
  const num = parseFloat(cleaned);
  if (!isNaN(num)) return { raw: cleaned, value: num };
  return { raw: cleaned, value: undefined };
}

function parseAbilityTable(markdown: string): AbilityScores | undefined {
  const rowMatch = markdown.match(/\|[^|]*STR[^|]*\|\s*\n\|[:\-|\s]*\|\s*\n\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|/i);
  if (!rowMatch) return undefined;
  const toScore = (val: string) => val.trim();
  return {
    str: toScore(rowMatch[1]),
    dex: toScore(rowMatch[2]),
    con: toScore(rowMatch[3]),
    int: toScore(rowMatch[4]),
    wis: toScore(rowMatch[5]),
    cha: toScore(rowMatch[6])
  };
}

function extractField(markdown: string, label: string): string | undefined {
  const re = new RegExp(`\\*\\*${label}\\*\\*\\s+([^\\n]+)`, 'i');
  const m = markdown.match(re);
  return m ? m[1].trim() : undefined;
}

function extractTypeLine(markdown: string): { size?: string; type?: string; alignment?: string } {
  const m = markdown.match(/^\*([^\*]+)\*/m);
  if (!m) return {};
  const line = m[1].trim(); // e.g. Medium humanoid (goblinoid), chaotic evil
  const parts = line.split(',');
  const first = parts[0]?.trim() ?? '';
  const alignment = parts.slice(1).join(',').trim() || undefined;
  const firstParts = first.split(' ');
  const size = firstParts.shift();
  const type = firstParts.join(' ').trim() || undefined;
  return { size, type, alignment };
}

function extractImages(markdown: string): string[] {
  return [...markdown.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)].map((m) => m[1]);
}

export async function loadMonsterManifest(): Promise<MonsterFile[]> {
  const res = await fetch(MANIFEST_PATH);
  if (!res.ok) throw new Error('Kon monsters-manifest.json niet laden');
  const files = (await res.json()) as string[];
  return files
    .filter((p) => p.toLowerCase().endsWith('.md'))
    .map((path) => {
      const isAlt = path.toLowerCase().includes('monsters (alt)');
      const sourceId: MonsterSourceId = isAlt ? 'ALT' : 'MM2025';
      return { path: `/${path}`, sourceId, sourceFile: path.split('/').pop() ?? path };
    });
}

export async function loadAndParseMonsters(): Promise<Monster[]> {
  const manifest = await loadMonsterManifest();
  const monsters: Monster[] = [];

  for (const entry of manifest) {
    const res = await fetch(entry.path);
    if (!res.ok) continue;
    const md = await res.text();
    const parsed = parseMonsterFile(md, entry.sourceFile, entry.sourceId);
    if (parsed) monsters.push(parsed);
  }

  // Merge duplicates by name (collect extraFluff, prefer ALT as extra)
  const byName = new Map<string, Monster>();
  monsters.forEach((m) => {
    const key = m.name.toLowerCase();
    if (!byName.has(key)) {
      byName.set(key, m);
    } else {
      const existing = byName.get(key)!;
      const merged: Monster = {
        ...existing,
        extraFluff: [...(existing.extraFluff ?? []), m.fluffRaw ?? '', ...(m.extraFluff ?? [])].filter(Boolean),
        imageUrls: Array.from(new Set([...(existing.imageUrls ?? []), ...(m.imageUrls ?? [])]))
      };
      byName.set(key, merged);
    }
  });

  return Array.from(byName.values());
}

function parseMonsterFile(markdown: string, sourceFile: string, sourceId: MonsterSourceId): Monster | null {
  const normalized = markdown.replace(/\r\n/g, '\n').trim();
  const heading = normalized.match(/^##\s+(.+)/m);
  if (!heading) return null;
  const name = heading[1].trim();

  const { size, type, alignment } = extractTypeLine(normalized);
  const armorClass = extractField(normalized, 'Armor Class');
  const hitPoints = extractField(normalized, 'Hit Points');
  const hitDiceMatch = hitPoints?.match(/\(([^)]+)\)/);
  const speed = extractField(normalized, 'Speed');
  const skills = extractField(normalized, 'Skills');
  const senses = extractField(normalized, 'Senses');
  const languages = extractField(normalized, 'Languages');
  const challenge = extractField(normalized, 'Challenge');
  const { raw: challengeRating, value: challengeRatingValue } = parseCR(challenge ? challenge.split(' ')[0] : undefined);
  const abilityScores = parseAbilityTable(normalized);
  const traitsRaw = extractSection(normalized, 'Actions')?.before ?? undefined;
  const actionsRaw = extractSection(normalized, 'Actions')?.section ?? undefined;
  const images = extractImages(normalized);

  return {
    id: `${name}_${sourceId}`,
    name,
    sourceId,
    sourceFile,
    size,
    type,
    alignment,
    armorClass,
    hitPoints,
    hitDice: hitDiceMatch ? hitDiceMatch[1] : undefined,
    speed,
    abilityScores,
    savingThrows: extractField(normalized, 'Saving Throws'),
    skills,
    damageResistances: extractField(normalized, 'Damage Resistances'),
    damageImmunities: extractField(normalized, 'Damage Immunities'),
    damageVulnerabilities: extractField(normalized, 'Damage Vulnerabilities'),
    conditionImmunities: extractField(normalized, 'Condition Immunities'),
    senses,
    languages,
    challengeRating,
    challengeRatingValue,
    traitsRaw,
    actionsRaw,
    reactionsRaw: undefined,
    legendaryRaw: undefined,
    lairActionsRaw: undefined,
    regionalEffectsRaw: undefined,
    fluffRaw: extractFluff(normalized),
    extraFluff: [],
    imageUrls: images,
    rawBlock: markdown
  };
}

function extractSection(markdown: string, title: string): { before: string; section: string } | null {
  const re = new RegExp(`^#{4,6}\\s*${title}\\s*$`, 'im');
  const match = markdown.match(re);
  if (!match || match.index === undefined) return null;
  const start = match.index;
  const rest = markdown.slice(start);
  const nextHeading = rest.search(/^#{4,6}\s+/im);
  const section = nextHeading > 0 ? rest.slice(0, nextHeading) : rest;
  const before = markdown.slice(0, start);
  return { before: before.trim(), section: section.trim() };
}

function extractFluff(markdown: string): string | undefined {
  // Take text before Actions heading, minus stat lines
  const actions = extractSection(markdown, 'Actions');
  if (actions) {
    return actions.before?.trim();
  }
  return undefined;
}
