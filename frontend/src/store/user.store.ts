import { create } from 'zustand';
import { Feeling } from '../types/music';

interface UserState {
  feeling: Feeling | null;
  setFeeling: (feeling: Feeling) => void;
  reset: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  feeling: null,
  setFeeling: (feeling) => set({ feeling }),
  reset: () => set({ feeling: null }),
}));
