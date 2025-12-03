export type LanguageCode = 'en' | 'nl-BE';

export const STRINGS: Record<LanguageCode, Record<string, string>> = {
  en: {
    search: 'Search',
    sources: 'Sources',
    challengeRating: 'Challenge Rating',
    type: 'Type',
    size: 'Size',
    min: 'Min',
    max: 'Max',
    allSources: 'All sources',
    monsterList: 'Monster List',
    selectMonster: 'Select a monster to view details',
    statblock: 'Statblock',
    traitsActions: 'Traits & Actions',
    lore: 'Lore',
    debug: 'Debug',
    noResults: 'No monsters found'
  },
  'nl-BE': {
    search: 'Zoek',
    sources: 'Bronnen',
    challengeRating: 'Challenge Rating',
    type: 'Type',
    size: 'Grootte',
    min: 'Min',
    max: 'Max',
    allSources: 'Alle bronnen',
    monsterList: 'Monsterlijst',
    selectMonster: 'Selecteer een monster om details te zien',
    statblock: 'Statblock',
    traitsActions: 'Traits & Actions',
    lore: 'Lore',
    debug: 'Debug',
    noResults: 'Geen monsters gevonden'
  }
};
