import { create } from 'zustand';

interface UserState {
  feeling: string | null;
  setFeeling: (feeling: string) => void;
  reset: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  feeling: null,
  setFeeling: (feeling) => set({ feeling }),
  reset: () => set({ feeling: null }),
}));
