export type MonsterSourceId = 'MM2025' | 'VOLOS' | string;

export type CreatureSize = 'Tiny' | 'Small' | 'Medium' | 'Large' | 'Huge' | 'Gargantuan' | string;

export interface AbilityScores {
  str: string;
  dex: string;
  con: string;
  int: string;
  wis: string;
  cha: string;
}

export interface Monster {
  id: string;
  name: string;
  sourceId: MonsterSourceId;
  sourceFile: string;
  section?: string;
  size?: CreatureSize;
  type?: string;
  subtype?: string;
  alignment?: string;
  armorClass?: string;
  hitPoints?: string;
  hitDice?: string;
  speed?: string;
  abilityScores?: AbilityScores;
  savingThrows?: string;
  skills?: string;
  damageResistances?: string;
  damageImmunities?: string;
  damageVulnerabilities?: string;
  conditionImmunities?: string;
  senses?: string;
  languages?: string;
  challengeRating?: string;
  challengeRatingValue?: number;
  traitsRaw?: string;
  actionsRaw?: string;
  reactionsRaw?: string;
  legendaryRaw?: string;
  lairActionsRaw?: string;
  regionalEffectsRaw?: string;
  fluffRaw?: string;
  extraFluff?: string[];
  imageUrls: string[];
  rawBlock: string;
}

export interface MonsterFilters {
  text: string;
  sources: MonsterSourceId[];
  minCR?: number;
  maxCR?: number;
  types: string[];
  sizes: CreatureSize[];
}
