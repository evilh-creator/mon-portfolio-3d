import type { Event } from "./match";

const DUREE_EXCLUSION_MS = 2 * 60 * 1000;

export interface StatutDiscipline {
  /** Carte à griser (exclusion temporaire ou définitive). */
  grise: boolean;
  exclusTemporairement: boolean;
  /** Temps de jeu restant avant la fin de l'exclusion en cours, null si aucune. */
  tempsRestantMs: number | null;
  /** Disqualifié (carton rouge explicite, ou 3e exclusion de 2 minutes). */
  exclusDefinitivement: boolean;
  /** Au moins un avertissement (carton jaune) saisi durant le match. */
  avertissement: boolean;
  /** Au moins un carton bleu (rapport) saisi durant le match — marqueur permanent, comme le jaune. */
  carteBleue: boolean;
}

/** Temps de jeu absolu écoulé depuis le début du match (période × durée + chrono de la période). */
export function tempsAbsoluMs(periode: number, chronoMs: number, dureePeriodeMs: number): number {
  return (periode - 1) * dureePeriodeMs + chronoMs;
}

/**
 * Statut disciplinaire d'un joueur, entièrement recalculé depuis ses événements du match
 * (SPEC-donnees.md §7 "Infériorité numérique"). Rien n'est stocké : les exclusions de
 * 2 minutes se cumulent si elles se chevauchent, le 2e avertissement vaut exclusion de
 * 2 minutes automatique, et la 3e exclusion (explicite ou déclenchée par un 2e jaune) vaut
 * disqualification automatique — sans qu'aucun événement supplémentaire ne soit écrit.
 */
export function calculerStatutDiscipline(
  evenementsJoueur: readonly Event[],
  dureePeriodeMs: number,
  maintenantAbsoluMs: number,
): StatutDiscipline {
  const avertissements = evenementsJoueur
    .filter((e) => e.action_id === "avertissement")
    .slice()
    .sort((a, b) => a.ordre - b.ordre);
  const avertissement = avertissements.length >= 1;
  const carteBleue = evenementsJoueur.some((e) => e.action_id === "carton_bleu");
  const disqualifieExplicitement = evenementsJoueur.some((e) => e.action_id === "disqualification");

  const exclusions = evenementsJoueur.filter((e) => e.action_id === "exclusion_2min").slice();
  // Le 2e avertissement déclenche une exclusion automatique, au moment même de ce 2e jaune.
  if (avertissements.length >= 2) exclusions.push(avertissements[1]);
  exclusions.sort((a, b) => a.ordre - b.ordre);

  if (disqualifieExplicitement || exclusions.length >= 3) {
    return { grise: true, exclusTemporairement: false, tempsRestantMs: null, exclusDefinitivement: true, avertissement, carteBleue };
  }

  let fin: number | null = null;
  for (const exclusion of exclusions) {
    const moment = tempsAbsoluMs(exclusion.periode, exclusion.chrono_ms, dureePeriodeMs);
    fin = fin === null || moment >= fin ? moment + DUREE_EXCLUSION_MS : fin + DUREE_EXCLUSION_MS;
  }

  if (fin !== null && maintenantAbsoluMs < fin) {
    return {
      grise: true,
      exclusTemporairement: true,
      tempsRestantMs: fin - maintenantAbsoluMs,
      exclusDefinitivement: false,
      avertissement,
      carteBleue,
    };
  }

  return { grise: false, exclusTemporairement: false, tempsRestantMs: null, exclusDefinitivement: false, avertissement, carteBleue };
}
