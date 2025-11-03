import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface CollectionStore {
  userId: string | null
  totalValue: number
  setUserId: (userId: string | null) => void
  setTotalValue: (value: number) => void
  addToTotal: (price: number) => void
  subtractFromTotal: (price: number) => void
  calculateTotalFromGames: (games: Array<{ buy_price: number }>) => void
  reset: () => void
}

export const useCollectionStore = create<CollectionStore>()(
  persist(
    (set) => ({
      userId: null,
      totalValue: 0,
      setUserId: (userId) => set({ userId }),
      setTotalValue: (value) => set({ totalValue: value }),
      addToTotal: (price) => 
        set((state) => ({ totalValue: state.totalValue + price })),
      subtractFromTotal: (price) => 
        set((state) => ({ totalValue: state.totalValue - price })),
      calculateTotalFromGames: (games) => {
        const total = games.reduce((acc, game) => acc + (game.buy_price || 0), 0)
        set({ totalValue: total })
      },
      reset: () => set({ userId: null, totalValue: 0 }),
    }),
    {
      name: 'collection-storage',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
)
