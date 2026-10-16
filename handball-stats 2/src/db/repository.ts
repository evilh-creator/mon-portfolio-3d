import { db } from "./db";
import type { ActionDefinition, ActionId, DictionaryVersion, PositionId } from "../domain/action";
import type { Equipe, Event, Match, MatchPlayer, Player, StatutMatch, TempsMort, TypeMatch } from "../domain/match";
import { NB_EMPLACEMENTS_TERRAIN } from "../domain/match";

/** Version du dictionnaire en vigueur au moment de l'appel (la plus récente connue). */
export async function versionDictionnaireActuelle(): Promise<DictionaryVersion> {
  const dictionnaires = await db.dictionaries.toArray();
  const plusRecent = dictionnaires.sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
  if (!plusRecent) {
    throw new Error("Aucun dictionnaire disponible en base.");
  }
  return plusRecent.version;
}

export async function creerJoueur(equipe: Equipe, nom: string, gardien: boolean, ordre?: number): Promise<Player> {
  const player: Player = {
    player_id: crypto.randomUUID(),
    nom: nom.trim(),
    equipe,
    gardien,
    ordre: ordre ?? (await prochainOrdreJoueur(equipe)),
  };
  await db.players.add(player);
  return player;
}

/**
 * Retire un joueur de la liste. Ne touche ni aux `events` (le `numero` y est dénormalisé,
 * SPEC-donnees.md §3) ni aux `match_players` des matchs passés : leur composition reste
 * intacte, seul le nom affiché devient "?" faute de joueur à joindre.
 */
export async function supprimerJoueur(playerId: string): Promise<void> {
  await db.players.delete(playerId);
}

async function prochainOrdreJoueur(equipe: Equipe): Promise<number> {
  const joueurs = await db.players.where("equipe").equals(equipe).toArray();
  return joueurs.reduce((max, j) => Math.max(max, j.ordre ?? 0), -1) + 1;
}

/** Réutilise un joueur existant (même nom + équipe) au lieu d'en créer un doublon. */
export async function trouverOuCreerJoueur(equipe: Equipe, nom: string, gardien: boolean, ordre?: number): Promise<Player> {
  const existant = await db.players
    .where("equipe")
    .equals(equipe)
    .filter((j) => j.nom === nom)
    .first();
  if (existant) return existant;
  return creerJoueur(equipe, nom, gardien, ordre);
}

export interface NouveauMatchInput {
  date: string;
  equipe: Equipe;
  adversaire: string;
  type_match?: TypeMatch;
  domicile: boolean;
  nb_periodes: number;
  duree_periode_min: number;
}

export async function creerMatch(input: NouveauMatchInput): Promise<Match> {
  const match: Match = {
    match_id: crypto.randomUUID(),
    date: input.date,
    equipe: input.equipe,
    adversaire: input.adversaire.trim(),
    type_match: input.type_match,
    domicile: input.domicile,
    dictionary_version: await versionDictionnaireActuelle(),
    nb_periodes: input.nb_periodes,
    duree_periode_min: input.duree_periode_min,
    statut: "config" satisfies StatutMatch,
    periode_actuelle: 1,
    chrono_par_periode: {},
    commentaire: "",
    temps_mort: null,
    emplacements_terrain: new Array(NB_EMPLACEMENTS_TERRAIN).fill(null),
  };
  await db.matches.add(match);
  return match;
}

/** Sauvegarde l'état de saisie en direct (période + chrono figé de chaque période visitée). */
export async function enregistrerEtatChrono(
  matchId: string,
  periodeActuelle: number,
  chronoParPeriode: Record<number, number>,
): Promise<void> {
  await db.matches.update(matchId, { periode_actuelle: periodeActuelle, chrono_par_periode: chronoParPeriode });
}

export async function enregistrerCommentaireMatch(matchId: string, commentaire: string): Promise<void> {
  await db.matches.update(matchId, { commentaire });
}

