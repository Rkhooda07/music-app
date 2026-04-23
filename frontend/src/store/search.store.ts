import { create } from 'zustand';

interface SearchState {
  searchHistory: string[];
  addSearchQuery: (query: string) => void;
  removeSearchQuery: (query: string) => void;
  clearSearchHistory: () => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  searchHistory: [],
  addSearchQuery: (query: string) => {
    set((state) => {
      const trimmed = query.trim();
      if (!trimmed) return state;

      const filtered = state.searchHistory.filter((item) => item !== trimmed);
      return {
        searchHistory: [trimmed, ...filtered].slice(0, 15),
      };
    });
  },
  removeSearchQuery: (query: string) => {
    set((state) => ({
      searchHistory: state.searchHistory.filter((item) => item !== query),
    }));
  },
  clearSearchHistory: () => {
    set({ searchHistory: [] });
  },
}));
