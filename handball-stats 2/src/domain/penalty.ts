import type { ActionId } from "./action";
import type { Event } from "./match";

const ISSUES_PENALTY_OBTENU = new Set<ActionId>(["but", "tir_arrete", "tir_hors_cible"]);
const ISSUES_PENALTY_CONCEDE = new Set<ActionId>(["but_encaisse_6m", "arret", "tir_hors_cadre"]);

/**
 * Identifie, parmi une liste d'événements, ceux qui sont un tir de penalty (7 m) — déduit de la
 * chronologie, jamais stocké (SPEC-donnees.md §7) : le premier tir valide qui suit un
 * `penalty_obtenu` (attaque) ou `penalty_concede` (défense) dans la séquence active. La grammaire
 * de saisie interdit déjà tout autre événement entre les deux (voir `ACTIONS_ISSUE_PENALTY*` dans
 * SaisieScreen), donc "le suivant dans l'ordre" et "le premier tir valide" coïncident toujours.
 */
export function calculerTirsDePenalty(evenements: readonly Event[]): ReadonlySet<string> {
  const tries = [...evenements].sort((a, b) => a.ordre - b.ordre);
  const resultat = new Set<string>();
  for (let i = 0; i < tries.length - 1; i++) {
    const courant = tries[i];
    const suivant = tries[i + 1];
    if (courant.action_id === "penalty_obtenu" && ISSUES_PENALTY_OBTENU.has(suivant.action_id)) {
      resultat.add(suivant.event_id);
    }
    if (courant.action_id === "penalty_concede" && ISSUES_PENALTY_CONCEDE.has(suivant.action_id)) {
      resultat.add(suivant.event_id);
    }
  }
  return resultat;
}
