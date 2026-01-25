import { create } from 'zustand';

// Ajout du type pour les items survolables
export type HoverItemType = 'rack' | 'turntable' | 'poster' | 'board' | 'experience' | null;

interface State {
  // ... tes états existants ...
  focus: FocusType;
  activeProject: number | null;
  isMuted: boolean;

  // NOUVEAU : L'item survolé
  hoveredItem: HoverItemType;
}

interface Actions {
  // ... tes actions existantes ...
  setFocus: (focus: FocusType) => void;
  setActiveProject: (id: number | null) => void;
  toggleMute: () => void;

  // NOUVEAU : Action pour changer l'item survolé
  setHoveredItem: (item: HoverItemType) => void;
}

export const useStore = create<State & Actions>((set) => ({
  // ... tes valeurs initiales existantes ...
  focus: 'intro',
  activeProject: null,
  isMuted: true,
  
  // NOUVEAU : Initialisation
  hoveredItem: null,

  // ... tes fonctions existantes ...
  setFocus: (focus) => set({ focus }),
  setActiveProject: (activeProject) => set({ activeProject }),
  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),

  // NOUVEAU : La fonction
  setHoveredItem: (hoveredItem) => set({ hoveredItem }),
}));