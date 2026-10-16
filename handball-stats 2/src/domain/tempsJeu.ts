import { tempsAbsoluMs } from "./discipline";
import type { Event } from "./match";

/**
 * Temps de jeu d'un joueur, recalculé depuis ses événements `entree_jeu`/`sortie_jeu`
 * (SPEC-donnees.md §9) — jamais stocké. `instantMs` est le temps de jeu absolu jusqu'où
 * calculer : le moment présent pour un match en cours, la durée totale pour un match terminé.
 * Une entrée sans sortie correspondante est considérée en cours jusqu'à `instantMs`.
 */
export function calculerTempsJeuMs(evenementsJoueur: readonly Event[], dureePeriodeMs: number, instantMs: number): number {
  const mouvements = evenementsJoueur
    .filter((e) => e.action_id === "entree_jeu" || e.action_id === "sortie_jeu")
    .slice()
    .sort((a, b) => a.ordre - b.ordre);

  let total = 0;
  let debut: number | null = null;
  for (const mouvement of mouvements) {
    const t = tempsAbsoluMs(mouvement.periode, mouvement.chrono_ms, dureePeriodeMs);
    if (mouvement.action_id === "entree_jeu") {
      debut = t;
    } else if (debut !== null) {
      total += Math.max(0, t - debut);
      debut = null;
    }
  }
  if (debut !== null) total += Math.max(0, instantMs - debut);
  return total;
}

/** Dernier mouvement d'un joueur : true s'il est actuellement sur le terrain (encore aucune sortie). */
export function estSurLeTerrain(evenementsJoueur: readonly Event[]): boolean {
  const dernier = evenementsJoueur
    .filter((e) => e.action_id === "entree_jeu" || e.action_id === "sortie_jeu")
    .reduce<Event | null>((max, e) => (!max || e.ordre > max.ordre ? e : max), null);
  return dernier?.action_id === "entree_jeu";
}
