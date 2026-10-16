import type { Event } from "./match";

/**
 * Pondération des actions pour la note de fin de match — reprise telle quelle de la feuille de
 * référence "Pondération des actions – Handball" fournie par le club. C'est une donnée du métier,
 * pas un choix arbitraire : ne pas la modifier sans confirmer avec la feuille source.
 *
 * `carton_rouge_provoqué` (attaque, +1,00 sur la feuille de référence) n'a pas d'équivalent dans
 * le dictionnaire d'actions : rien ne trace aujourd'hui "un adverse a pris un rouge à cause de
 * nous". Il n'entre donc pour l'instant dans aucun calcul — ajouter le bouton correspondant est
 * un chantier à part.
 */
const POIDS_BUT = 2;
const POIDS_PASSE_DECISIVE = 1.5;
const POIDS_PENALTY_OBTENU = 1;
const POIDS_EXCLUSION_PROVOQUEE = 1;
const POIDS_NEUTRALISATION_SUBIE = -0.5;
const POIDS_TIR_SANS_BUT = -1;
const POIDS_PENALTY_RATE = -1.5;
const POIDS_BALLE_PERDUE = -1.5;

const POIDS_NEUTRALISATION = 0.5;
const POIDS_CONTRE = 0.5;
const POIDS_PASSAGE_FORCE = 1;
const POIDS_INTERCEPTION = 1;
const POIDS_ERREUR_DEFENSIVE = -1.5;
const POIDS_PENALTY_CONCEDE = -1;
const POIDS_SANCTION_RECUE = -1;

const POIDS_ARRET = 2;
const POIDS_TIR_HORS_CADRE_SUBI = 0;
const POIDS_BUT_ENCAISSE_6M = -0.5;
const POIDS_BUT_ENCAISSE_9M = -1;

/**
 * Détail du score d'impact d'un joueur de champ, ventilé en 4 tableaux (attaque/défense ×
 * positif/négatif) — SPEC-donnees.md §10. `scoreXxx` est la somme pondérée du bloc ; l'impact
 * brut total d'un joueur de champ est la somme des 4 (T1+T2+T3+T4).
 */
export interface DetailImpactChamp {
  // Actions positives — attaque
  buts: number;
  passesDecisives: number;
  penaltysObtenus: number;
  exclusionsProvoquees: number;
  scorePositifAttaque: number;
  // Actions positives — défense
  neutralisations: number;
  contres: number;
  passagesForce: number;
  interceptions: number;
  scorePositifDefense: number;
  // Actions négatives — attaque
  penaltysRates: number;
  neutralisationsSubies: number;
  tirsSansBut: number;
  ballesPerdues: number;
  scoreNegatifAttaque: number;
  // Actions négatives — défense
  erreursDefensives: number;
  penaltysConcedes: number;
  sanctionsRecues: number;
  scoreNegatifDefense: number;
}

const SANCTIONS_DISCIPLINAIRES = new Set(["exclusion_2min", "avertissement", "disqualification", "carton_bleu"]);

/**
 * Ventile les événements d'un joueur de champ en 4 blocs pondérés. `tirsDePenalty` (déduit de la
 * chronologie, voir `domain/penalty.ts`) distingue un tir sans but "normal" (-1) d'un penalty raté
 * (-1,50) : même `action_id` (`tir_arrete`/`tir_hors_cible`), poids différent selon le contexte.
 */