/** `null` pour effacer le temps mort en cours (terminé ou annulé). */
export async function enregistrerTempsMort(matchId: string, tempsMort: TempsMort | null): Promise<void> {
  await db.matches.update(matchId, { temps_mort: tempsMort });
}

/** Positions stables des joueurs sur le terrain — voir `Match.emplacements_terrain`. */
export async function enregistrerEmplacementsTerrain(matchId: string, emplacements: readonly (number | null)[]): Promise<void> {
  await db.matches.update(matchId, { emplacements_terrain: [...emplacements] });
}

export async function enregistrerCompositionMatch(
  matchId: string,
  composition: readonly Omit<MatchPlayer, "match_id">[],
): Promise<void> {
  const rows: MatchPlayer[] = composition.map((row) => ({ ...row, match_id: matchId }));
  await db.match_players.bulkPut(rows);
}

/**
 * Dernier numéro porté par chaque joueur de l'équipe, tous matchs confondus.
 * Sert uniquement de valeur par défaut en configuration de match : le numéro
 * reste éditable et propre à chaque feuille de match (SPEC-donnees.md §1.5).
 */
export async function derniersNumerosParJoueur(equipe: Equipe): Promise<Map<string, number>> {
  const matches = await db.matches.where("equipe").equals(equipe).sortBy("date");
  const parJoueur = new Map<string, number>();
  for (const match of matches) {
    const lignes = await db.match_players.where("match_id").equals(match.match_id).toArray();
    for (const ligne of lignes) {
      parJoueur.set(ligne.player_id, ligne.numero);
    }
  }
  return parJoueur;
}

export function matchsReprenables() {
  return db.matches.where("statut").anyOf("config", "en_cours").toArray();
}

export async function matchsTermines() {
  const matches = await db.matches.where("statut").equals("termine").toArray();
  return matches.sort((a, b) => b.date.localeCompare(a.date));
}

export interface JoueurComposition {
  player_id: string;
  nom: string;
  numero: number;
  gardien: boolean;
  ordre: number;
}

export async function chargerComposition(matchId: string): Promise<JoueurComposition[]> {
  const lignes = await db.match_players.where("match_id").equals(matchId).sortBy("ordre");
  const joueurs = await db.players.bulkGet(lignes.map((ligne) => ligne.player_id));
  return lignes.map((ligne, index) => ({
    player_id: ligne.player_id,
    nom: joueurs[index]?.nom ?? "?",
    numero: ligne.numero,
    gardien: ligne.gardien,
    ordre: ligne.ordre,
  }));
}

export async function chargerActionsActives(version: DictionaryVersion): Promise<ActionDefinition[]> {
  const actions = await db.actions.where("dictionary_version").equals(version).toArray();
  const ordreCategorie: Record<ActionDefinition["categorie"], number> = { attaque: 0, defense: 1, gardien: 2, changement: 3 };
  return actions
    .filter((action) => action.actif)
    .sort((a, b) => ordreCategorie[a.categorie] - ordreCategorie[b.categorie] || a.ordre - b.ordre);
}

export async function demarrerMatchSiBesoin(matchId: string): Promise<void> {
  const match = await db.matches.get(matchId);
  if (match && match.statut === "config") {
    await db.matches.update(matchId, { statut: "en_cours" satisfies StatutMatch });
  }
}

export async function terminerMatch(matchId: string): Promise<void> {
  await db.matches.update(matchId, { statut: "termine" satisfies StatutMatch });
}

async function dernierEvenementActif(matchId: string): Promise<Event | undefined> {
  const evenements = await db.events.where("match_id").equals(matchId).toArray();
  return evenements
    .filter((evenement) => !evenement.annule)
    .reduce<Event | undefined>((max, e) => (!max || e.ordre > max.ordre ? e : max), undefined);
}

export interface NouvelEvenementInput {
  match_id: string;
  periode: number;
  chrono_ms: number;
  numero: number | null;
  action_id: ActionId;
  /** Position déjà connue à la saisie (ex. bouton rapide 6m/9m) : évite la fenêtre de qualificatif. */
  position?: PositionId | null;
}

