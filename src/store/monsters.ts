import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { EncounterEntry, Monster } from '../types';

interface MonsterState {
  monsters: Monster[];
  encounter: EncounterEntry[];
  addMonster: (monster: Omit<Monster, 'id'>) => void;
  updateMonster: (id: string, patch: Partial<Monster>) => void;
  removeMonster: (id: string) => void;
  clearMonsters: () => void;
  addEncounterEntry: (entry: Omit<EncounterEntry, 'id'>) => void;
  removeEncounterEntry: (id: string) => void;
  clearEncounter: () => void;
  seedFromBookMonsters: (monsters: Monster[]) => void;
}

export const useMonsterStore = create<MonsterState>()(
  persist(
    (set, get) => ({
      monsters: [],
      encounter: [],
      addMonster: (monster) =>
        set((state) => ({
          monsters: [...state.monsters, { ...monster, id: crypto.randomUUID() }]
        })),
      updateMonster: (id, patch) =>
        set((state) => ({
          monsters: state.monsters.map((m) => (m.id === id ? { ...m, ...patch } : m))
        })),
      removeMonster: (id) =>
        set((state) => ({
          monsters: state.monsters.filter((m) => m.id !== id),
          encounter: state.encounter.filter((e) => e.monsterId !== id)
        })),
      clearMonsters: () => set({ monsters: [] }),
      addEncounterEntry: (entry) =>
        set((state) => ({
          encounter: [...state.encounter, { ...entry, id: crypto.randomUUID() }]
        })),
      removeEncounterEntry: (id) =>
        set((state) => ({
          encounter: state.encounter.filter((e) => e.id !== id)
        })),
      clearEncounter: () => set({ encounter: [] })
      ,
      seedFromBookMonsters: (monsters) =>
        set((state) => {
          const existingNames = new Set(state.monsters.map((m) => m.name.toLowerCase()));
          const toAdd = monsters.filter((m) => !existingNames.has(m.name.toLowerCase()));
          if (toAdd.length === 0) return {};
          return { monsters: [...state.monsters, ...toAdd.map((m) => ({ ...m, id: crypto.randomUUID() }))] };
        })
    }),
    { name: 'dmdesk_monsters' }
  )
);
