import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { InitiativeEntry, Player } from '../types';

interface PartyState {
  players: Player[];
  initiative: InitiativeEntry[];
  addPlayer: (player: Omit<Player, 'id'>) => void;
  updatePlayer: (id: string, patch: Partial<Player>) => void;
  removePlayer: (id: string) => void;
  clearPlayers: () => void;
  addInitiative: (entry: Omit<InitiativeEntry, 'id'>) => void;
  updateInitiative: (id: string, patch: Partial<InitiativeEntry>) => void;
  removeInitiative: (id: string) => void;
  sortInitiative: () => void;
  clearInitiative: () => void;
}

export const usePartyStore = create<PartyState>()(
  persist(
    (set, get) => ({
      players: [],
      initiative: [],
      addPlayer: (player) =>
        set((state) => ({
          players: [...state.players, { ...player, id: crypto.randomUUID() }]
        })),
      updatePlayer: (id, patch) =>
        set((state) => ({
          players: state.players.map((p) => (p.id === id ? { ...p, ...patch } : p))
        })),
      removePlayer: (id) =>
        set((state) => ({
          players: state.players.filter((p) => p.id !== id)
        })),
      clearPlayers: () => set({ players: [] }),
      addInitiative: (entry) =>
        set((state) => ({
          initiative: [...state.initiative, { ...entry, id: crypto.randomUUID() }]
        })),
      updateInitiative: (id, patch) =>
        set((state) => ({
          initiative: state.initiative.map((i) => (i.id === id ? { ...i, ...patch } : i))
        })),
      removeInitiative: (id) =>
        set((state) => ({
          initiative: state.initiative.filter((i) => i.id !== id)
        })),
      sortInitiative: () =>
        set((state) => ({
          initiative: [...state.initiative].sort((a, b) => (b.initiative ?? 0) - (a.initiative ?? 0))
        })),
      clearInitiative: () => set({ initiative: [] })
    }),
    { name: 'dmdesk_party' }
  )
);
