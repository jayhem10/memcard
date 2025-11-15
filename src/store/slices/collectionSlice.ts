'use client';

import { StateCreator } from 'zustand';

export interface CollectionSlice {
  // State
  userId: string | null;
  totalValue: number;
  
  // Actions
  setUserId: (userId: string | null) => void;
  setTotalValue: (value: number) => void;
  addToTotal: (price: number) => void;
  subtractFromTotal: (price: number) => void;
  calculateTotalFromGames: (games: Array<{ buy_price: number }>) => void;
  resetCollection: () => void;
}

export const createCollectionSlice: StateCreator<
  CollectionSlice,
  [],
  [],
  CollectionSlice
> = (set) => ({
  userId: null,
  totalValue: 0,
  
  setUserId: (userId) => set({ userId }),
  
  setTotalValue: (value) => set({ totalValue: value }),
  
  addToTotal: (price) => 
    set((state) => ({ totalValue: state.totalValue + price })),
  
  subtractFromTotal: (price) => 
    set((state) => ({ totalValue: state.totalValue - price })),
  
  calculateTotalFromGames: (games) => {
    const total = games.reduce((acc, game) => acc + (game.buy_price || 0), 0);
    set({ totalValue: total });
  },
  
  resetCollection: () => set({ userId: null, totalValue: 0 }),
});

