import { create } from 'zustand';

// On définit les 4 endroits où la caméra peut regarder
export type FocusType = 'intro' | 'turntable' | 'poster' | 'record'| 'experience';

interface State {
  focus: FocusType; // <--- On utilise "focus" maintenant
  activeProject: number | null;
  isMuted: boolean;
  
  setFocus: (focus: FocusType) => void;
  setActiveProject: (id: number | null) => void;
  toggleMute: () => void;
}

export const useStore = create<State>((set) => ({
  focus: 'intro', // Vue par défaut
  activeProject: null,
  isMuted: false,
  
  setFocus: (focus) => set({ focus }),
  setActiveProject: (id) => set({ activeProject: id }),
  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
}));