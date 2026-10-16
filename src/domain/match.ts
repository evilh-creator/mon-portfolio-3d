import type { ActionId, DictionaryVersion, PositionId } from "./action";

export type Equipe = "A" | "B";
export type StatutMatch = "config" | "en_cours" | "termine";
export const TYPES_MATCH = ["Coupe de Normandie", "Coupe de France", "Championnat R1", "Championnat R3"] as const;
export type TypeMatch = (typeof TYPES_MATCH)[number];

export interface Player {
  player_id: string;
  nom: string;
  equipe: Equipe;
  /** Valeur par défaut, surchargeable par match via MatchPlayer.gardien. */
  gardien: boolean;
  /** Ordre chronologique d'ajout au groupe (pas alphabétique) : les listes affichent gardiens
   * d'abord, puis les autres dans cet ordre. */
  ordre: number;
}

/** Gardiens d'abord, puis chronologique (ordre d'ajout) — jamais alphabétique. */
export function comparerJoueurs(a: Player, b: Player): number {
  if (a.gardien !== b.gardien) return a.gardien ? -1 : 1;
  return (a.ordre ?? 0) - (b.ordre ?? 0);
}

export interface TempsMort {
  equipe: "nous" | "adverse";
  /** Horodatage réel (epoch ms) de fin du temps mort — pas un temps de jeu : indépendant du
   * chrono, jamais mis en pause. Une valeur absolue survit telle quelle à la navigation. */
  fin_at: number;
}

/**
 * Handball : 7 joueurs simultanément sur le terrain, gardien inclus (6 + 1, ou 7 joueurs de
 * champ pour jouer "à 7", cage vide).
 */
export const NB_EMPLACEMENTS_TERRAIN = 7;

export interface Match {
  match_id: string;
  date: string;
  equipe: Equipe;
  adversaire: string;
  /** Absent pour les anciens matchs ou lorsqu'aucun type n'est sélectionné. */
  type_match?: TypeMatch;
  domicile: boolean;
  dictionary_version: DictionaryVersion;
  nb_periodes: number;
  duree_periode_min: number;
  statut: StatutMatch;
  /** État de saisie en direct (période et chrono figé par période), persisté pour survivre
   * à la navigation entre écrans et au rechargement de la page. */
  periode_actuelle: number;
  chrono_par_periode: Record<number, number>;
  /** Note libre du coach sur ce match, éditable depuis l'écran Statistiques. */
  commentaire: string;
  /** Temps mort en cours, ou null. Persisté pour ne pas se réinitialiser en cas de navigation
   * (ex. consulter les statistiques pendant le temps mort). */
  temps_mort: TempsMort | null;
  /**
   * Emplacement (index 0 à `NB_EMPLACEMENTS_TERRAIN - 1`) -> numéro du joueur qui l'occupe, ou
   * null si vacant. Position stable et persistée : un changement de joueur ne redistribue
   * jamais les autres emplacements, et retirer un joueur laisse sa place vacante plutôt que de
   * la faire remonter dans la hiérarchie. Survit à la navigation entre écrans.
   */
  emplacements_terrain: (number | null)[];
}

export interface MatchPlayer {
  match_id: string;
  player_id: string;
  /** 0 à 99, unique dans le match. */
  numero: number;
  gardien: boolean;
  ordre: number;
}

export interface Event {
  event_id: string;
  match_id: string;
  /** Séquence de saisie, 1, 2, 3... */
  ordre: number;
  periode: number;
  chrono_ms: number;
  /** NULL si l'événement n'est attribuable à personne (ex: but_encaisse_cage_vide). */
  numero: number | null;
  action_id: ActionId;
  /** NULL si non saisi. */
  position: PositionId | null;
  saisi_a: string;
  /** Suppression logique. Jamais de DELETE physique. */
  annule: boolean;
}
