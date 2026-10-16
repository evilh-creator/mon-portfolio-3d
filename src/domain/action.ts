export type DictionaryVersion = "v2";

export type ActionId =
  // Attaque
  | "tir_arrete"
  | "but"
  | "passe_decisive"
  | "penalty_obtenu"
  | "balle_perdue"
  | "neutralisation_subie"
  | "tir_hors_cible"
  | "exclusion_provoquee"
  // Défense
  | "neutralisation"
  | "contre"
  | "passage_force_obtenu"
  | "interception"
  | "erreur_defensive"
  | "penalty_concede"
  | "exclusion_2min"
  | "avertissement"
  | "disqualification"
  | "carton_bleu"
  // Gardien
  | "arret"
  | "tir_hors_cadre"
  | "but_encaisse_6m"
  | "but_encaisse_9m"
  | "but_encaisse_cage_vide"
  // Changement (temps de jeu)
  | "entree_jeu"
  | "sortie_jeu"
  // Temps mort
  | "temps_mort_nous"
  | "temps_mort_adverse";

export type Categorie = "attaque" | "defense" | "gardien" | "changement";
export type Portee = "nous" | "adverse";
export type Signe = "positif" | "negatif" | "neutre";

export interface ActionDefinition {
  dictionary_version: DictionaryVersion;
  action_id: ActionId;
  lettre: string;
  libelle: string;
  /** Libellé court pour les boutons de saisie (quelques caractères, sous la lettre). */
  abrege: string;
  /** Couleur d'identification du bouton de saisie (hex), une par action. */
  couleur: string;
  /** Sous-groupe d'affichage au sein de la catégorie (ex. "Tirs" en attaque), purement visuel. */
  groupe: string;
  categorie: Categorie;
  portee: Portee;
  signe: Signe;
  ordre: number;
  actif: boolean;
}

