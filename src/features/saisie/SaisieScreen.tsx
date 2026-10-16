import { useLiveQuery } from "dexie-react-hooks";
import type { DragEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Route } from "../../app/routes";
import { db } from "../../db/db";
import {
  annulerDernierEvenement,
  chargerActionsActives,
  chargerComposition,
  demarrerMatchSiBesoin,
  enregistrerEmplacementsTerrain,
  enregistrerEtatChrono,
  enregistrerEvenement,
  enregistrerTempsMort,
  evenementsActifs,
  qualifierDernierEvenement,
  terminerMatch,
} from "../../db/repository";
import type { JoueurComposition } from "../../db/repository";
import type { ActionDefinition, ActionId, PositionId } from "../../domain/action";
import { ACTIONS_SANS_JOUEUR, QUALIFICATIFS_POSITION } from "../../domain/action";
import type { StatutDiscipline } from "../../domain/discipline";
import { calculerStatutDiscipline, tempsAbsoluMs } from "../../domain/discipline";
import { NB_EMPLACEMENTS_TERRAIN } from "../../domain/match";
import { calculerTirsDePenalty } from "../../domain/penalty";
import { actionsDeLaStat } from "../../domain/stats";
import { formatChronoMs } from "../../domain/temps";
import { calculerTempsJeuMs, estSurLeTerrain } from "../../domain/tempsJeu";

export interface SaisieScreenProps {
  matchId: string;
  onQuitter: () => void;
  onNaviguer: (route: Route) => void;
}

const CATEGORIES = ["attaque", "defense", "gardien"] as const;

/**
 * Les seules issues possibles pour le tir de penalty (§7 de la spec : toujours à 7 m, jamais
 * 6/9 m). Tant qu'un `penalty_obtenu` est en attente, seules ces actions restent cliquables,
 * et uniquement sans position déjà posée (donc pas via les boutons rapides 6m/9m).
 */
const ACTIONS_ISSUE_PENALTY = new Set<ActionId>(["tir_arrete", "but", "tir_hors_cible"]);

/**
 * Symétrique côté défense : après un `penalty_concede`, seul le tir du gardien adverse — pardon,
 * la réponse de NOTRE gardien sur ce 7 m — reste cliquable. Comme il n'existe pas de bucket
 * "but encaissé à 7 m" dédié, le but est enregistré comme un `but_encaisse_6m`.
 */
const ACTIONS_ISSUE_PENALTY_ENCAISSE = new Set<ActionId>(["but_encaisse_6m", "arret", "tir_hors_cadre"]);

/** Un joueur grisé (exclu temporairement) reste sélectionnable, mais seulement pour ces actions. */
const ACTIONS_AUTORISEES_SI_EXCLU = new Set<ActionId>(["exclusion_2min", "avertissement", "disqualification", "carton_bleu"]);

/** Regroupe les actions par `groupe`, en conservant l'ordre d'apparition (déjà trié par catégorie+ordre). */
function grouperParGroupe(actions: readonly ActionDefinition[]): [string, ActionDefinition[]][] {
  const map = new Map<string, ActionDefinition[]>();
  for (const action of actions) {
    const liste = map.get(action.groupe) ?? [];
    liste.push(action);
    map.set(action.groupe, liste);
  }
  return [...map.entries()];
}

/**
 * "Court délai" du §5 de la spec : assez long pour un qualificatif tapé dans la foulée
 * de la lettre, assez court pour ne pas avaler le premier chiffre du numéro suivant
 * quand le marqueur enchaîne deux événements rapprochés.
 */
const FENETRE_QUALIFICATIF_MS = 600;

