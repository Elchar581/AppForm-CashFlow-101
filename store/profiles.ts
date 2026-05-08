import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { PROFESSION_BY_ID, RULES } from "@/lib/configs";
import type { PlayerState, ProfileSlot, StorageState } from "@/lib/types";

const STORAGE_KEY = "cashflow:storage";

function makeId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

function createInitialPlayer(
  professionId: string,
  playerName: string,
): PlayerState {
  const profession = PROFESSION_BY_ID[professionId];
  if (!profession) throw new Error(`Unknown profession id: ${professionId}`);
  return {
    schemaVersion: 1,
    professionId,
    playerName,
    phase: "ratRace",
    childrenCount: 0,
    cash: profession.assets.savings,
    stocks: [],
    realEstate: [],
    businesses: [],
    bankLoanAmount: 0,
    history: [],
  };
}

type Actions = {
  /** Создать слот. Возвращает null, если уже достигнут лимит maxProfileSlots. */
  createProfile: (playerName: string, professionId: string) => ProfileSlot | null;
  deleteProfile: (id: string) => void;
  setActive: (id: string | null) => void;
  /** Применить мутацию игрока. Updater должен вернуть НОВЫЙ объект (immutability). */
  updatePlayer: (id: string, updater: (p: PlayerState) => PlayerState) => void;
  /** Сбросить партию в начальное состояние, сохранив имя и профессию. */
  resetPlayer: (id: string) => void;
};

type Store = StorageState & { actions: Actions };

export const useProfilesStore = create<Store>()(
  persist(
    (set, get) => ({
      schemaVersion: 1,
      profiles: [],
      activeId: null,
      actions: {
        createProfile: (playerName, professionId) => {
          if (get().profiles.length >= RULES.maxProfileSlots) return null;
          const now = Date.now();
          const slot: ProfileSlot = {
            id: makeId(),
            createdAt: now,
            updatedAt: now,
            player: createInitialPlayer(professionId, playerName),
          };
          set((s) => ({ profiles: [...s.profiles, slot] }));
          return slot;
        },
        deleteProfile: (id) => {
          set((s) => ({
            profiles: s.profiles.filter((p) => p.id !== id),
            activeId: s.activeId === id ? null : s.activeId,
          }));
        },
        setActive: (id) => set({ activeId: id }),
        updatePlayer: (id, updater) => {
          set((s) => ({
            profiles: s.profiles.map((slot) =>
              slot.id === id
                ? {
                    ...slot,
                    player: updater(slot.player),
                    updatedAt: Date.now(),
                  }
                : slot,
            ),
          }));
        },
        resetPlayer: (id) => {
          set((s) => ({
            profiles: s.profiles.map((slot) =>
              slot.id === id
                ? {
                    ...slot,
                    player: createInitialPlayer(
                      slot.player.professionId,
                      slot.player.playerName,
                    ),
                    updatedAt: Date.now(),
                  }
                : slot,
            ),
          }));
        },
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      partialize: (state) => ({
        schemaVersion: state.schemaVersion,
        profiles: state.profiles,
        activeId: state.activeId,
      }),
    },
  ),
);

export const useProfilesActions = () => useProfilesStore((s) => s.actions);

export const useActiveProfile = (): ProfileSlot | null =>
  useProfilesStore((s) =>
    s.activeId ? s.profiles.find((p) => p.id === s.activeId) ?? null : null,
  );

export const useProfileSlots = () => useProfilesStore((s) => s.profiles);
