'use client';

import { useMemo } from 'react';
import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import { createProfileSlice, ProfileSlice } from './slices/profileSlice';
import { createCollectionSlice, CollectionSlice } from './slices/collectionSlice';
import { createStatsSlice, StatsSlice } from './slices/statsSlice';

/**
 * Store unifié avec architecture en slices
 * 
 * Avantages :
 * - Un seul store = moins de re-renders
 * - Meilleure organisation du code
 * - Partage de la logique commune
 * - Type-safety amélioré
 */
export type AppStore = ProfileSlice & CollectionSlice & StatsSlice;

export const useStore = create<AppStore>()(
  devtools(
    persist(
      (...a) => ({
        ...createProfileSlice(...a),
        ...createCollectionSlice(...a),
        ...createStatsSlice(...a),
      }),
      {
        name: 'app-storage',
        storage: createJSONStorage(() => sessionStorage),
        partialize: (state) => ({
          userId: state.userId,
          totalValue: state.totalValue,
        }),
      }
    ),
    { name: 'AppStore' }
  )
);

export const useProfile = () => {
  const profile = useStore((state) => state.profile);
  const isLoading = useStore((state) => state.profileLoading);
  const error = useStore((state) => state.profileError);
  const fetchProfile = useStore((state) => state.fetchProfile);
  const updateProfile = useStore((state) => state.updateProfile);
  const resetProfile = useStore((state) => state.resetProfile);
  
  return useMemo(() => ({
    profile,
    isLoading,
    error,
    fetchProfile,
    updateProfile,
    resetProfile,
  }), [profile, isLoading, error, fetchProfile, updateProfile, resetProfile]);
};

export const useCollection = () => {
  const userId = useStore((state) => state.userId);
  const totalValue = useStore((state) => state.totalValue);
  const setUserId = useStore((state) => state.setUserId);
  const setTotalValue = useStore((state) => state.setTotalValue);
  const addToTotal = useStore((state) => state.addToTotal);
  const subtractFromTotal = useStore((state) => state.subtractFromTotal);
  const calculateTotalFromGames = useStore((state) => state.calculateTotalFromGames);
  const resetCollection = useStore((state) => state.resetCollection);
  
  return useMemo(() => ({
    userId,
    totalValue,
    setUserId,
    setTotalValue,
    addToTotal,
    subtractFromTotal,
    calculateTotalFromGames,
    resetCollection,
  }), [userId, totalValue, setUserId, setTotalValue, addToTotal, subtractFromTotal, calculateTotalFromGames, resetCollection]);
};

export const useStats = () => {
  const total = useStore((state) => state.total);
  const completed = useStore((state) => state.completed);
  const inProgress = useStore((state) => state.inProgress);
  const notStarted = useStore((state) => state.notStarted);
  const wishlist = useStore((state) => state.wishlist);
  const platforms = useStore((state) => state.platforms);
  const recentGames = useStore((state) => state.recentGames);
  const isLoading = useStore((state) => state.statsLoading);
  const error = useStore((state) => state.statsError);
  const fetchUserStats = useStore((state) => state.fetchUserStats);
  const resetStats = useStore((state) => state.resetStats);
  
  return useMemo(() => ({
    total,
    completed,
    inProgress,
    notStarted,
    wishlist,
    platforms,
    recentGames,
    isLoading,
    error,
    fetchUserStats,
    resetStats,
  }), [total, completed, inProgress, notStarted, wishlist, platforms, recentGames, isLoading, error, fetchUserStats, resetStats]);
};

// Export pour compatibilité ascendante (déprécié)
/**
 * @deprecated Utilisez useProfile() à la place
 */
export const useProfileStore = useStore;

/**
 * @deprecated Utilisez useCollection() à la place
 */
export const useCollectionStore = useStore;

/**
 * @deprecated Utilisez useStats() à la place
 */
export const useUserStatsStore = useStore;