export function calculerDetailImpactChamp(evenementsJoueur: readonly Event[], tirsDePenalty: ReadonlySet<string>): DetailImpactChamp {
  let buts = 0;
  let passesDecisives = 0;
  let penaltysObtenus = 0;
  let exclusionsProvoquees = 0;
  let neutralisations = 0;
  let contres = 0;
  let passagesForce = 0;
  let interceptions = 0;
  let penaltysRates = 0;
  let neutralisationsSubies = 0;
  let tirsSansBut = 0;
  let ballesPerdues = 0;
  let erreursDefensives = 0;
  let penaltysConcedes = 0;
  let sanctionsRecues = 0;

  for (const e of evenementsJoueur) {
    switch (e.action_id) {
      case "but":
        buts += 1;
        break;
      case "passe_decisive":
        passesDecisives += 1;
        break;
      case "penalty_obtenu":
        penaltysObtenus += 1;
        break;
      case "exclusion_provoquee":
        exclusionsProvoquees += 1;
        break;
      case "neutralisation":
        neutralisations += 1;
        break;
      case "contre":
        contres += 1;
        break;
      case "passage_force_obtenu":
        passagesForce += 1;
        break;
      case "interception":
        interceptions += 1;
        break;
      case "neutralisation_subie":
        neutralisationsSubies += 1;
        break;
      case "balle_perdue":
        ballesPerdues += 1;
        break;
      case "tir_arrete":
      case "tir_hors_cible":
        if (tirsDePenalty.has(e.event_id)) penaltysRates += 1;
        else tirsSansBut += 1;
        break;
      case "erreur_defensive":
        erreursDefensives += 1;
        break;
      case "penalty_concede":
        penaltysConcedes += 1;
        break;
      default:
        if (SANCTIONS_DISCIPLINAIRES.has(e.action_id)) sanctionsRecues += 1;
    }
  }

  const scorePositifAttaque = buts * POIDS_BUT + passesDecisives * POIDS_PASSE_DECISIVE + penaltysObtenus * POIDS_PENALTY_OBTENU + exclusionsProvoquees * POIDS_EXCLUSION_PROVOQUEE;
  const scorePositifDefense = neutralisations * POIDS_NEUTRALISATION + contres * POIDS_CONTRE + passagesForce * POIDS_PASSAGE_FORCE + interceptions * POIDS_INTERCEPTION;
  const scoreNegatifAttaque = penaltysRates * POIDS_PENALTY_RATE + neutralisationsSubies * POIDS_NEUTRALISATION_SUBIE + tirsSansBut * POIDS_TIR_SANS_BUT + ballesPerdues * POIDS_BALLE_PERDUE;
  const scoreNegatifDefense = erreursDefensives * POIDS_ERREUR_DEFENSIVE + penaltysConcedes * POIDS_PENALTY_CONCEDE + sanctionsRecues * POIDS_SANCTION_RECUE;

  return {
    buts,
    passesDecisives,
    penaltysObtenus,
    exclusionsProvoquees,
    scorePositifAttaque,
    neutralisations,
    contres,
    passagesForce,
    interceptions,
    scorePositifDefense,
    penaltysRates,
    neutralisationsSubies,
    tirsSansBut,
    ballesPerdues,
    scoreNegatifAttaque,
    erreursDefensives,
    penaltysConcedes,
    sanctionsRecues,
    scoreNegatifDefense,
  };
}

/** T1+T2+T3+T4 : impact brut total d'un joueur de champ, avant ajustement au temps de jeu. */
export function impactBrutChamp(detail: DetailImpactChamp): number {
  return detail.scorePositifAttaque + detail.scorePositifDefense + detail.scoreNegatifAttaque + detail.scoreNegatifDefense;
}

/** Impact brut d'un gardien : arrêts et buts encaissés, seules actions qui le concernent. */
export function calculerImpactBrutGardien(evenementsJoueur: readonly Event[]): number {
  let total = 0;
  for (const e of evenementsJoueur) {
    switch (e.action_id) {
      case "arret":
        total += POIDS_ARRET;
        break;
      case "tir_hors_cadre":
        total += POIDS_TIR_HORS_CADRE_SUBI;
        break;
      case "but_encaisse_6m":
        total += POIDS_BUT_ENCAISSE_6M;
        break;
      case "but_encaisse_9m":
        total += POIDS_BUT_ENCAISSE_9M;
        break;
    }
  }
  return total;
}

export interface Notation {
  impactPar30Min: number;
  impactAjuste: number;
  noteSur10: number;
}

const NOTE_NEUTRE = 5;
const CONSTANTE_CONVERSION = 3;
const REFERENCE_TEMPS_MIN = 30;
const CORRECTIF_TEMPS_MIN = 10;

/**
 * Note /10 ajustée au temps de jeu (feuille de référence "PARAMÈTRES NOTE /10") : l'impact brut
 * est ramené à un rythme "par 30 minutes", puis pondéré par `minutes / (minutes + correctif)` —
 * un joueur qui n'a joué que quelques minutes voit son rythme lissé vers 0 plutôt que de se faire
 * une note extrême sur un tout petit échantillon. `impactBrut` à 0 minute jouée -> note neutre (5).
 */
export function calculerNotation(impactBrut: number, tempsJeuMs: number): Notation {
  const minutes = tempsJeuMs / 60_000;
  if (minutes <= 0) return { impactPar30Min: 0, impactAjuste: 0, noteSur10: NOTE_NEUTRE };
  const impactPar30Min = (impactBrut / minutes) * REFERENCE_TEMPS_MIN;
  const impactAjuste = impactPar30Min * (minutes / (minutes + CORRECTIF_TEMPS_MIN));
  const noteBrute = NOTE_NEUTRE + impactAjuste / CONSTANTE_CONVERSION;
  return { impactPar30Min, impactAjuste, noteSur10: Math.max(0, Math.min(10, noteBrute)) };
}

/** "+2,00" / "-1,50" / "0,00" — format de la feuille de référence. */
export function formatScore(valeur: number): string {
  const arrondi = Math.round(valeur * 100) / 100;
  const texte = Math.abs(arrondi).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (arrondi > 0) return `+${texte}`;
  if (arrondi < 0) return `-${texte}`;
  return texte;
}

export function formatNote(note: number): string {
  return note.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