export async function enregistrerEvenement(input: NouvelEvenementInput): Promise<Event> {
  const existants = await db.events.where("match_id").equals(input.match_id).toArray();
  const ordreMax = existants.reduce((max, e) => Math.max(max, e.ordre), 0);
  const event: Event = {
    event_id: crypto.randomUUID(),
    match_id: input.match_id,
    ordre: ordreMax + 1,
    periode: input.periode,
    chrono_ms: input.chrono_ms,
    numero: input.numero,
    action_id: input.action_id,
    position: input.position ?? null,
    saisi_a: new Date().toISOString(),
    annule: false,
  };
  await db.events.add(event);
  return event;
}

/** Qualifie le dernier événement actif si le chiffre saisi arrive dans la fenêtre après une lettre. */
export async function qualifierDernierEvenement(matchId: string, position: PositionId): Promise<void> {
  const dernier = await dernierEvenementActif(matchId);
  if (!dernier) return;
  await db.events.update(dernier.event_id, { position });
}

/**
 * RETOUR ARR. : suppression logique du dernier événement actif, jamais de DELETE. Si c'était un
 * temps mort, son décompte en cours est aussi effacé — sinon annuler l'événement d'une fausse
 * manip laisserait le chrono figé et les boutons TM bloqués pour rien.
 */
export async function annulerDernierEvenement(matchId: string): Promise<void> {
  const dernier = await dernierEvenementActif(matchId);
  if (!dernier) return;
  await db.events.update(dernier.event_id, { annule: true });
  if (dernier.action_id === "temps_mort_nous" || dernier.action_id === "temps_mort_adverse") {
    await db.matches.update(matchId, { temps_mort: null });
  }
}

export function evenementsActifs(matchId: string) {
  return db.events
    .where("match_id")
    .equals(matchId)
    .toArray()
    .then((evenements) => evenements.filter((e) => !e.annule).sort((a, b) => b.ordre - a.ordre));
}

export interface ParticipationJoueur {
  match: Match;
  numero: number;
  gardien: boolean;
  evenements: Event[];
}

/**
 * Historique complet d'un joueur, tous matchs confondus. Le numéro pouvant changer d'un match
 * à l'autre (SPEC-donnees.md §1.5), la jointure passe par `match_players` pour chaque match,
 * jamais par un numéro unique global.
 */
export async function participationsJoueur(playerId: string): Promise<ParticipationJoueur[]> {
  const lignes = await db.match_players.filter((mp) => mp.player_id === playerId).toArray();
  const resultats: ParticipationJoueur[] = [];
  for (const ligne of lignes) {
    const match = await db.matches.get(ligne.match_id);
    if (!match) continue;
    const evenementsMatch = await db.events.where("match_id").equals(ligne.match_id).toArray();
    const evenements = evenementsMatch.filter((e) => !e.annule && e.numero === ligne.numero);
    resultats.push({ match, numero: ligne.numero, gardien: ligne.gardien, evenements });
  }
  return resultats.sort((a, b) => a.match.date.localeCompare(b.match.date));
}

export interface MatchAvecEvenements {
  match: Match;
  evenements: Event[];
}

/** Tous les matchs terminés d'une équipe, avec leurs événements actifs, du plus ancien au plus récent. */
export async function matchsTerminesAvecEvenements(equipe: Equipe): Promise<MatchAvecEvenements[]> {
  const matches = await db.matches
    .where("equipe")
    .equals(equipe)
    .and((m) => m.statut === "termine")
    .toArray();
  const resultats: MatchAvecEvenements[] = [];
  for (const match of matches) {
    const evenementsMatch = await db.events.where("match_id").equals(match.match_id).toArray();
    resultats.push({ match, evenements: evenementsMatch.filter((e) => !e.annule) });
  }
  return resultats.sort((a, b) => a.match.date.localeCompare(b.match.date));
}