export const DICTIONNAIRE_V2: readonly ActionDefinition[] = [
  // Attaque
  { dictionary_version: "v2", action_id: "tir_arrete", lettre: "A", libelle: "Tir arrêté par le gardien", abrege: "Arrêté", couleur: "#F59E0B", groupe: "Tirs", categorie: "attaque", portee: "nous", signe: "negatif", ordre: 1, actif: true },
  { dictionary_version: "v2", action_id: "but", lettre: "Z", libelle: "Tir + but", abrege: "But", couleur: "#16A34A", groupe: "Tirs", categorie: "attaque", portee: "nous", signe: "positif", ordre: 2, actif: true },
  { dictionary_version: "v2", action_id: "passe_decisive", lettre: "E", libelle: "Passe décisive", abrege: "Passe déc.", couleur: "#0EA5E9", groupe: "Créations", categorie: "attaque", portee: "nous", signe: "positif", ordre: 3, actif: true },
  { dictionary_version: "v2", action_id: "penalty_obtenu", lettre: "R", libelle: "Penalty obtenu (7 m)", abrege: "Pénalty", couleur: "#A855F7", groupe: "Créations", categorie: "attaque", portee: "nous", signe: "positif", ordre: 4, actif: true },
  { dictionary_version: "v2", action_id: "balle_perdue", lettre: "T", libelle: "Balle perdue", abrege: "Perdue", couleur: "#EF4444", groupe: "Pertes", categorie: "attaque", portee: "nous", signe: "negatif", ordre: 5, actif: true },
  { dictionary_version: "v2", action_id: "neutralisation_subie", lettre: "Y", libelle: "Neutralisation balle en main", abrege: "Neutr. subie", couleur: "#F97316", groupe: "Pertes", categorie: "attaque", portee: "nous", signe: "negatif", ordre: 6, actif: true },
  { dictionary_version: "v2", action_id: "tir_hors_cible", lettre: "N", libelle: "Tir hors cadre", abrege: "Hors cadre", couleur: "#D946EF", groupe: "Tirs", categorie: "attaque", portee: "nous", signe: "negatif", ordre: 7, actif: true },
  { dictionary_version: "v2", action_id: "exclusion_provoquee", lettre: "I", libelle: "2 minutes provoqué", abrege: "2' provoq.", couleur: "#10B981", groupe: "Créations", categorie: "attaque", portee: "nous", signe: "positif", ordre: 8, actif: true },

  // Défense
  { dictionary_version: "v2", action_id: "neutralisation", lettre: "Q", libelle: "Neutralisation", abrege: "Neutr.", couleur: "#14B8A6", groupe: "Récupérations", categorie: "defense", portee: "nous", signe: "positif", ordre: 1, actif: true },
  { dictionary_version: "v2", action_id: "contre", lettre: "S", libelle: "Contre", abrege: "Contre", couleur: "#6366F1", groupe: "Récupérations", categorie: "defense", portee: "nous", signe: "positif", ordre: 2, actif: true },
  { dictionary_version: "v2", action_id: "passage_force_obtenu", lettre: "D", libelle: "Passage en force obtenu", abrege: "Pass. force", couleur: "#84CC16", groupe: "Récupérations", categorie: "defense", portee: "nous", signe: "positif", ordre: 3, actif: true },
  { dictionary_version: "v2", action_id: "interception", lettre: "F", libelle: "Interception", abrege: "Intercept.", couleur: "#EAB308", groupe: "Récupérations", categorie: "defense", portee: "nous", signe: "positif", ordre: 4, actif: true },
  { dictionary_version: "v2", action_id: "erreur_defensive", lettre: "O", libelle: "Erreur défensive", abrege: "Erreur déf.", couleur: "#FB7185", groupe: "Erreurs", categorie: "defense", portee: "nous", signe: "negatif", ordre: 5, actif: true },
  { dictionary_version: "v2", action_id: "penalty_concede", lettre: "P", libelle: "Pénalty concédé (7 m)", abrege: "Pénalty concédé", couleur: "#9F1239", groupe: "Erreurs", categorie: "defense", portee: "nous", signe: "negatif", ordre: 6, actif: true },
  { dictionary_version: "v2", action_id: "exclusion_2min", lettre: "G", libelle: "Exclusion de 2 minutes", abrege: "Exclu 2'", couleur: "#DC2626", groupe: "Sanctions", categorie: "defense", portee: "nous", signe: "negatif", ordre: 7, actif: true },
  { dictionary_version: "v2", action_id: "avertissement", lettre: "H", libelle: "Avertissement (carton jaune)", abrege: "C. jaune", couleur: "#FACC15", groupe: "Sanctions", categorie: "defense", portee: "nous", signe: "negatif", ordre: 8, actif: true },
  { dictionary_version: "v2", action_id: "disqualification", lettre: "J", libelle: "Disqualification (carton rouge)", abrege: "C. rouge", couleur: "#B91C1C", groupe: "Sanctions", categorie: "defense", portee: "nous", signe: "negatif", ordre: 9, actif: true },
  { dictionary_version: "v2", action_id: "carton_bleu", lettre: "U", libelle: "Carton bleu (rapport)", abrege: "C. bleu", couleur: "#1D4ED8", groupe: "Sanctions", categorie: "defense", portee: "nous", signe: "negatif", ordre: 10, actif: true },

  // Gardien
  { dictionary_version: "v2", action_id: "arret", lettre: "W", libelle: "Tir adverse arrêté", abrege: "Arrêt", couleur: "#2563EB", groupe: "Arrêts", categorie: "gardien", portee: "adverse", signe: "positif", ordre: 1, actif: true },
  { dictionary_version: "v2", action_id: "tir_hors_cadre", lettre: "X", libelle: "Tir adverse hors cadre", abrege: "Hors cadre", couleur: "#64748B", groupe: "Arrêts", categorie: "gardien", portee: "adverse", signe: "positif", ordre: 2, actif: true },
  { dictionary_version: "v2", action_id: "but_encaisse_6m", lettre: "C", libelle: "But encaissé à 6 m", abrege: "But 6 m", couleur: "#E11D48", groupe: "Buts encaissés", categorie: "gardien", portee: "adverse", signe: "negatif", ordre: 3, actif: true },
  { dictionary_version: "v2", action_id: "but_encaisse_9m", lettre: "V", libelle: "But encaissé à 9 m", abrege: "But 9 m", couleur: "#DB2777", groupe: "Buts encaissés", categorie: "gardien", portee: "adverse", signe: "negatif", ordre: 4, actif: true },
  { dictionary_version: "v2", action_id: "but_encaisse_cage_vide", lettre: "B", libelle: "But encaissé cage vide", abrege: "Cage vide", couleur: "#78716C", groupe: "Buts encaissés", categorie: "gardien", portee: "adverse", signe: "negatif", ordre: 5, actif: true },

  // Changement (temps de jeu) — déclenchées par le glisser-déposer de l'écran de saisie,
  // pas par la grille de boutons ; la lettre reste un filet de secours clavier.
  { dictionary_version: "v2", action_id: "entree_jeu", lettre: "K", libelle: "Entrée en jeu", abrege: "Entrée", couleur: "#64748B", groupe: "Temps de jeu", categorie: "changement", portee: "nous", signe: "neutre", ordre: 1, actif: true },
  { dictionary_version: "v2", action_id: "sortie_jeu", lettre: "L", libelle: "Sortie du jeu", abrege: "Sortie", couleur: "#64748B", groupe: "Temps de jeu", categorie: "changement", portee: "nous", signe: "neutre", ordre: 2, actif: true },

  // Temps mort — déclenchés par les deux boutons dédiés à côté du score, jamais par la grille
  // de boutons ni par la grammaire clavier numéro+lettre (aucun joueur n'y est associé). `M` est
  // la dernière vraie lettre libre du clavier ; `0` n'a jamais été un raccourci clavier valide
  // (seules les lettres déclenchent une action, voir SaisieScreen) et sert donc ici de simple
  // identifiant unique côté données, sans intention d'usage clavier.
  { dictionary_version: "v2", action_id: "temps_mort_nous", lettre: "M", libelle: "Temps mort EVDR", abrege: "TM nous", couleur: "#64748B", groupe: "Temps mort", categorie: "changement", portee: "nous", signe: "neutre", ordre: 3, actif: true },
  { dictionary_version: "v2", action_id: "temps_mort_adverse", lettre: "0", libelle: "Temps mort adverse", abrege: "TM adv.", couleur: "#64748B", groupe: "Temps mort", categorie: "changement", portee: "adverse", signe: "neutre", ordre: 4, actif: true },
];

/** Aucun joueur associé : `numero` vaut toujours NULL, même via l'attribution implicite au gardien en jeu. */
export const ACTIONS_SANS_JOUEUR: ReadonlySet<ActionId> = new Set<ActionId>([
  "but_encaisse_cage_vide",
  "temps_mort_nous",
  "temps_mort_adverse",
]);

export type PositionId = "6m" | "9m" | "7m" | "aile" | "contre_attaque";

export const QUALIFICATIFS_POSITION: Readonly<Record<string, PositionId>> = {
  "6": "6m",
  "9": "9m",
  "7": "7m",
  "1": "aile",
  "2": "contre_attaque",
};