export function SaisieScreen({ matchId, onQuitter, onNaviguer }: SaisieScreenProps) {
  const match = useLiveQuery(() => db.matches.get(matchId), [matchId]);
  const composition = useLiveQuery(() => chargerComposition(matchId), [matchId]) ?? [];
  const evenements = useLiveQuery(() => evenementsActifs(matchId), [matchId]) ?? [];
  const tirsDePenalty = useMemo(() => calculerTirsDePenalty(evenements), [evenements]);
  const actionsActives =
    useLiveQuery(
      () => (match ? chargerActionsActives(match.dictionary_version) : Promise.resolve([])),
      [match?.dictionary_version],
    ) ?? [];

  useEffect(() => {
    void demarrerMatchSiBesoin(matchId);
  }, [matchId]);

  const actionsParLettre = useMemo(() => {
    const map = new Map<string, ActionDefinition>();
    for (const action of actionsActives) map.set(action.lettre.toUpperCase(), action);
    return map;
  }, [actionsActives]);

  const joueurParNumero = useMemo(() => {
    const map = new Map<number, (typeof composition)[number]>();
    for (const joueur of composition) map.set(joueur.numero, joueur);
    return map;
  }, [composition]);

  const score = useMemo(() => {
    const idsButs = new Set(actionsDeLaStat("buts"));
    const idsEncaisses = new Set(actionsDeLaStat("buts_encaisses"));
    let pour = 0;
    let contre = 0;
    for (const ev of evenements) {
      if (idsButs.has(ev.action_id)) pour += 1;
      if (idsEncaisses.has(ev.action_id)) contre += 1;
    }
    return { pour, contre };
  }, [evenements]);

  // Dérivé des événements plutôt que d'un état séparé : pas de resynchronisation à gérer si le
  // dernier `penalty_obtenu` est annulé (Suppr), le pending disparaît de lui-même.
  const penaltyEnAttente = evenements[0]?.action_id === "penalty_obtenu";
  const penaltyEncaisseEnAttente = evenements[0]?.action_id === "penalty_concede";

  const [periode, setPeriode] = useState(1);
  const [tampon, setTampon] = useState("");
  const [qualifOuvert, setQualifOuvert] = useState(false);
  const [flash, setFlash] = useState<{ type: "erreur" | "info"; texte: string } | null>(null);

  const chronoBaseRef = useRef(0);
  const chronoDepuisRef = useRef<number | null>(null);
  const [chronoActif, setChronoActif] = useState(false);
  const [chronoAffiche, setChronoAffiche] = useState(0);

  // Mémorise le temps figé de chaque période déjà visitée (persisté en base), pour pouvoir
  // revenir en arrière ou changer d'écran sans perdre le chrono en cours.
  const chronoParPeriodeRef = useRef<Map<number, number>>(new Map());
  const periodeRef = useRef(1);
  useEffect(() => {
    periodeRef.current = periode;
  });

  // `match` peut être encore indéfini le temps du premier chargement ; 30 min est la valeur par défaut à la configuration.
  const dureePeriodeMs = (match?.duree_periode_min ?? 30) * 60_000;
  const maintenantAbsoluMs = tempsAbsoluMs(periode, chronoAffiche, dureePeriodeMs);
  const statutParNumero = useMemo(() => {
    const map = new Map<number, StatutDiscipline>();
    for (const joueur of composition) {
      const evenementsJoueur = evenements.filter((e) => e.numero === joueur.numero);
      map.set(joueur.numero, calculerStatutDiscipline(evenementsJoueur, dureePeriodeMs, maintenantAbsoluMs));
    }
    return map;
  }, [composition, evenements, dureePeriodeMs, maintenantAbsoluMs]);

  // Temps de jeu et présence sur le terrain : recalculés depuis les événements
  // `entree_jeu`/`sortie_jeu` de chaque joueur (SPEC-donnees.md §9), jamais stockés.
  const tempsEtPresenceParNumero = useMemo(() => {
    const map = new Map<number, { surLeTerrain: boolean; tempsMs: number }>();
    for (const joueur of composition) {
      const evenementsJoueur = evenements.filter((e) => e.numero === joueur.numero);
      map.set(joueur.numero, {
        surLeTerrain: estSurLeTerrain(evenementsJoueur),
        tempsMs: calculerTempsJeuMs(evenementsJoueur, dureePeriodeMs, maintenantAbsoluMs),
      });
    }
    return map;
  }, [composition, evenements, dureePeriodeMs, maintenantAbsoluMs]);

  const joueursSurLeTerrain = composition.filter((j) => tempsEtPresenceParNumero.get(j.numero)?.surLeTerrain);
  const banc = composition.filter((j) => !tempsEtPresenceParNumero.get(j.numero)?.surLeTerrain);

  /**
   * Le gardien en jeu (pour l'attribution implicite des actions de catégorie gardien, SPEC
   * §5 "Gardien en jeu") est simplement celui des joueurs actuellement sur le terrain qui a
   * `gardien: true` — `null` si l'équipe joue "à 7" (cage vide, pas de gardien sur le terrain).
   */
  const gardienEnJeuNumero = joueursSurLeTerrain.find((j) => j.gardien)?.numero ?? null;

  /**
   * Emplacements du terrain : position stable par joueur, persistée sur le match plutôt que
   * dérivée de l'ordre de la composition — un changement ne redistribue jamais les autres
   * emplacements, et retirer un joueur laisse le sien vacant au lieu de faire remonter les
   * suivants. Cette réconciliation rattrape uniquement les écarts avec la présence réelle
   * (déduite des événements) : nouvel arrivant jamais encore placé -> premier emplacement libre,
   * joueur sorti -> son emplacement redevient vacant.
   */
  const emplacementsTerrain = match?.emplacements_terrain ?? [];
  useEffect(() => {
    if (!match) return;
    const actuel = match.emplacements_terrain ?? [];
    const surLeTerrainNumeros = new Set(joueursSurLeTerrain.map((j) => j.numero));
    const nouveau: (number | null)[] = Array.from({ length: NB_EMPLACEMENTS_TERRAIN }, (_, i) => {
      const n = actuel[i] ?? null;
      return n !== null && surLeTerrainNumeros.has(n) ? n : null;
    });
    for (const j of joueursSurLeTerrain) {
      if (nouveau.includes(j.numero)) continue;
      const indexLibre = nouveau.indexOf(null);
      if (indexLibre === -1) break; // ne devrait pas arriver : 7 emplacements pour 7 joueurs max sur le terrain
      nouveau[indexLibre] = j.numero;
    }
    const inchange = actuel.length === nouveau.length && actuel.every((v, i) => (v ?? null) === nouveau[i]);
    if (!inchange) void enregistrerEmplacementsTerrain(matchId, nouveau);
  }, [match, joueursSurLeTerrain, matchId]);

  // Joueur actuellement désigné (tampon) : s'il est grisé, seules Exclu 2'/Carton jaune/Carton
  // rouge doivent rester cliquables — reflété visuellement en plus du garde-fou dans traiterAction.
  const joueurTamponGrise = tampon !== "" && Boolean(statutParNumero.get(Number(tampon))?.grise);

  const qualifTimeoutRef = useRef<number | null>(null);
  const flashTimeoutRef = useRef<number | null>(null);

  // Plafonné à la durée de la période (30 min par défaut) : le chrono ne dépasse jamais ce
  // temps, ni à l'affichage ni dans les événements enregistrés.
  function chronoMsActuel(): number {
    const brut = chronoBaseRef.current + (chronoDepuisRef.current !== null ? Date.now() - chronoDepuisRef.current : 0);
    return Math.min(brut, dureePeriodeMs);
  }

  /** Persiste sur le match la période courante et le temps figé de chaque période visitée. */
  function sauvegarderEtatChrono(periodeActuelle: number, tempsFigeCourant: number) {
    chronoParPeriodeRef.current.set(periodeActuelle, tempsFigeCourant);
    const carte: Record<number, number> = {};
    chronoParPeriodeRef.current.forEach((v, k) => {
      carte[k] = v;
    });
    void enregistrerEtatChrono(matchId, periodeActuelle, carte);
  }

  // Restaure une seule fois, dès que le match est chargé, la période et le chrono là où on les
  // avait laissés (navigation vers une autre page, rechargement) plutôt que de repartir à zéro.
  const hydrateRef = useRef(false);
  useEffect(() => {
    if (!match || hydrateRef.current) return;
    hydrateRef.current = true;
    for (const [k, v] of Object.entries(match.chrono_par_periode ?? {})) {
      chronoParPeriodeRef.current.set(Number(k), v);
    }
    const periodeInitiale = match.periode_actuelle ?? 1;
    const tempsInitial = chronoParPeriodeRef.current.get(periodeInitiale) ?? 0;
    chronoBaseRef.current = tempsInitial;
    chronoDepuisRef.current = null;
    setChronoAffiche(tempsInitial);
    setPeriode(periodeInitiale);
  }, [match]);

  // Sauvegarde à la fermeture de l'écran (navigation) : on fige l'éventuel chrono en cours
  // pour ne rien perdre, sans dépendre d'une action explicite de l'utilisateur. Ne sauvegarde
  // que si l'hydratation a eu lieu : sinon (démontage avant que le match ait fini de charger,
  // notamment le double montage de StrictMode en dev) on écraserait l'état réel par des zéros.
  useEffect(() => {
    return () => {
      if (!hydrateRef.current) return;
      sauvegarderEtatChrono(periodeRef.current, chronoMsActuel());
    };
  }, [matchId]);

  useEffect(() => {
    if (!chronoActif) return;
    const id = window.setInterval(() => {
      const actuel = chronoMsActuel();
      setChronoAffiche(actuel);
      if (actuel >= dureePeriodeMs) {
        // Le temps de la période est écoulé : on fige et on arrête, comme un vrai chrono de match.
        chronoBaseRef.current = dureePeriodeMs;
        chronoDepuisRef.current = null;
        setChronoActif(false);
        sauvegarderEtatChrono(periode, dureePeriodeMs);
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [chronoActif, dureePeriodeMs, periode]);

  /** Fige le chrono là où il en est. Sans effet s'il est déjà à l'arrêt (appelable sans condition). */
  function pauserChrono() {
    chronoBaseRef.current = chronoMsActuel();
    chronoDepuisRef.current = null;
    setChronoActif(false);
    setChronoAffiche(chronoBaseRef.current);
    sauvegarderEtatChrono(periode, chronoBaseRef.current);
  }

  function toggleChrono() {
    if (chronoActif) {
      pauserChrono();
      return;
    }
    if (chronoMsActuel() >= dureePeriodeMs) return; // déjà à la durée max, rien à relancer
    chronoDepuisRef.current = Date.now();
    setChronoActif(true);
    setChronoAffiche(chronoMsActuel());
  }

  const DUREE_TEMPS_MORT_MS = 60_000;
  // Dérivé de `match.temps_mort` (horodatage absolu persisté) plutôt que d'un état local : il
  // survit ainsi tel quel à la navigation vers un autre écran (ex. consulter les statistiques
  // pendant le temps mort) sans se réinitialiser au remontage.
  const tempsMort = match?.temps_mort ?? null;
  const [, forcerRafraichissementTempsMort] = useState(0);

  useEffect(() => {
    if (!tempsMort) return;
    const id = window.setInterval(() => forcerRafraichissementTempsMort((n) => n + 1), 250);
    return () => window.clearInterval(id);
  }, [tempsMort]);

  const tempsMortRestantMs = tempsMort ? Math.max(0, tempsMort.fin_at - Date.now()) : 0;

  // Le temps mort ne se relance pas tout seul (à nous de relancer le chrono), mais son propre
  // décompte d'une minute s'efface une fois écoulé plutôt que de rester bloqué à 00:00.
  useEffect(() => {
    if (tempsMort && tempsMortRestantMs <= 0) void enregistrerTempsMort(matchId, null);
  }, [tempsMort, tempsMortRestantMs, matchId]);

  /**
   * Fige le chrono principal (à nous de le relancer à la fin du temps mort) et affiche un
   * décompte d'une minute sous le bouton concerné, en plus d'un vrai événement horodaté pour
   * qu'il apparaisse dans le fil d'actualité.
   */
  function declencherTempsMort(equipe: "nous" | "adverse") {
    pauserChrono();
    void enregistrerTempsMort(matchId, { equipe, fin_at: Date.now() + DUREE_TEMPS_MORT_MS });
    void enregistrerEvenement({
      match_id: matchId,
      periode,
      chrono_ms: chronoMsActuel(),
      numero: null,
      action_id: equipe === "nous" ? "temps_mort_nous" : "temps_mort_adverse",
      position: null,
    });
  }

  function changerPeriode(nouvellePeriode: number) {
    if (!match || nouvellePeriode < 1 || nouvellePeriode > match.nb_periodes || nouvellePeriode === periode) return;
    sauvegarderEtatChrono(periode, chronoMsActuel());
    const tempsSauvegarde = chronoParPeriodeRef.current.get(nouvellePeriode) ?? 0;
    chronoBaseRef.current = tempsSauvegarde;
    chronoDepuisRef.current = null;
    setChronoActif(false);
    setChronoAffiche(tempsSauvegarde);
    setPeriode(nouvellePeriode);
  }

  const [editionChrono, setEditionChrono] = useState(false);
  const [minutesEdit, setMinutesEdit] = useState("0");
  const [secondesEdit, setSecondesEdit] = useState("0");

  function ouvrirEditionChrono() {
    const total = Math.floor(chronoMsActuel() / 1000);
    setMinutesEdit(String(Math.floor(total / 60)));
    setSecondesEdit(String(total % 60));
    setEditionChrono(true);
  }

  function validerEditionChrono() {
    const minutes = Math.max(0, Number(minutesEdit) || 0);
    const secondes = Math.max(0, Math.min(59, Number(secondesEdit) || 0));
    const nouveauTemps = Math.min((minutes * 60 + secondes) * 1000, dureePeriodeMs);
    chronoBaseRef.current = nouveauTemps;
    chronoDepuisRef.current = chronoActif && nouveauTemps < dureePeriodeMs ? Date.now() : null;
    setChronoActif((actif) => actif && nouveauTemps < dureePeriodeMs);
    setChronoAffiche(nouveauTemps);
    setEditionChrono(false);
    sauvegarderEtatChrono(periode, nouveauTemps);
  }

  function declencherFlash(type: "erreur" | "info", texte: string) {
    setFlash({ type, texte });
    if (flashTimeoutRef.current) window.clearTimeout(flashTimeoutRef.current);
    flashTimeoutRef.current = window.setTimeout(() => setFlash(null), 1200);
  }

  function fermerFenetreQualificatif() {
    setQualifOuvert(false);
    if (qualifTimeoutRef.current) {
      window.clearTimeout(qualifTimeoutRef.current);
      qualifTimeoutRef.current = null;
    }
  }

  function ouvrirFenetreQualificatif() {
    setQualifOuvert(true);
    if (qualifTimeoutRef.current) window.clearTimeout(qualifTimeoutRef.current);
    qualifTimeoutRef.current = window.setTimeout(() => setQualifOuvert(false), FENETRE_QUALIFICATIF_MS);
  }

  /** Numéro désigné au clavier (tampon) ou à la souris (clic sur un joueur) : les deux se valent. */
  function selectionnerJoueur(numero: number) {
    fermerFenetreQualificatif();
    setTampon(String(numero));
  }

  /**
   * Change de gardien ou fait entrer/sortir un joueur de champ du terrain : écrit un vrai
   * `sortie_jeu` (si quelqu'un est remplacé) puis `entree_jeu`, horodatés au temps de jeu
   * courant — d'où l'attente entre les deux écritures, pour que leur ordre de séquence reste
   * correct (SPEC-donnees.md §9) plutôt que de dépendre d'une course entre deux écritures
   * concurrentes.
   */
  async function effectuerChangement(numeroEntrant: number, numeroSortant: number | null) {
    if (numeroEntrant === numeroSortant) return;
    if (statutParNumero.get(numeroEntrant)?.exclusDefinitivement) {
      declencherFlash("info", "Joueur disqualifié : ne peut pas entrer sur le terrain");
      return;
    }
    const chrono = chronoMsActuel();
    if (numeroSortant !== null) {
      await enregistrerEvenement({ match_id: matchId, periode, chrono_ms: chrono, numero: numeroSortant, action_id: "sortie_jeu", position: null });
    }
    await enregistrerEvenement({ match_id: matchId, periode, chrono_ms: chrono, numero: numeroEntrant, action_id: "entree_jeu", position: null });
  }

  /** Fait sortir un joueur de champ du terrain sans le remplacer (banc) : son emplacement reste vacant. */
  function retirerDuTerrain(numero: number) {
    void enregistrerEvenement({ match_id: matchId, periode, chrono_ms: chronoMsActuel(), numero, action_id: "sortie_jeu", position: null });
    void enregistrerEmplacementsTerrain(
      matchId,
      emplacementsTerrain.map((n) => (n === numero ? null : n)),
    );
  }

  /** Glisser sur un emplacement précis (occupé ou vide) : l'entrant prend exactement cette place. */
  function onDeposerSurEmplacement(e: DragEvent, indexEmplacement: number) {
    e.preventDefault();
    const numeroEntrant = Number(e.dataTransfer.getData("text/plain"));
    if (!Number.isFinite(numeroEntrant)) return;
    const numeroSortant = emplacementsTerrain[indexEmplacement] ?? null;
    void effectuerChangement(numeroEntrant, numeroSortant);

    const nouveau = Array.from({ length: NB_EMPLACEMENTS_TERRAIN }, (_, i) => emplacementsTerrain[i] ?? null);
    const ancienIndex = nouveau.indexOf(numeroEntrant);
    if (ancienIndex !== -1) nouveau[ancienIndex] = null;
    nouveau[indexEmplacement] = numeroEntrant;
    void enregistrerEmplacementsTerrain(matchId, nouveau);
  }

  function ajouterChiffre(chiffre: string) {
    if (qualifOuvert) {
      fermerFenetreQualificatif();
      const position = QUALIFICATIFS_POSITION[chiffre];
      if (position) {
        void qualifierDernierEvenement(matchId, position);
        return;
      }
      // Chiffre non reconnu comme qualificatif : il démarre un nouveau tampon numéro.
    }
    setTampon((t) => (t.length >= 2 ? t : t + chiffre));
  }

  /**
   * Point d'entrée unique pour une action, qu'elle vienne d'une lettre clavier ou d'un clic sur
   * le bouton. Si `position` est déjà connue (bouton rapide 6m/9m), elle est écrite directement
   * et aucune fenêtre de qualificatif ne s'ouvre ensuite : il n'y a plus rien à préciser.
   */
  /** Un joueur grisé reste sélectionnable, mais seules Exclu 2'/Carton jaune/Carton rouge lui sont permises. */
  function joueurExcluBloqueAction(numero: number, action: ActionDefinition): boolean {
    return Boolean(statutParNumero.get(numero)?.grise) && !ACTIONS_AUTORISEES_SI_EXCLU.has(action.action_id);
  }

  async function traiterAction(action: ActionDefinition, position: PositionId | null = null) {
    if (penaltyEnAttente && !(position === null && ACTIONS_ISSUE_PENALTY.has(action.action_id))) {
      declencherFlash("info", "Tir de penalty en attente : Arrêté / But / Hors cadre uniquement");
      return;
    }

    if (penaltyEncaisseEnAttente && !ACTIONS_ISSUE_PENALTY_ENCAISSE.has(action.action_id)) {
      declencherFlash("info", "Pénalty concédé en attente : But 6 m / Arrêt / Hors cadre uniquement");
      return;
    }

    fermerFenetreQualificatif();

    if (ACTIONS_SANS_JOUEUR.has(action.action_id)) {
      setTampon("");
      void enregistrerEvenement({
        match_id: matchId,
        periode,
        chrono_ms: chronoMsActuel(),
        numero: null,
        action_id: action.action_id,
        position,
      });
      if (!position) ouvrirFenetreQualificatif();
      return;
    }

    if (tampon === "") {
      // Le gardien en jeu est toujours implicite : une action gardien sans numéro lui est attribuée.
      if (action.categorie === "gardien") {
        const gardien = composition.find((j) => j.numero === gardienEnJeuNumero);
        if (gardien && joueurExcluBloqueAction(gardien.numero, action)) {
          declencherFlash("info", "Gardien exclu : seuls Exclu 2', Carton jaune et Carton rouge restent possibles");
          return;
        }
        if (gardien) {
          void enregistrerEvenement({
            match_id: matchId,
            periode,
            chrono_ms: chronoMsActuel(),
            numero: gardien.numero,
            action_id: action.action_id,
            position,
          });
          if (!position) ouvrirFenetreQualificatif();
          return;
        }
      }
      declencherFlash("info", "Sélectionnez un joueur avant l'action");
      return;
    }

    const n = Number(tampon);
    const joueur = joueurParNumero.get(n);
    if (!joueur) {
      declencherFlash("erreur", `Numéro ${n} absent de la feuille de match`);
      setTampon("");
      return;
    }

    if (joueurExcluBloqueAction(n, action)) {
      declencherFlash("info", "Joueur exclu : seuls Exclu 2', Carton jaune et Carton rouge restent possibles");
      return;
    }

    setTampon("");
    const etaitSurLeTerrain = tempsEtPresenceParNumero.get(n)?.surLeTerrain ?? false;
    const chrono = chronoMsActuel();
    const evenementCree = await enregistrerEvenement({
      match_id: matchId,
      periode,
      chrono_ms: chrono,
      numero: n,
      action_id: action.action_id,
      position,
    });
    if (!position) ouvrirFenetreQualificatif();

    // Exclusion de 2', carton rouge, ou 2e avertissement (qui vaut exclusion automatique,
    // SPEC-donnees.md §7) : le joueur est retiré du terrain d'office s'il y était.
    if (etaitSurLeTerrain) {
      const evenementsJoueurApres = [...evenements.filter((e) => e.numero === n), evenementCree];
      const statutApres = calculerStatutDiscipline(evenementsJoueurApres, dureePeriodeMs, tempsAbsoluMs(periode, chrono, dureePeriodeMs));
      if (statutApres.grise) retirerDuTerrain(n);
    }
  }

  // Le clavier est réévalué à chaque rendu via cette ref : le listener DOM lui-même n'est
  // (dés)abonné qu'une fois au montage, donc aucun état (chrono, tampon...) ne peut y devenir
  // périmé — c'est ce qui causait le bug où Espace ne mettait jamais le chrono en pause.
  const gererToucheRef = useRef<(e: KeyboardEvent) => void>(() => {});

  useEffect(() => {
    gererToucheRef.current = function onKeyDown(e: KeyboardEvent) {
      if (!match) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const cible = e.target;
      if (cible instanceof HTMLElement && ["INPUT", "TEXTAREA", "SELECT"].includes(cible.tagName)) return;

      if (e.key === " ") {
        e.preventDefault();
        toggleChrono();
        return;
      }

      if (e.key === "Backspace") {
        e.preventDefault();
        fermerFenetreQualificatif();
        setTampon((t) => t.slice(0, -1));
        return;
      }

      if (e.key === "Delete") {
        e.preventDefault();
        fermerFenetreQualificatif();
        void annulerDernierEvenement(matchId);
        return;
      }

      if (e.key === "Escape") {
        e.preventDefault();
        setTampon("");
        fermerFenetreQualificatif();
        return;
      }

      if (/^[0-9]$/.test(e.key)) {
        ajouterChiffre(e.key);
        return;
      }

      if (/^[a-zA-Z]$/.test(e.key)) {
        const action = actionsParLettre.get(e.key.toUpperCase());
        if (!action) return; // Lettre inconnue ou inactive : refus silencieux, tampon conservé.
        traiterAction(action);
      }
    };
  });

  useEffect(() => {
    function listener(e: KeyboardEvent) {
      gererToucheRef.current(e);
    }
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);

  if (!match) {
    return <div className="p-6 text-slate-500">Chargement du match…</div>;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-2 p-3">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-slate-900">vs {match.adversaire}</h1>
          <p className="text-xs text-slate-500">
            {match.date} — {match.domicile ? "domicile" : "extérieur"} — dictionnaire {match.dictionary_version}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={onQuitter} className="text-xs text-slate-500 hover:text-slate-800">
            ← Quitter
          </button>
          <button
            type="button"
            onClick={() => onNaviguer({ name: "statistiques", matchId })}
            className="rounded-md border border-slate-300 px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-100"
            title="Voir et télécharger les statistiques à l'instant T (utile à la mi-temps)"
          >
            Voir les stats
          </button>
          <button
            type="button"
            onClick={() => {
              void terminerMatch(matchId);
              onNaviguer({ name: "statistiques", matchId });
            }}
            className="rounded-md border border-red-300 px-2.5 py-1 text-xs text-red-700 hover:bg-red-50"
          >
            Terminer le match
          </button>
        </div>
      </header>

      <section className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 p-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Période</span>
          <button
            type="button"
            onClick={() => changerPeriode(periode - 1)}
            disabled={periode <= 1}
            className="rounded-md border border-slate-300 px-1.5 py-0.5 text-[11px] disabled:opacity-30"
            title="Revenir à la période précédente"
          >
            ◀
          </button>
          <span className="text-base font-semibold">
            {periode}/{match.nb_periodes}
          </span>
          <button
            type="button"
            onClick={() => changerPeriode(periode + 1)}
            disabled={periode >= match.nb_periodes}
            className="rounded-md border border-slate-300 px-1.5 py-0.5 text-[11px] disabled:opacity-30"
            title="Passer à la période suivante"
          >
            Période suivante ▶
          </button>
        </div>

        {editionChrono ? (
          <div className="flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1">
            <input
              type="number"
              min={0}
              value={minutesEdit}
              onChange={(e) => setMinutesEdit(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && validerEditionChrono()}
              className="w-12 rounded border border-slate-300 px-1 py-0.5 text-center font-mono text-sm"
            />
            <span className="font-mono text-sm">:</span>
            <input
              type="number"
              min={0}
              max={59}
              value={secondesEdit}
              onChange={(e) => setSecondesEdit(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && validerEditionChrono()}
              className="w-12 rounded border border-slate-300 px-1 py-0.5 text-center font-mono text-sm"
            />
            <button type="button" onClick={validerEditionChrono} className="rounded-md bg-club-primary px-2 py-1 text-xs text-white">
              OK
            </button>
            <button type="button" onClick={() => setEditionChrono(false)} className="px-1 text-xs text-slate-500">
              Annuler
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={toggleChrono}
              className={`rounded-md px-3 py-1 font-mono text-base ${
                chronoActif ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-700"
              }`}
            >
              {formatChronoMs(chronoAffiche)} {chronoActif ? "⏸" : "▶"}
            </button>
            <button
              type="button"
              onClick={ouvrirEditionChrono}
              className="rounded-md border border-slate-300 px-1.5 py-1 text-xs text-slate-500 hover:bg-slate-100"
              title="Modifier le temps manuellement"
            >
              ✎
            </button>
          </div>
        )}

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Score</span>
          <span className="font-mono text-base font-semibold text-slate-900">
            {score.pour} – {score.contre}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="flex flex-col items-center gap-0.5">
            <button
              type="button"
              onClick={() => declencherTempsMort("nous")}
              disabled={Boolean(tempsMort)}
              title={tempsMort ? "Un temps mort est déjà en cours" : undefined}
              className="rounded-md border border-slate-300 px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
            >
              TM EVDR
            </button>
            {tempsMort?.equipe === "nous" && (
              <span className="font-mono text-[11px] font-semibold text-slate-700">{formatChronoMs(tempsMortRestantMs)}</span>
            )}
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <button
              type="button"
              onClick={() => declencherTempsMort("adverse")}
              disabled={Boolean(tempsMort)}
              title={tempsMort ? "Un temps mort est déjà en cours" : undefined}
              className="rounded-md border border-slate-300 px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
            >
              TM ADV
            </button>
            {tempsMort?.equipe === "adverse" && (
              <span className="font-mono text-[11px] font-semibold text-slate-700">{formatChronoMs(tempsMortRestantMs)}</span>
            )}
          </div>
        </div>

        <div className="ml-auto flex h-11 min-w-20 flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-2">
          <span className="font-mono text-lg font-bold tracking-widest text-slate-900">{tampon || "—"}</span>
        </div>
      </section>

      {penaltyEnAttente && (
        <div className="rounded-md bg-purple-100 p-2 text-center text-sm font-medium text-purple-800">
          Penalty obtenu — le prochain tir (Arrêté / But / Hors cadre) sera interprété comme le 7 m
        </div>
      )}

      {penaltyEncaisseEnAttente && (
        <div className="rounded-md bg-rose-100 p-2 text-center text-sm font-medium text-rose-800">
          Pénalty concédé — seuls But 6 m / Arrêt / Hors cadre restent cliquables pour le tir du gardien
        </div>
      )}

      {joueurTamponGrise && (
        <div className="rounded-md bg-orange-100 p-2 text-center text-sm font-medium text-orange-800">
          Joueur exclu — seules Exclu 2', Carton jaune et Carton rouge restent possibles pour lui
        </div>
      )}

      {flash && (
        <div
          className={`rounded-md p-2 text-center text-sm font-medium ${
            flash.type === "erreur" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"
          }`}
        >
          {flash.texte}
        </div>
      )}

      <div className="flex items-start gap-3">
        <div className="w-36 shrink-0 space-y-3">
          <PanneauTerrain
            emplacements={emplacementsTerrain}
            joueurParNumero={joueurParNumero}
            tempsParNumero={tempsEtPresenceParNumero}
            selectionne={tampon}
            discipline={statutParNumero}
            onSelectionner={selectionnerJoueur}
            onRetirer={retirerDuTerrain}
            onDeposer={onDeposerSurEmplacement}
          />

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const numero = Number(e.dataTransfer.getData("text/plain"));
              if (Number.isFinite(numero) && tempsEtPresenceParNumero.get(numero)?.surLeTerrain) retirerDuTerrain(numero);
            }}
          >
            <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Banc ({banc.length})</h3>
            <div className="grid max-h-[50vh] grid-cols-2 gap-1.5 overflow-y-auto pr-1">
              {banc.map((j) => (
                <CarteJoueur
                  key={j.player_id}
                  joueur={j}
                  selectionne={tampon === String(j.numero)}
                  discipline={statutParNumero.get(j.numero)}
                  tempsMs={tempsEtPresenceParNumero.get(j.numero)?.tempsMs}
                  draggable={!statutParNumero.get(j.numero)?.exclusDefinitivement}
                  onClick={selectionnerJoueur}
                />
              ))}
            </div>
            {banc.length === 0 && <p className="text-[11px] text-slate-400 italic">Tout le monde est sur le terrain.</p>}
          </div>

          <GrilleSanctions
            actionsSanctions={actionsActives.filter((a) => a.groupe === "Sanctions")}
            joueurTamponGrise={joueurTamponGrise}
            penaltyEnAttente={penaltyEnAttente}
            penaltyEncaisseEnAttente={penaltyEncaisseEnAttente}
            onClick={traiterAction}
          />
        </div>

        {CATEGORIES.map((categorie) => (
          <div key={categorie} className="w-36 shrink-0">
            <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">{categorie}</h3>
            <div className="space-y-1.5">
              {grouperParGroupe(actionsActives.filter((a) => a.categorie === categorie && a.groupe !== "Sanctions")).map(
                ([groupe, actions]) => (
                  <div key={groupe}>
                    <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">{groupe}</p>
                    <div className="flex flex-col gap-2">
                      {actions.map((a) => {
                        const bloqueeParExclusion = joueurTamponGrise && !ACTIONS_AUTORISEES_SI_EXCLU.has(a.action_id);
                        const bloqueeParPenalty = penaltyEnAttente && !ACTIONS_ISSUE_PENALTY.has(a.action_id);
                        const bloqueeParPenaltyEncaisse = penaltyEncaisseEnAttente && !ACTIONS_ISSUE_PENALTY_ENCAISSE.has(a.action_id);
                        const bloquee = bloqueeParPenalty || bloqueeParPenaltyEncaisse || bloqueeParExclusion;
                        return (
                          <div key={a.action_id} className="flex flex-col gap-1">
                            <button
                              type="button"
                              onClick={() => traiterAction(a)}
                              disabled={bloquee}
                              style={{ borderLeftColor: a.couleur, backgroundColor: `${a.couleur}17` }}
                              className="flex items-center gap-1.5 rounded-md border border-l-4 border-slate-200 px-1.5 py-1.5 shadow-sm transition-colors hover:brightness-95 active:brightness-90 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:brightness-100"
                            >
                              <span className="w-4 shrink-0 font-mono text-sm font-bold text-slate-900">{a.lettre}</span>
                              <span className="truncate text-[11px] font-medium text-slate-600">{a.abrege}</span>
                            </button>

                            {groupe === "Tirs" && (
                              <div className="flex gap-1">
                                <BoutonTirPosition action={a} position="9m" libelle="9 m" disabled={bloquee} onClick={traiterAction} />
                                <BoutonTirPosition action={a} position="6m" libelle="6 m" disabled={bloquee} onClick={traiterAction} />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>
        ))}

        <div className="min-w-0 flex-1">
          <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Événements ({evenements.length})</h3>
          <button
            type="button"
            onClick={() => {
              fermerFenetreQualificatif();
              void annulerDernierEvenement(matchId);
            }}
            disabled={evenements.length === 0}
            className="mb-1.5 w-full rounded-md border border-red-300 px-2 py-1 text-[11px] font-medium text-red-700 hover:bg-red-50 disabled:opacity-30"
          >
            ✕ Annuler le dernier événement
          </button>
          <ul className="max-h-[70vh] space-y-1 overflow-y-auto text-xs">
            {evenements.map((ev) => {
              const action = actionsActives.find((a) => a.action_id === ev.action_id);
              return (
                <li
                  key={ev.event_id}
                  style={{ borderLeftColor: action?.couleur ?? "#94A3B8" }}
                  className="border-l-4 border-slate-200 bg-slate-50 py-1 pl-2 text-[11px]"
                >
                  {formatChronoMs(ev.chrono_ms)} — P{ev.periode} — {ev.numero ?? "—"} — {action?.libelle ?? ev.action_id}
                  {tirsDePenalty.has(ev.event_id) ? " (pénalty)" : ""}
                  {ev.position ? ` (${ev.position})` : ""}
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <p className="text-center text-[11px] text-slate-400">
        Numéro puis action, au clavier ou à la souris. Espace = chrono. Retour arrière = efface le dernier chiffre.
        Échap = vide le tampon. Suppr (ou le bouton) = annule le dernier événement. Glisser un joueur du banc sur le
        terrain pour le faire entrer.
      </p>
    </div>
  );
}

interface BoutonTirPositionProps {
  action: ActionDefinition;
  position: PositionId;
  libelle: string;
  disabled?: boolean;
  onClick: (action: ActionDefinition, position: PositionId) => void;
}

/** Raccourci moitié-largeur : même action que le bouton lettre, mais position déjà connue (6m/9m). */
function BoutonTirPosition({ action, position, libelle, disabled = false, onClick }: BoutonTirPositionProps) {
  return (
    <button
      type="button"
      onClick={() => onClick(action, position)}
      disabled={disabled}
      style={{ borderLeftColor: action.couleur, backgroundColor: `${action.couleur}17` }}
      className="flex flex-1 flex-col items-center justify-center rounded-md border border-l-4 border-slate-200 py-1 shadow-sm transition-colors hover:brightness-95 active:brightness-90 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:brightness-100"
    >
      <span className="font-mono text-sm font-bold text-slate-900">{libelle}</span>
      <span className="truncate text-[10px] font-medium text-slate-600">{action.abrege}</span>
    </button>
  );
}

interface GrilleSanctionsProps {
  actionsSanctions: readonly ActionDefinition[];
  joueurTamponGrise: boolean;
  penaltyEnAttente: boolean;
  penaltyEncaisseEnAttente: boolean;
  onClick: (action: ActionDefinition) => void;
}

/**
 * Grille 2x2 des sanctions, sous "Sur le terrain" : 2' (glyphe "2") à côté du carton jaune, carton
 * rouge en dessous à côté du carton bleu — chaque bouton fait la moitié de la largeur d'une carte
 * joueur de cette colonne.
 */
function GrilleSanctions({ actionsSanctions, joueurTamponGrise, penaltyEnAttente, penaltyEncaisseEnAttente, onClick }: GrilleSanctionsProps) {
  const parId = new Map(actionsSanctions.map((a) => [a.action_id, a]));
  const deux = parId.get("exclusion_2min");
  const jaune = parId.get("avertissement");
  const rouge = parId.get("disqualification");
  const bleu = parId.get("carton_bleu");

  function bloquee(a: ActionDefinition): boolean {
    const parExclusion = joueurTamponGrise && !ACTIONS_AUTORISEES_SI_EXCLU.has(a.action_id);
    const parPenalty = penaltyEnAttente && !ACTIONS_ISSUE_PENALTY.has(a.action_id);
    const parPenaltyEncaisse = penaltyEncaisseEnAttente && !ACTIONS_ISSUE_PENALTY_ENCAISSE.has(a.action_id);
    return parExclusion || parPenalty || parPenaltyEncaisse;
  }

  return (
    <div>
      <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Sanctions</h3>
      <div className="grid grid-cols-2 gap-1">
        {deux && <BoutonSanction action={deux} glyphe="2" disabled={bloquee(deux)} onClick={() => onClick(deux)} />}
        {jaune && <BoutonSanction action={jaune} glyphe={jaune.lettre} disabled={bloquee(jaune)} onClick={() => onClick(jaune)} />}
        {rouge && <BoutonSanction action={rouge} glyphe={rouge.lettre} disabled={bloquee(rouge)} onClick={() => onClick(rouge)} />}
        {bleu && <BoutonSanction action={bleu} glyphe={bleu.lettre} disabled={bloquee(bleu)} onClick={() => onClick(bleu)} />}
      </div>
    </div>
  );
}

function BoutonSanction({
  action,
  glyphe,
  disabled,
  onClick,
}: {
  action: ActionDefinition;
  glyphe: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={action.libelle}
      style={{ borderColor: action.couleur, backgroundColor: `${action.couleur}17` }}
      className="flex h-10 items-center justify-center rounded-md border-2 font-mono text-sm font-bold text-slate-900 shadow-sm transition-colors hover:brightness-95 active:brightness-90 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:brightness-100"
    >
      {glyphe}
    </button>
  );
}

interface PanneauTerrainProps {
  /** Emplacement -> numéro qui l'occupe, ou null si vacant (position stable, voir SaisieScreen). */
  emplacements: readonly (number | null)[];
  joueurParNumero: Map<number, JoueurComposition>;
  tempsParNumero: Map<number, { surLeTerrain: boolean; tempsMs: number }>;
  selectionne: string;
  discipline: Map<number, StatutDiscipline>;
  onSelectionner: (numero: number) => void;
  onRetirer: (numero: number) => void;
  onDeposer: (e: DragEvent, indexEmplacement: number) => void;
}

/**
 * Grille 2 colonnes des joueurs actuellement sur le terrain, avec leur temps de jeu en direct.
 * Chaque emplacement a une position stable (voir `emplacementsTerrain` dans SaisieScreen) : glisser
 * une carte du banc dessus (occupé ou vide) prend exactement cette place, sans redistribuer les
 * autres — voir `effectuerChangement`/`onDeposerSurEmplacement`.
 */
function PanneauTerrain({
  emplacements,
  joueurParNumero,
  tempsParNumero,
  selectionne,
  discipline,
  onSelectionner,
  onRetirer,
  onDeposer,
}: PanneauTerrainProps) {
  const occupes = emplacements.filter((n) => n !== null).length;

  return (
    <div>
      <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        Sur le terrain ({occupes}/{emplacements.length})
      </h3>
      <div className="grid grid-cols-2 gap-1.5">
        {emplacements.map((numero, i) => {
          const joueur = numero !== null ? joueurParNumero.get(numero) : undefined;
          return joueur ? (
            <CarteJoueur
              key={joueur.player_id}
              joueur={joueur}
              selectionne={selectionne === String(joueur.numero)}
              surLeTerrain
              discipline={discipline.get(joueur.numero)}
              tempsMs={tempsParNumero.get(joueur.numero)?.tempsMs}
              onClick={onSelectionner}
              onRetirer={onRetirer}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => onDeposer(e, i)}
            />
          ) : (
            <div
              key={i}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => onDeposer(e, i)}
              className="flex h-[74px] items-center justify-center rounded-lg border border-dashed border-slate-300 text-[10px] text-slate-400"
            >
              Libre
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface CarteJoueurProps {
  joueur: JoueurComposition;
  selectionne: boolean;
  /** Actuellement sur le terrain (banc sinon) : bordure bleue + bouton pour le rebancher. */
  surLeTerrain?: boolean;
  discipline?: StatutDiscipline;
  /** Temps de jeu cumulé (ms), affiché en badge quand fourni. */
  tempsMs?: number;
  draggable?: boolean;
  onClick: (numero: number) => void;
  onRetirer?: (numero: number) => void;
  onDragOver?: (e: DragEvent) => void;
  onDrop?: (e: DragEvent) => void;
}

/** Carte au format portrait, prévue pour accueillir la photo du joueur au-dessus du numéro. */
function CarteJoueur({
  joueur,
  selectionne,
  surLeTerrain = false,
  discipline,
  tempsMs,
  draggable = false,
  onClick,
  onRetirer,
  onDragOver,
  onDrop,
}: CarteJoueurProps) {
  return (
    <button
      type="button"
      onClick={() => onClick(joueur.numero)}
      disabled={discipline?.exclusDefinitivement}
      draggable={draggable}
      onDragStart={(e) => e.dataTransfer.setData("text/plain", String(joueur.numero))}
      onDragOver={onDragOver}
      onDrop={onDrop}
      title={
        discipline?.exclusDefinitivement
          ? "Disqualifié : indisponible pour le reste du match"
          : discipline?.grise
            ? "Exclu temporairement : sélectionnable uniquement pour Exclu 2', Carton jaune ou Carton rouge"
            : undefined
      }
      className={`relative flex w-full flex-col items-center gap-1 rounded-lg border p-1 transition-colors ${
        surLeTerrain ? "border-sky-400 ring-2 ring-sky-400" : "border-slate-200"
      } ${selectionne ? "bg-club-primary text-white" : "hover:bg-slate-50"} ${discipline?.grise ? "cursor-not-allowed opacity-50 grayscale" : ""} ${draggable ? "cursor-grab active:cursor-grabbing" : ""}`}
    >
      {joueur.gardien && (
        <span
          title="Gardien"
          className="absolute -top-1.5 -left-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[9px] ring-1 ring-slate-300"
        >
          🧤
        </span>
      )}
      {onRetirer && (
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            onRetirer(joueur.numero);
          }}
          title="Rebancher ce joueur"
          className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-slate-600 text-[9px] text-white hover:bg-slate-800"
        >
          ✕
        </span>
      )}
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-md text-lg ${
          selectionne ? "bg-white/10" : "bg-slate-100 text-slate-400"
        }`}
      >
        👤
      </div>
      <span className="font-mono text-sm font-bold">{joueur.numero}</span>
      <span className="line-clamp-1 w-full text-center text-[10px]">{joueur.nom}</span>
      {tempsMs !== undefined && (
        <span className={`font-mono text-[10px] ${selectionne ? "text-white/80" : "text-slate-400"}`}>{formatChronoMs(tempsMs)}</span>
      )}

      {discipline?.exclusTemporairement && discipline.tempsRestantMs !== null && (
        <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 rounded bg-red-600 px-1 text-[9px] font-bold whitespace-nowrap text-white">
          {formatChronoMs(discipline.tempsRestantMs)}
        </span>
      )}
      {discipline?.avertissement && (
        <span className="absolute bottom-0.5 left-0.5 h-2.5 w-2 rounded-[1px] bg-yellow-400 ring-1 ring-white" />
      )}
      {discipline?.exclusDefinitivement && (
        <span className="absolute right-0.5 bottom-0.5 h-2.5 w-2 rounded-[1px] bg-red-600 ring-1 ring-white" />
      )}
    </button>
  );
}
