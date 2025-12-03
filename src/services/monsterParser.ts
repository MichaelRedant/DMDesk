import { Monster, MonsterSourceId, AbilityScores } from '../types/monsters';

const BOOKS = [
  { path: "/books/Monster Manual (2025).md", sourceId: 'MM2025' as MonsterSourceId },
  { path: "/books/Volo's Guide to Monsters.md", sourceId: 'VOLOS' as MonsterSourceId }
];

const CR_MAP: Record<string, number> = {
  '0': 0,
  '1/8': 0.125,
  '1/4': 0.25,
  '1/2': 0.5
};

const HEADING_REGEX = /^##+\s+(.+)$/gm;

function stripTags(text: string): string {
  return text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseCR(raw?: string): { raw?: string; value?: number } {
  if (!raw) return { raw: undefined, value: undefined };
  const cleaned = raw.trim();
  if (CR_MAP[cleaned] !== undefined) return { raw: cleaned, value: CR_MAP[cleaned] };
  const num = parseFloat(cleaned);
  if (!isNaN(num)) return { raw: cleaned, value: num };
  return { raw: cleaned, value: undefined };
}

function parseAbilityScores(block: string): AbilityScores | undefined {
  const scores: Partial<AbilityScores> = {};
  const abilities = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'] as const;
  abilities.forEach((abbr) => {
    const re = new RegExp(`${abbr}\\s+(\\d+[^\\s]*)`, 'i');
    const m = block.match(re);
    if (m) {
      scores[abbr.toLowerCase() as keyof AbilityScores] = m[1].trim();
    }
  });
  if (Object.keys(scores).length === 0) return undefined;
  return scores as AbilityScores;
}

function extractBetween(text: string, startLabel: string, endLabel: string): string | undefined {
  const re = new RegExp(`${startLabel}[\\s\\S]*?(?=${endLabel}|$)`, 'i');
  const m = text.match(re);
  return m ? m[0].trim() : undefined;
}

export async function loadMonsterBooks(): Promise<{ markdown: string; path: string; sourceId: MonsterSourceId }[]> {
  const results: { markdown: string; path: string; sourceId: MonsterSourceId }[] = [];
  for (const book of BOOKS) {
    const res = await fetch(book.path);
    if (!res.ok) throw new Error(`Failed to load ${book.path}`);
    const markdown = await res.text();
    results.push({ markdown, path: book.path, sourceId: book.sourceId });
  }
  return results;
}

export function parseMonstersFromMarkdown(
  markdown: string,
  sourceFile: string,
  sourceId: MonsterSourceId
): Monster[] {
  const normalized = markdown.replace(/\r\n/g, '\n');
  const matches = [...normalized.matchAll(HEADING_REGEX)];
  const monsters: Monster[] = [];

  for (let i = 0; i < matches.length; i++) {
    const heading = matches[i];
    const name = heading[1].trim();
    const start = heading.index ?? 0;
    const end = matches[i + 1]?.index ?? normalized.length;
    const block = normalized.slice(start, end).trim();
    const plain = stripTags(block);

    const imageUrls = [...block.matchAll(/!\[[^\]]*]\(([^)]+)\)/g)].map((m) => m[1]);

    const armorClass = (plain.match(/Armor Class\s+([^\n]+)/i) || [])[1];
    const hitPoints = (plain.match(/Hit Points\s+([^\n]+)/i) || [])[1];
    const hitDiceMatch = hitPoints?.match(/\(([^\)]+)\)/);
    const speed = (plain.match(/Speed\s+([^\n]+)/i) || [])[1];
    const typeLine = (plain.match(/^(Tiny|Small|Medium|Large|Huge|Gargantuan)[^\n]+/im) || [])[0];
    const type = typeLine?.split(',')[0]?.split(' ').slice(1).join(' ');
    const size = typeLine?.split(' ')[0];
    const alignment = typeLine?.includes(',') ? typeLine.split(',').slice(1).join(',').trim() : undefined;
    const savingThrows = (plain.match(/Saving Throws\s+([^\n]+)/i) || [])[1];
    const skills = (plain.match(/Skills\s+([^\n]+)/i) || [])[1];
    const damageResistances = (plain.match(/Damage Resistances\s+([^\n]+)/i) || [])[1];
    const damageImmunities = (plain.match(/Damage Immunities\s+([^\n]+)/i) || [])[1];
    const damageVulnerabilities = (plain.match(/Damage Vulnerabilities\s+([^\n]+)/i) || [])[1];
    const conditionImmunities = (plain.match(/Condition Immunities\s+([^\n]+)/i) || [])[1];
    const senses = (plain.match(/Senses\s+([^\n]+)/i) || [])[1];
    const languages = (plain.match(/Languages\s+([^\n]+)/i) || [])[1];
    const crRaw = (plain.match(/Challenge\s+([^\n]+)/i) || [])[1];
    const { raw: challengeRating, value: challengeRatingValue } = parseCR(crRaw ? crRaw.split(' ')[0] : undefined);
    const abilityScores = parseAbilityScores(plain);

    const actionsRaw = extractBetween(block, '### Actions', '###');
    const traitsRaw = extractBetween(block, '### Traits', '### Actions') || extractBetween(block, 'Traits', '### Actions');
    const reactionsRaw = extractBetween(block, '### Reactions', '###');
    const legendaryRaw = extractBetween(block, '### Legendary Actions', '###');
    const fluffRaw = extractBetween(block, '### Habitat', '### Stat Blocks') || undefined;

    monsters.push({
      id: `${name}_${sourceId}_${i}`,
      name,
      sourceId,
      sourceFile,
      size,
      type,
      alignment,
      armorClass: armorClass?.trim(),
      hitPoints: hitPoints?.trim(),
      hitDice: hitDiceMatch ? hitDiceMatch[1] : undefined,
      speed: speed?.trim(),
      abilityScores,
      savingThrows: savingThrows?.trim(),
      skills: skills?.trim(),
      damageResistances: damageResistances?.trim(),
      damageImmunities: damageImmunities?.trim(),
      damageVulnerabilities: damageVulnerabilities?.trim(),
      conditionImmunities: conditionImmunities?.trim(),
      senses: senses?.trim(),
      languages: languages?.trim(),
      challengeRating,
      challengeRatingValue,
      traitsRaw: traitsRaw?.trim(),
      actionsRaw: actionsRaw?.trim(),
      reactionsRaw: reactionsRaw?.trim(),
      legendaryRaw: legendaryRaw?.trim(),
      fluffRaw: fluffRaw?.trim(),
      extraFluff: [],
      imageUrls,
      rawBlock: block
    });
  }

  return monsters;
}
