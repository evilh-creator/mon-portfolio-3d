import { creerMatch, enregistrerCompositionMatch, enregistrerEvenement, terminerMatch, trouverOuCreerJoueur } from "../db/repository";
import type { ActionId } from "../domain/action";
import type { Equipe, MatchPlayer, Player } from "../domain/match";

/**
 * Génère un match fictif complet (12 joueurs dont 2 gardiens, 110 événements, score 30-24)
 * pour visualiser le rendu de l'écran Statistiques sans ressaisir un match entier.
 * Rejouable sans dupliquer le roster : les joueurs "démo" sont réutilisés s'ils existent déjà.
 */

const LETTRE_VERS_ACTION: Record<string, ActionId> = {
  A: "tir_arrete",
  Z: "but",
  N: "tir_hors_cible",
  E: "passe_decisive",
  R: "penalty_obtenu",
  T: "balle_perdue",
  Y: "neutralisation_subie",
  Q: "neutralisation",
  S: "contre",
  D: "passage_force_obtenu",
  F: "interception",
  G: "exclusion_2min",
  H: "avertissement",
  W: "arret",
  X: "tir_hors_cadre",
  C: "but_encaisse_6m",
  V: "but_encaisse_9m",
  B: "but_encaisse_cage_vide",
};

const JOUEURS_DEMO: readonly (readonly [nom: string, gardien: boolean])[] = [
  ["Hugo", true],
  ["Gabriel", true],
  ["Maverick", false],
  ["Théo", false],
  ["Kilian", false],
  ["Kevin", false],
  ["Thomas", false],
  ["Jordi", false],
  ["Alex", false],
  ["Loan", false],
  ["Flo", false],
  ["Adrien", false],
];

/** [numéro, lettres] : chaque lettre est un événement séparé pour ce joueur, dans l'ordre de saisie. */
const SEQUENCE_JOUEURS: readonly (readonly [numero: number, lettres: string])[] = [
  [3, "RZZZZZZANEETS"],
  [4, "ZZZZZANETQQFG"],
  [5, "ZZZZAYD"],
  [6, "RZZZZANESF"],
  [7, "ZZZATQQ"],
  [8, "ZZZAYDF"],
  [9, "ZZAQH"],
  [10, "ZATS"],
  [11, "ZF"],
  [12, "ZQ"],
];

const NUMERO_HUGO = 1;
const NUMERO_GABRIEL = 2;
const SEQUENCE_HUGO = "WWWWWWWWXXXCCCCCCCCCCVVVVV";
const SEQUENCE_GABRIEL = "WWWWXCCCCCCVV";

export async function genererMatchDemo(): Promise<string> {
  const equipe: Equipe = "A";

  const joueursParNom = new Map<string, Player>();
  for (const [nom, gardien] of JOUEURS_DEMO) {
    joueursParNom.set(nom, await trouverOuCreerJoueur(equipe, nom, gardien));
  }

  const match = await creerMatch({
    date: new Date().toISOString().slice(0, 10),
    equipe,
    adversaire: "ES Vitrolles (démo)",
    domicile: true,
    nb_periodes: 2,
    duree_periode_min: 30,
  });

  const composition: Omit<MatchPlayer, "match_id">[] = JOUEURS_DEMO.map(([nom, gardien], index) => ({
    player_id: joueursParNom.get(nom)!.player_id,
    numero: index + 1,
    gardien,
    ordre: index,
  }));
  await enregistrerCompositionMatch(match.match_id, composition);

  const sequence: { numero: number | null; action_id: ActionId }[] = [];
  for (const [numero, lettres] of SEQUENCE_JOUEURS) {
    for (const lettre of lettres) sequence.push({ numero, action_id: LETTRE_VERS_ACTION[lettre] });
  }
  for (const lettre of SEQUENCE_HUGO) sequence.push({ numero: NUMERO_HUGO, action_id: LETTRE_VERS_ACTION[lettre] });
  for (const lettre of SEQUENCE_GABRIEL) sequence.push({ numero: NUMERO_GABRIEL, action_id: LETTRE_VERS_ACTION[lettre] });
  sequence.push({ numero: null, action_id: "but_encaisse_cage_vide" });

  const dureePeriodeMs = match.duree_periode_min * 60_000;
  const moitie = Math.ceil(sequence.length / 2);
  for (let i = 0; i < sequence.length; i++) {
    const enPeriode1 = i < moitie;
    const tailleGroupe = enPeriode1 ? moitie : sequence.length - moitie;
    const indexDansPeriode = enPeriode1 ? i : i - moitie;
    await enregistrerEvenement({
      match_id: match.match_id,
      periode: enPeriode1 ? 1 : 2,
      chrono_ms: Math.round((indexDansPeriode / tailleGroupe) * dureePeriodeMs),
      numero: sequence[i].numero,
      action_id: sequence[i].action_id,
    });
  }

  await terminerMatch(match.match_id);
  return match.match_id;
}
