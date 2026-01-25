import { create } from 'zustand';

// 👇 AJOUTE CE BLOC QUI MANQUE :
export type FocusType = 'intro' |'rack' | 'turntable' | 'board' | null;

// (Tu as sûrement déjà HoverItemType ici, laisse-le)
export type HoverItemType = 'rack' | 'turntable' | 'poster' | 'board' | 'experience' | 'record' | null;

interface State {
  // ... tes états existants ...
  focus: FocusType; // Maintenant, il sait ce que c'est !
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