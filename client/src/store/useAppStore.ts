import { create } from 'zustand';

interface AppState {
  selectedCity: string;
  selectedSport: string;
  setSelectedCity: (city: string) => void;
  setSelectedSport: (sport: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  selectedCity: 'Jaipur',
  selectedSport: 'ALL',
  setSelectedCity: (city) => set({ selectedCity: city }),
  setSelectedSport: (sport) => set({ selectedSport: sport }),
}));