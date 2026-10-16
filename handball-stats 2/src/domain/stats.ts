import type { ActionId } from "./action";
import type { Event } from "./match";

export type StatId =
  | "tirs"
  | "buts"
  | "reussite_tir"
  | "passes_decisives"
  | "penalties_obtenus"
  | "balles_perdues"
  | "bilan_creation"
  | "volume_defensif"
  | "tirs_subis_cadres"
  | "buts_encaisses_gb"
  | "pct_arrets"
  | "buts_encaisses"
  | "exclusions"
  | "neutralisations_subies"
  | "neutralisations"
  | "contres"
  | "passages_force"
  | "interceptions"
  | "sanctions"
  | "actions_attaque"
  | "impact"
  | "tirs_subis"
  | "arrets"
  | "hors_cadre_subis"
  | "pct_arrets_total";

interface StatBase {
  id: StatId;
  libelle: string;
}

export interface StatCompteur extends StatBase {
  type: "compteur";
  actions: readonly ActionId[];
}

export interface StatSomme extends StatBase {
  type: "somme";
  actions: readonly ActionId[];
}

export interface StatRatio extends StatBase {
  type: "ratio";
  numerateur: readonly ActionId[];
  denominateur: readonly ActionId[];
  format: "pourcentage";
  decimales: number;
}

/**
 * Quatrième type retenu pour trancher la décision ouverte de SPEC-donnees.md §4 :
 * `bilan_creation` est une différence, pas un ratio.
 */
export interface StatDifference extends StatBase {
  type: "difference";
  positif: readonly ActionId[];
  negatif: readonly ActionId[];
}

export type StatDefinition = StatCompteur | StatSomme | StatRatio | StatDifference;

export const STATISTIQUES_V2: readonly StatDefinition[] = [
  { id: "tirs", libelle: "Tirs", type: "somme", actions: ["but", "tir_arrete", "tir_hors_cible"] },
  { id: "buts", libelle: "Buts", type: "compteur", actions: ["but"] },
  { id: "reussite_tir", libelle: "% réussite", type: "ratio", numerateur: ["but"], denominateur: ["but", "tir_arrete", "tir_hors_cible"], format: "pourcentage", decimales: 1 },
  { id: "passes_decisives", libelle: "Passes décisives", type: "compteur", actions: ["passe_decisive"] },
  { id: "penalties_obtenus", libelle: "Penalties obtenus", type: "compteur", actions: ["penalty_obtenu"] },
  { id: "balles_perdues", libelle: "Balles perdues", type: "compteur", actions: ["balle_perdue"] },
  { id: "bilan_creation", libelle: "Bilan création", type: "difference", positif: ["passe_decisive"], negatif: ["balle_perdue"] },
  { id: "volume_defensif", libelle: "Volume défensif", type: "somme", actions: ["neutralisation", "contre", "passage_force_obtenu", "interception"] },
  { id: "tirs_subis_cadres", libelle: "Tirs subis cadrés", type: "somme", actions: ["arret", "but_encaisse_6m", "but_encaisse_9m"] },
  { id: "buts_encaisses_gb", libelle: "Buts encaissés (gardien)", type: "somme", actions: ["but_encaisse_6m", "but_encaisse_9m"] },
  { id: "pct_arrets", libelle: "% arrêts", type: "ratio", numerateur: ["arret"], denominateur: ["arret", "but_encaisse_6m", "but_encaisse_9m"], format: "pourcentage", decimales: 1 },
  { id: "buts_encaisses", libelle: "Buts encaissés (équipe)", type: "somme", actions: ["but_encaisse_6m", "but_encaisse_9m", "but_encaisse_cage_vide"] },
  { id: "exclusions", libelle: "Exclusions", type: "compteur", actions: ["exclusion_2min"] },

  // Écran statistiques — joueurs de champ
  { id: "neutralisations_subies", libelle: "Neutr. balle en main", type: "compteur", actions: ["neutralisation_subie"] },
  { id: "neutralisations", libelle: "Neutr. défensives", type: "compteur", actions: ["neutralisation"] },
  { id: "contres", libelle: "Contres", type: "compteur", actions: ["contre"] },
  { id: "passages_force", libelle: "Passages en force", type: "compteur", actions: ["passage_force_obtenu"] },
  { id: "interceptions", libelle: "Interceptions", type: "compteur", actions: ["interception"] },
  { id: "sanctions", libelle: "Sanctions", type: "somme", actions: ["exclusion_2min", "avertissement", "disqualification", "carton_bleu"] },
  { id: "actions_attaque", libelle: "Actions + attaque", type: "somme", actions: ["but", "passe_decisive", "penalty_obtenu", "exclusion_provoquee"] },
  {
    id: "impact",
    libelle: "Impact",
    type: "somme",
    actions: ["but", "passe_decisive", "penalty_obtenu", "exclusion_provoquee", "neutralisation", "contre", "passage_force_obtenu", "interception"],
  },

  // Écran statistiques — gardiens
  { id: "tirs_subis", libelle: "Tirs subis", type: "somme", actions: ["arret", "tir_hors_cadre", "but_encaisse_6m", "but_encaisse_9m"] },
  { id: "arrets", libelle: "Arrêts", type: "compteur", actions: ["arret"] },
  { id: "hors_cadre_subis", libelle: "Hors cadre", type: "compteur", actions: ["tir_hors_cadre"] },
  {
    id: "pct_arrets_total",
    libelle: "% arrêts total",
    type: "ratio",
    numerateur: ["arret"],
    denominateur: ["arret", "tir_hors_cadre", "but_encaisse_6m", "but_encaisse_9m"],
    format: "pourcentage",
    decimales: 1,
  },
];

/** Actions comptées par une statistique compteur/somme. Vide pour ratio/différence (pas d'action_id unique). */
export function actionsDeLaStat(id: StatId): readonly ActionId[] {
  const def = STATISTIQUES_V2.find((s) => s.id === id);
  if (!def) return [];
  if (def.type === "compteur" || def.type === "somme") return def.actions;
  return [];
}

/** Calcule la valeur d'une statistique pour un ensemble d'événements (un joueur, une équipe...). */
export function evaluerStat(def: StatDefinition, evenements: readonly Event[]): number {
  const compte = (ids: readonly ActionId[]) => evenements.filter((e) => ids.includes(e.action_id)).length;
  switch (def.type) {
    case "compteur":
    case "somme":
      return compte(def.actions);
    case "ratio": {
      const denominateur = compte(def.denominateur);
      return denominateur === 0 ? 0 : compte(def.numerateur) / denominateur;
    }
    case "difference":
      return compte(def.positif) - compte(def.negatif);
  }
}

export function trouverStat(id: StatId): StatDefinition {
  const def = STATISTIQUES_V2.find((s) => s.id === id);
  if (!def) throw new Error(`Statistique inconnue : ${id}`);
  return def;
}

/** Raccourci : calcule directement une statistique par son id sur un ensemble d'événements. */
export function statParId(id: StatId, evenements: readonly Event[]): number {
  return evaluerStat(trouverStat(id), evenements);
}

export function formatPourcentage(valeur: number, decimales = 1): string {
  return `${(valeur * 100).toLocaleString("fr-FR", { minimumFractionDigits: decimales, maximumFractionDigits: decimales })} %`;
}
