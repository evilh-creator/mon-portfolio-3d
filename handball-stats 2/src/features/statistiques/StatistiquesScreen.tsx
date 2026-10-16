import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useRef, useState } from "react";
import type { Route } from "../../app/routes";
import { db } from "../../db/db";
import type { JoueurComposition } from "../../db/repository";
import { chargerComposition, enregistrerCommentaireMatch, evenementsActifs } from "../../db/repository";
import type { ActionDefinition, ActionId, Signe } from "../../domain/action";
import type { Insight, TypeInsight } from "../../domain/analyse";
import { genererInsightsMatch } from "../../domain/analyse";
import { tempsAbsoluMs } from "../../domain/discipline";
import type { Event } from "../../domain/match";
import { calculerDetailImpactChamp, calculerImpactBrutGardien, calculerNotation, formatNote, formatScore, impactBrutChamp } from "../../domain/notation";
import { calculerTirsDePenalty } from "../../domain/penalty";
import { evaluerStat, formatPourcentage, trouverStat } from "../../domain/stats";
import { formatChronoMs } from "../../domain/temps";
import { calculerTempsJeuMs } from "../../domain/tempsJeu";

export interface StatistiquesScreenProps {
  matchId?: string;
  onRetour: () => void;
  onNaviguer: (route: Route) => void;
}

const COULEUR_TIRS = "#2563EB";
const COULEUR_BUTS = "#16A34A";

export function StatistiquesScreen({ matchId, onRetour, onNaviguer }: StatistiquesScreenProps) {
  const [matchIdActif, setMatchIdActif] = useState(matchId);

  if (!matchIdActif) {
    return <SelecteurMatch onRetour={onRetour} onChoisir={setMatchIdActif} />;
  }

  return (
    <StatistiquesMatch
      matchId={matchIdActif}
      onRetour={onRetour}
      onNaviguer={onNaviguer}
      onChangerMatch={() => setMatchIdActif(undefined)}
    />
  );
}

function SelecteurMatch({
  onRetour,
  onChoisir,
}: {
  onRetour: () => void;
  onChoisir: (matchId: string) => void;
}) {
  const matches = useLiveQuery(() => db.matches.toArray(), []) ?? [];
  const tries = [...matches].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button type="button" onClick={onRetour} className="text-sm text-slate-500 hover:text-slate-800">
            ← Accueil
          </button>
          <h1 className="text-xl font-semibold text-slate-900">Statistiques</h1>
        </div>
      </header>

      {tries.length === 0 ? (
        <p className="text-sm text-slate-500">Aucun match enregistré pour l'instant.</p>
      ) : (
        <ul className="space-y-1.5">
          {tries.map((m) => (
            <li key={m.match_id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm">
              <span>
                vs {m.adversaire} — {m.date} ({m.statut === "termine" ? "terminé" : m.statut === "en_cours" ? "en cours" : "config"})
              </span>
              <button
                type="button"
                onClick={() => onChoisir(m.match_id)}
                className="rounded-md border border-slate-300 px-3 py-1 text-slate-700 hover:bg-slate-100"
              >
                Voir
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface ColonneStat {
  header: string;
  valeur: (numero: number) => string;
}

function StatistiquesMatch({
  matchId,
  onRetour,
  onNaviguer,
  onChangerMatch,
}: {
  matchId: string;
  onRetour: () => void;
  onNaviguer: (route: Route) => void;
  onChangerMatch: () => void;
}) {
  const match = useLiveQuery(() => db.matches.get(matchId), [matchId]);
  const composition = useLiveQuery(() => chargerComposition(matchId), [matchId]) ?? [];
  const evenements = useLiveQuery(() => evenementsActifs(matchId), [matchId]) ?? [];
  const actions =
    useLiveQuery(
      () => db.actions.where("dictionary_version").equals(match?.dictionary_version ?? "v2").toArray(),
      [match?.dictionary_version],
    ) ?? [];

  useEffect(() => {
    if (!match) return;
    const titrePrecedent = document.title;
    document.title = `Stats – vs ${match.adversaire} – ${match.date}`;
    return () => {
      document.title = titrePrecedent;
    };
  }, [match]);

  if (!match) {
    return <div className="p-6 text-slate-500">Chargement…</div>;
  }

  const joueursDeChamp = composition.filter((j) => !j.gardien);
  const gardiens = composition.filter((j) => j.gardien);
  const dureePeriodeMs = match.duree_periode_min * 60_000;
  const dureeTotaleMs = match.nb_periodes * dureePeriodeMs;
  const signeParAction = new Map<ActionId, Signe>(actions.map((a) => [a.action_id, a.signe]));

  function evenementsDe(numero: number): Event[] {
    return evenements.filter((e) => e.numero === numero);
  }

  function valeur(id: Parameters<typeof trouverStat>[0], numero: number): number {
    return evaluerStat(trouverStat(id), evenementsDe(numero));
  }

  function compterAction(numero: number, actionId: Event["action_id"]): number {
    return evenementsDe(numero).filter((e) => e.action_id === actionId).length;
  }

  function tempsJeuMs(numero: number): number {
    return calculerTempsJeuMs(evenementsDe(numero), dureePeriodeMs, dureeTotaleMs);
  }

  function tempsJeu(numero: number): string {
    return formatChronoMs(tempsJeuMs(numero));
  }

  const tirsDePenalty = calculerTirsDePenalty(evenements);
  function detailImpact(numero: number) {
    return calculerDetailImpactChamp(evenementsDe(numero), tirsDePenalty);
  }
  function noteChamp(numero: number) {
    return calculerNotation(impactBrutChamp(detailImpact(numero)), tempsJeuMs(numero));
  }

  // 1. Actions positives — Attaque (score d'impact)
  const colonnesPositifAttaque: ColonneStat[] = [
    { header: "But", valeur: (n) => String(detailImpact(n).buts) },
    { header: "Passe déc.", valeur: (n) => String(detailImpact(n).passesDecisives) },
    { header: "7m obtenu", valeur: (n) => String(detailImpact(n).penaltysObtenus) },
    { header: "2' provoqué", valeur: (n) => String(detailImpact(n).exclusionsProvoquees) },
    { header: "Score d'impact", valeur: (n) => formatScore(detailImpact(n).scorePositifAttaque) },
  ];

  // 2. Actions positives — Défense (score d'impact)
  const colonnesPositifDefense: ColonneStat[] = [
    { header: "Neutr. déf.", valeur: (n) => String(detailImpact(n).neutralisations) },
    { header: "Contres", valeur: (n) => String(detailImpact(n).contres) },
    { header: "Passages force", valeur: (n) => String(detailImpact(n).passagesForce) },
    { header: "Interceptions", valeur: (n) => String(detailImpact(n).interceptions) },
    { header: "Score d'impact", valeur: (n) => formatScore(detailImpact(n).scorePositifDefense) },
  ];

  // 3. Actions négatives — Attaque (score d'impact)
  const colonnesNegatifAttaque: ColonneStat[] = [
    { header: "Penalty raté", valeur: (n) => String(detailImpact(n).penaltysRates) },
    { header: "Neutr. balle main", valeur: (n) => String(detailImpact(n).neutralisationsSubies) },
    { header: "Tir sans but", valeur: (n) => String(detailImpact(n).tirsSansBut) },
    { header: "Balle perdue", valeur: (n) => String(detailImpact(n).ballesPerdues) },
    { header: "Score d'impact", valeur: (n) => formatScore(detailImpact(n).scoreNegatifAttaque) },
  ];

  // 4. Actions négatives — Défense (score d'impact)
  const colonnesNegatifDefense: ColonneStat[] = [
    { header: "Erreur déf.", valeur: (n) => String(detailImpact(n).erreursDefensives) },
    { header: "Penalty concédé", valeur: (n) => String(detailImpact(n).penaltysConcedes) },
    { header: "Sanction reçue", valeur: (n) => String(detailImpact(n).sanctionsRecues) },
    { header: "Score d'impact", valeur: (n) => formatScore(detailImpact(n).scoreNegatifDefense) },
  ];

  // 5. Général : T1+T2+T3+T4 et note /10 ajustée au temps de jeu
  const colonnesGeneral: ColonneStat[] = [
    { header: "Temps de jeu", valeur: tempsJeu },
    { header: "Score attaque +", valeur: (n) => formatScore(detailImpact(n).scorePositifAttaque) },
    { header: "Score défense +", valeur: (n) => formatScore(detailImpact(n).scorePositifDefense) },
    { header: "Score attaque -", valeur: (n) => formatScore(detailImpact(n).scoreNegatifAttaque) },
    { header: "Score défense -", valeur: (n) => formatScore(detailImpact(n).scoreNegatifDefense) },
    { header: "Impact total", valeur: (n) => formatScore(impactBrutChamp(detailImpact(n))) },
    { header: "Note /10", valeur: (n) => formatNote(noteChamp(n).noteSur10) },
  ];

  const colonnesGardien: ColonneStat[] = [
    { header: "Temps de jeu", valeur: tempsJeu },
    { header: "Tirs subis", valeur: (n) => String(valeur("tirs_subis", n)) },
    { header: "Arrêts", valeur: (n) => String(valeur("arrets", n)) },
    { header: "Hors cadre", valeur: (n) => String(valeur("hors_cadre_subis", n)) },
    { header: "Buts 6m", valeur: (n) => String(compterAction(n, "but_encaisse_6m")) },
    { header: "Buts 9m", valeur: (n) => String(compterAction(n, "but_encaisse_9m")) },
    { header: "Buts encaissés", valeur: (n) => String(valeur("buts_encaisses_gb", n)) },
    { header: "% arrêts cadrés", valeur: (n) => formatPourcentage(valeur("pct_arrets", n)) },
    { header: "% arrêts total", valeur: (n) => formatPourcentage(valeur("pct_arrets_total", n)) },
    {
      header: "Note /10",
      valeur: (n) => formatNote(calculerNotation(calculerImpactBrutGardien(evenementsDe(n)), tempsJeuMs(n)).noteSur10),
    },
  ];

  const butsEquipe = evaluerStat(trouverStat("buts"), evenements);
  const tirsEquipe = evaluerStat(trouverStat("tirs"), evenements);
  const reussiteEquipe = evaluerStat(trouverStat("reussite_tir"), evenements);
  const passesEquipe = evaluerStat(trouverStat("passes_decisives"), evenements);
  const perduesEquipe = evaluerStat(trouverStat("balles_perdues"), evenements);
  const neutrSubieEquipe = evaluerStat(trouverStat("neutralisations_subies"), evenements);
  const defenseEquipe = evaluerStat(trouverStat("volume_defensif"), evenements);
  const sanctionsEquipe = evaluerStat(trouverStat("sanctions"), evenements);
  const encaissesEquipe = evaluerStat(trouverStat("buts_encaisses"), evenements);
  const arretsEquipe = evaluerStat(trouverStat("arrets"), evenements);
  const horsCadreEquipe = evaluerStat(trouverStat("hors_cadre_subis"), evenements);
  const pctArretsEquipe = evaluerStat(trouverStat("pct_arrets"), evenements);

  const meilleursButeurs = joueursDeChamp
    .map((j) => ({ joueur: j, buts: valeur("buts", j.numero), pctTir: valeur("reussite_tir", j.numero) }))
    .filter((ligne) => ligne.buts > 0)
    .sort((a, b) => b.buts - a.buts)
    .slice(0, 6);

  const insights = genererInsightsMatch(composition, evenements);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {match.statut === "termine" ? (
            <button type="button" onClick={onRetour} className="text-sm text-slate-500 hover:text-slate-800 print:hidden">
              ← Accueil
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onNaviguer({ name: "saisie", matchId: match.match_id })}
              className="text-sm text-slate-500 hover:text-slate-800 print:hidden"
            >
              ← Retour au match
            </button>
          )}
          <h1 className="text-xl font-semibold text-slate-900">
            Statistiques — vs {match.adversaire} ({match.date})
          </h1>
        </div>
        <div className="flex items-center gap-3 print:hidden">
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
          >
            Télécharger le PDF
          </button>
          <button type="button" onClick={onChangerMatch} className="text-sm text-slate-500 hover:text-slate-800">
            Changer de match
          </button>
        </div>
      </header>

      {insights.length > 0 && (
        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Points marquants</h2>
          <ul className="space-y-1.5">
            {insights.map((insight) => (
              <InsightLigne key={insight.texte} insight={insight} />
            ))}
          </ul>
        </section>
      )}

      <GraphiqueRecapMatch
        evenements={evenements}
        dureePeriodeMs={dureePeriodeMs}
        nbPeriodes={match.nb_periodes}
        nomAdversaire={match.adversaire}
        signeParAction={signeParAction}
        actions={actions}
        composition={composition}
      />

      <CommentaireMatch key={matchId} matchId={matchId} valeurInitiale={match.commentaire ?? ""} />

      <section className="grid grid-cols-1 gap-4 rounded-lg border border-slate-200 p-4 sm:grid-cols-2">
        <div>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Équipe</h2>
          <dl className="space-y-1 text-sm">
            <LigneIndicateur libelle="Buts" valeur={butsEquipe} />
            <LigneIndicateur libelle="Tirs" valeur={tirsEquipe} />
            <LigneIndicateur libelle="Efficacité au tir" valeur={formatPourcentage(reussiteEquipe)} />
            <LigneIndicateur libelle="Passes décisives" valeur={passesEquipe} />
            <LigneIndicateur libelle="Balles perdues" valeur={perduesEquipe} />
            <LigneIndicateur libelle="Neutr. balle en main" valeur={neutrSubieEquipe} />
            <LigneIndicateur libelle="Actions défensives +" valeur={defenseEquipe} />
            <LigneIndicateur libelle="Sanctions" valeur={sanctionsEquipe} />
          </dl>
        </div>
        <div>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Gardiens</h2>
          <dl className="space-y-1 text-sm">
            <LigneIndicateur libelle="Buts encaissés" valeur={encaissesEquipe} />
            <LigneIndicateur libelle="Arrêts" valeur={arretsEquipe} />
            <LigneIndicateur libelle="Tirs hors cadre" valeur={horsCadreEquipe} />
            <LigneIndicateur libelle="% arrêts cadrés" valeur={formatPourcentage(pctArretsEquipe)} />
            <LigneIndicateur libelle="Score" valeur={`${butsEquipe} – ${encaissesEquipe}`} />
            <LigneIndicateur libelle="Événements saisis" valeur={evenements.length} />
          </dl>
        </div>
      </section>

      {meilleursButeurs.length > 0 && (
        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Meilleurs buteurs</h2>
          <table className="w-full max-w-md text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="py-1 pr-2">N°</th>
                <th className="py-1 pr-2">Joueur</th>
                <th className="py-1 pr-2 text-right">Buts</th>
                <th className="py-1 text-right">% tir</th>
              </tr>
            </thead>
            <tbody>
              {meilleursButeurs.map(({ joueur, buts, pctTir }) => (
                <tr key={joueur.player_id} className="border-b border-slate-100">
                  <td className="py-1 pr-2">{joueur.numero}</td>
                  <td className="py-1 pr-2">{joueur.nom}</td>
                  <td className="py-1 pr-2 text-right font-mono">{buts}</td>
                  <td className="py-1 text-right font-mono">{formatPourcentage(pctTir)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <GraphiqueProduction joueurs={composition} valeurTirs={(n) => valeur("tirs", n)} valeurButs={(n) => valeur("buts", n)} />

      <TableauStats titre="1. Actions positives — Attaque (score d'impact)" joueurs={joueursDeChamp} colonnes={colonnesPositifAttaque} onNaviguer={onNaviguer} />
      <TableauStats titre="2. Actions positives — Défense (score d'impact)" joueurs={joueursDeChamp} colonnes={colonnesPositifDefense} onNaviguer={onNaviguer} />
      <TableauStats titre="3. Actions négatives — Attaque (score d'impact)" joueurs={joueursDeChamp} colonnes={colonnesNegatifAttaque} onNaviguer={onNaviguer} />
      <TableauStats titre="4. Actions négatives — Défense (score d'impact)" joueurs={joueursDeChamp} colonnes={colonnesNegatifDefense} onNaviguer={onNaviguer} />
      <TableauStats titre="5. Général — Note /10" joueurs={joueursDeChamp} colonnes={colonnesGeneral} onNaviguer={onNaviguer} />
      <TableauStats titre="Gardiens" joueurs={gardiens} colonnes={colonnesGardien} onNaviguer={onNaviguer} />

      <FilActualite evenements={evenements} actions={actions} />
    </div>
  );
}

/** Journal complet et chronologique de tous les événements du match, y compris hors ligne. */
function FilActualite({ evenements, actions }: { evenements: readonly Event[]; actions: readonly ActionDefinition[] }) {
  if (evenements.length === 0) return null;
  const actionParId = new Map(actions.map((a) => [a.action_id, a]));
  const parOrdre = [...evenements].sort((a, b) => a.ordre - b.ordre);
  const tirsDePenalty = calculerTirsDePenalty(evenements);

  return (
    <section>
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Fil d'actualité ({parOrdre.length})</h2>
      <ul className="impression-pleine-largeur space-y-1 text-xs">
        {parOrdre.map((ev) => {
          const action = actionParId.get(ev.action_id);
          return (
            <li
              key={ev.event_id}
              style={{ borderLeftColor: action?.couleur ?? "#94A3B8" }}
              className="border-l-4 border-slate-200 bg-slate-50 py-1 pl-2"
            >
              {formatChronoMs(ev.chrono_ms)} — P{ev.periode} — {ev.numero ?? "—"} — {action?.libelle ?? ev.action_id}
              {tirsDePenalty.has(ev.event_id) ? " (pénalty)" : ""}
              {ev.position ? ` (${ev.position})` : ""}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

const STYLE_INSIGHT: Record<TypeInsight, string> = {
  positif: "border-green-400 bg-green-50 text-green-900",
  negatif: "border-red-400 bg-red-50 text-red-900",
  neutre: "border-slate-300 bg-slate-50 text-slate-700",
};

function InsightLigne({ insight }: { insight: Insight }) {
  return <li className={`rounded-md border-l-4 px-3 py-2 text-sm ${STYLE_INSIGHT[insight.type]}`}>{insight.texte}</li>;
}

const DELAI_ENREGISTREMENT_MS = 800;

/**
 * `key={matchId}` côté appelant : la valeur initiale ne doit resynchroniser le texte qu'au
 * changement de match, jamais quand notre propre sauvegarde fait revenir un `match` à jour
 * (sinon on écraserait une frappe en cours pendant l'enregistrement différé).
 */
function CommentaireMatch({ matchId, valeurInitiale }: { matchId: string; valeurInitiale: string }) {
  const [texte, setTexte] = useState(valeurInitiale);
  const [enregistre, setEnregistre] = useState(true);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  function onChange(nouveauTexte: string) {
    setTexte(nouveauTexte);
    setEnregistre(false);
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => {
      void enregistrerCommentaireMatch(matchId, nouveauTexte).then(() => setEnregistre(true));
    }, DELAI_ENREGISTREMENT_MS);
  }

  return (
    <section>
      <div className="mb-2 flex items-center gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Commentaire</h2>
        {!enregistre && <span className="text-[11px] text-slate-400 print:hidden">enregistrement…</span>}
      </div>
      <textarea
        value={texte}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Notes sur ce match : points à travailler, décisions pour la suite…"
        rows={3}
        className="w-full rounded-md border border-slate-300 p-2 text-sm print:hidden"
      />
      <p className="hidden text-sm whitespace-pre-wrap text-slate-700 print:block">
        {texte || <span className="text-slate-400 italic">Aucun commentaire.</span>}
      </p>
    </section>
  );
}

function LigneIndicateur({ libelle, valeur }: { libelle: string; valeur: string | number }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-slate-500">{libelle}</dt>
      <dd className="font-mono font-semibold text-slate-900">{valeur}</dd>
    </div>
  );
}

function TableauStats({
  titre,
  joueurs,
  colonnes,
  onNaviguer,
}: {
  titre: string;
  joueurs: JoueurComposition[];
  colonnes: ColonneStat[];
  onNaviguer: (route: Route) => void;
}) {
  if (joueurs.length === 0) return null;
  return (
    <section>
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{titre}</h2>
      <div className="impression-pleine-largeur overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-club-primary text-white">
              <th className="px-2 py-2 text-left">N°</th>
              <th className="px-2 py-2 text-left">Joueur</th>
              {colonnes.map((colonne) => (
                <th key={colonne.header} className="px-2 py-2 text-right whitespace-nowrap">
                  {colonne.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {joueurs.map((joueur, index) => (
              <tr key={joueur.player_id} className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                <td className="border-t border-slate-100 px-2 py-1.5">{joueur.numero}</td>
                <td className="border-t border-slate-100 px-2 py-1.5">
                  <button
                    type="button"
                    onClick={() => onNaviguer({ name: "joueur", playerId: joueur.player_id })}
                    className="text-left hover:underline print:pointer-events-none"
                  >
                    {joueur.nom}
                  </button>
                </td>
                {colonnes.map((colonne) => (
                  <td key={colonne.header} className="border-t border-slate-100 px-2 py-1.5 text-right font-mono">
                    {colonne.valeur(joueur.numero)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/** Vert = à notre avantage (nous marquons / action positive), violet = à notre désavantage. */
const COULEUR_AVANTAGE = "#16A34A";
const COULEUR_DESAVANTAGE = "#7C3AED";
const LARGEUR_VUE_RECAP = 640;
const TAILLE_BIN_MIN = 5;

interface PointScore {
  t: number;
  score: number;
}

/** Points d'un tracé en escalier (le score ne change qu'aux buts) allant de 0 à la durée totale. */
function construirePasScore(temps: readonly number[], dureeTotaleMs: number): PointScore[] {
  const points: PointScore[] = [{ t: 0, score: 0 }];
  let score = 0;
  for (const t of temps) {
    points.push({ t, score });
    score += 1;
    points.push({ t, score });
  }
  points.push({ t: dureeTotaleMs, score });
  return points;
}

const ACTIONS_BUT_ADVERSAIRE: readonly ActionId[] = ["but_encaisse_6m", "but_encaisse_9m", "but_encaisse_cage_vide"];

/**
 * Récap visuel du match : évolution du score dans le temps (qui a marqué, quand) et impact des
 * actions positives/négatives par tranche de temps — sert à repérer d'un coup d'œil les
 * bascules du match plutôt que de les déduire de la liste des événements.
 */
function GraphiqueRecapMatch({
  evenements,
  dureePeriodeMs,
  nbPeriodes,
  nomAdversaire,
  signeParAction,
  actions,
  composition,
}: {
  evenements: readonly Event[];
  dureePeriodeMs: number;
  nbPeriodes: number;
  nomAdversaire: string;
  signeParAction: Map<ActionId, Signe>;
  actions: readonly ActionDefinition[];
  composition: readonly JoueurComposition[];
}) {
  if (evenements.length === 0) return null;
  const dureeTotaleMs = nbPeriodes * dureePeriodeMs;

  const avecTemps = evenements
    .map((evenement) => ({
      evenement,
      t: Math.min(tempsAbsoluMs(evenement.periode, evenement.chrono_ms, dureePeriodeMs), dureeTotaleMs),
    }))
    .sort((a, b) => a.t - b.t);

  const tempsButsNous = avecTemps.filter((l) => l.evenement.action_id === "but").map((l) => l.t);
  const tempsButsAdversaire = avecTemps
    .filter((l) => ACTIONS_BUT_ADVERSAIRE.includes(l.evenement.action_id))
    .map((l) => l.t);
  const tempsMorts: { t: number; equipe: "nous" | "adverse" }[] = avecTemps
    .filter((l) => l.evenement.action_id === "temps_mort_nous" || l.evenement.action_id === "temps_mort_adverse")
    .map((l) => ({ t: l.t, equipe: l.evenement.action_id === "temps_mort_nous" ? "nous" : "adverse" }));
  const actionParId = new Map(actions.map((a) => [a.action_id, a]));
  const nomParNumero = new Map(composition.map((j) => [j.numero, j.nom]));

  return (
    <section>
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Récap du match</h2>
      <div className="impression-pleine-largeur space-y-4 rounded-lg border border-slate-200 p-3">
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-600">Évolution du score</span>
            <div className="flex items-center gap-3 text-[11px] text-slate-600">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COULEUR_AVANTAGE }} />
                Nous
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COULEUR_DESAVANTAGE }} />
                {nomAdversaire}
              </span>
            </div>
          </div>
          <GraphiqueScoreTemps
            tempsButsNous={tempsButsNous}
            tempsButsAdversaire={tempsButsAdversaire}
            dureeTotaleMs={dureeTotaleMs}
            nbPeriodes={nbPeriodes}
          />
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-600">Impact des actions dans le temps</span>
            <div className="flex items-center gap-3 text-[11px] text-slate-600">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COULEUR_AVANTAGE }} />
                Positives
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COULEUR_DESAVANTAGE }} />
                Négatives
              </span>
            </div>
          </div>
          <GraphiqueImpactActions
            avecTemps={avecTemps}
            dureeTotaleMs={dureeTotaleMs}
            nbPeriodes={nbPeriodes}
            signeParAction={signeParAction}
            actionParId={actionParId}
            nomParNumero={nomParNumero}
            tempsMorts={tempsMorts}
          />
        </div>
      </div>
    </section>
  );
}

function GraphiqueScoreTemps({
  tempsButsNous,
  tempsButsAdversaire,
  dureeTotaleMs,
  nbPeriodes,
}: {
  tempsButsNous: readonly number[];
  tempsButsAdversaire: readonly number[];
  dureeTotaleMs: number;
  nbPeriodes: number;
}) {
  const margeGauche = 22;
  const margeDroite = 4;
  const largeurTrace = LARGEUR_VUE_RECAP - margeGauche - margeDroite;
  const hauteur = 110;
  const scoreMax = Math.max(1, tempsButsNous.length, tempsButsAdversaire.length);

  const x = (t: number) => margeGauche + (t / dureeTotaleMs) * largeurTrace;
  const y = (score: number) => hauteur - (score / scoreMax) * hauteur;
  const chemin = (points: readonly PointScore[]) => points.map((p) => `${x(p.t).toFixed(1)},${y(p.score).toFixed(1)}`).join(" ");

  const paliers = [...new Set([0, Math.round(scoreMax / 2), scoreMax])];
  const separateurs = Array.from({ length: nbPeriodes - 1 }, (_, i) => (i + 1) / nbPeriodes);

  return (
    <svg
      viewBox={`0 0 ${LARGEUR_VUE_RECAP} ${hauteur}`}
      className="w-full"
      style={{ aspectRatio: `${LARGEUR_VUE_RECAP} / ${hauteur}` }}
      role="img"
      aria-label="Évolution du score dans le temps"
    >
      {paliers.map((p) => (
        <g key={p}>
          <line x1={margeGauche} y1={y(p)} x2={LARGEUR_VUE_RECAP - margeDroite} y2={y(p)} stroke="#e1e0d9" strokeWidth={1} />
          <text x={margeGauche - 4} y={y(p) + 3} textAnchor="end" fontSize={8} fill="#898781">
            {p}
          </text>
        </g>
      ))}
      {separateurs.map((frac) => (
        <line
          key={frac}
          x1={margeGauche + frac * largeurTrace}
          y1={0}
          x2={margeGauche + frac * largeurTrace}
          y2={hauteur}
          stroke="#c3c2b7"
          strokeWidth={1}
          strokeDasharray="3,3"
        />
      ))}
      <polyline points={chemin(construirePasScore(tempsButsAdversaire, dureeTotaleMs))} fill="none" stroke={COULEUR_DESAVANTAGE} strokeWidth={2} strokeLinejoin="round" />
      <polyline points={chemin(construirePasScore(tempsButsNous, dureeTotaleMs))} fill="none" stroke={COULEUR_AVANTAGE} strokeWidth={2} strokeLinejoin="round" />
      {tempsButsNous.map((t, i) => (
        <circle key={`n${i}`} cx={x(t)} cy={y(i + 1)} r={2.6} fill={COULEUR_AVANTAGE}>
          <title>{`Nous — but à la ${Math.round(t / 60_000)}e minute`}</title>
        </circle>
      ))}
      {tempsButsAdversaire.map((t, i) => (
        <circle key={`a${i}`} cx={x(t)} cy={y(i + 1)} r={2.6} fill={COULEUR_DESAVANTAGE}>
          <title>{`Adversaire — but à la ${Math.round(t / 60_000)}e minute`}</title>
        </circle>
      ))}
    </svg>
  );
}

function GraphiqueImpactActions({
  avecTemps,
  dureeTotaleMs,
  nbPeriodes,
  signeParAction,
  actionParId,
  nomParNumero,
  tempsMorts,
}: {
  avecTemps: readonly { evenement: Event; t: number }[];
  dureeTotaleMs: number;
  nbPeriodes: number;
  signeParAction: Map<ActionId, Signe>;
  actionParId: Map<ActionId, ActionDefinition>;
  nomParNumero: Map<number, string>;
  tempsMorts: readonly { t: number; equipe: "nous" | "adverse" }[];
}) {
  const [binSelectionne, setBinSelectionne] = useState<number | null>(null);

  const margeGauche = 22;
  const margeDroite = 4;
  const margeBas = 14;
  const margeHaut = 10;
  const largeurTrace = LARGEUR_VUE_RECAP - margeGauche - margeDroite;
  const demiHauteur = 52;
  const hauteurBarres = demiHauteur * 2;
  const hauteur = hauteurBarres + margeHaut;
  const baseline = margeHaut + demiHauteur;

  const tailleBinMs = TAILLE_BIN_MIN * 60_000;
  const nbBins = Math.max(1, Math.ceil(dureeTotaleMs / tailleBinMs));
  const bins = Array.from({ length: nbBins }, () => ({
    positif: 0,
    negatif: 0,
    evenements: [] as { evenement: Event; t: number }[],
  }));
  for (const item of avecTemps) {
    const signe = signeParAction.get(item.evenement.action_id);
    if (signe !== "positif" && signe !== "negatif") continue;
    const index = Math.min(nbBins - 1, Math.floor(item.t / tailleBinMs));
    bins[index][signe] += 1;
    bins[index].evenements.push(item);
  }
  const maxCompte = Math.max(1, ...bins.flatMap((b) => [b.positif, b.negatif]));

  const largeurBin = largeurTrace / nbBins;
  const largeurBarre = Math.max(2, largeurBin - 2);
  const separateurs = Array.from({ length: nbPeriodes - 1 }, (_, i) => (i + 1) / nbPeriodes);
  const marquesTemps = [...new Set([0, ...separateurs.map((f) => f * dureeTotaleMs), dureeTotaleMs])];
  const detail = binSelectionne !== null ? bins[binSelectionne] : null;

  return (
    <div>
      <svg
        viewBox={`0 0 ${LARGEUR_VUE_RECAP} ${hauteur + margeBas}`}
        className="w-full"
        style={{ aspectRatio: `${LARGEUR_VUE_RECAP} / ${hauteur + margeBas}` }}
        role="img"
        aria-label="Impact des actions positives et négatives par tranche de temps, avec les temps morts"
      >
        <line x1={margeGauche} y1={baseline} x2={LARGEUR_VUE_RECAP - margeDroite} y2={baseline} stroke="#c3c2b7" strokeWidth={1} />
        {separateurs.map((frac) => (
          <line
            key={frac}
            x1={margeGauche + frac * largeurTrace}
            y1={margeHaut}
            x2={margeGauche + frac * largeurTrace}
            y2={hauteur}
            stroke="#c3c2b7"
            strokeWidth={1}
            strokeDasharray="3,3"
          />
        ))}
        {bins.map((b, i) => {
          const cx = margeGauche + i * largeurBin + largeurBin / 2;
          const hPositif = (b.positif / maxCompte) * demiHauteur;
          const hNegatif = (b.negatif / maxCompte) * demiHauteur;
          const debutMin = Math.round((i * tailleBinMs) / 60_000);
          const finMin = Math.round(((i + 1) * tailleBinMs) / 60_000);
          const cliquable = b.evenements.length > 0;
          return (
            <g
              key={i}
              onClick={cliquable ? () => setBinSelectionne((s) => (s === i ? null : i)) : undefined}
              style={{ cursor: cliquable ? "pointer" : "default" }}
            >
              <rect x={cx - largeurBin / 2} y={margeHaut} width={largeurBin} height={hauteurBarres} fill="transparent" />
              {b.positif > 0 && (
                <rect x={cx - largeurBarre / 2} y={baseline - hPositif} width={largeurBarre} height={Math.max(1.5, hPositif)} rx={1} fill={COULEUR_AVANTAGE}>
                  <title>{`${debutMin}'–${finMin}' — ${b.positif} action${b.positif > 1 ? "s" : ""} positive${b.positif > 1 ? "s" : ""} (cliquer pour le détail)`}</title>
                </rect>
              )}
              {b.negatif > 0 && (
                <rect x={cx - largeurBarre / 2} y={baseline} width={largeurBarre} height={Math.max(1.5, hNegatif)} rx={1} fill={COULEUR_DESAVANTAGE}>
                  <title>{`${debutMin}'–${finMin}' — ${b.negatif} action${b.negatif > 1 ? "s" : ""} négative${b.negatif > 1 ? "s" : ""} (cliquer pour le détail)`}</title>
                </rect>
              )}
              {binSelectionne === i && (
                <rect
                  x={cx - largeurBin / 2 + 0.5}
                  y={margeHaut + 0.5}
                  width={largeurBin - 1}
                  height={hauteurBarres - 1}
                  fill="none"
                  stroke="#0b0b0b"
                  strokeWidth={1}
                  strokeDasharray="2,2"
                />
              )}
            </g>
          );
        })}
        {tempsMorts.map((tm, i) => {
          const cx = margeGauche + (tm.t / dureeTotaleMs) * largeurTrace;
          const couleur = tm.equipe === "nous" ? COULEUR_AVANTAGE : COULEUR_DESAVANTAGE;
          return (
            <polygon key={i} points={`${cx - 4},0 ${cx + 4},0 ${cx},${margeHaut - 1}`} fill={couleur}>
              <title>{`Temps mort ${tm.equipe === "nous" ? "EVDR" : "adverse"} — ${Math.round(tm.t / 60_000)}'`}</title>
            </polygon>
          );
        })}
        {marquesTemps.map((t) => (
          <text key={t} x={margeGauche + (t / dureeTotaleMs) * largeurTrace} y={hauteur + 11} textAnchor="middle" fontSize={8} fill="#898781">
            {Math.round(t / 60_000)}'
          </text>
        ))}
      </svg>

      {detail && (
        <div className="mt-2 rounded-md border border-slate-200 bg-slate-50 p-2 text-[11px] print:hidden">
          <div className="mb-1 flex items-center justify-between">
            <span className="font-semibold text-slate-600">Détail des actions</span>
            <button type="button" onClick={() => setBinSelectionne(null)} className="text-slate-400 hover:text-slate-700">
              ✕
            </button>
          </div>
          <ul className="space-y-0.5">
            {[...detail.evenements]
              .sort((a, b) => a.t - b.t)
              .map(({ evenement, t }) => {
                const action = actionParId.get(evenement.action_id);
                const qui = evenement.numero !== null ? (nomParNumero.get(evenement.numero) ?? `N°${evenement.numero}`) : "Équipe";
                return (
                  <li
                    key={evenement.event_id}
                    style={{ borderLeftColor: action?.couleur ?? "#94A3B8" }}
                    className="border-l-4 bg-white py-0.5 pl-2"
                  >
                    {Math.round(t / 60_000)}' — {qui} — {action?.libelle ?? evenement.action_id}
                  </li>
                );
              })}
          </ul>
        </div>
      )}
      {!detail && (
        <p className="mt-1 text-[10px] text-slate-400 print:hidden">Cliquer sur une barre pour voir le détail des actions.</p>
      )}
    </div>
  );
}

function GraphiqueProduction({
  joueurs,
  valeurTirs,
  valeurButs,
}: {
  joueurs: JoueurComposition[];
  valeurTirs: (numero: number) => number;
  valeurButs: (numero: number) => number;
}) {
  if (joueurs.length === 0) return null;
  const maxValeur = Math.max(1, ...joueurs.flatMap((j) => [valeurTirs(j.numero), valeurButs(j.numero)]));
  const hauteur = 140;

  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Production offensive par joueur</h2>
        <div className="flex items-center gap-3 text-xs text-slate-600">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COULEUR_TIRS }} />
            Tirs
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COULEUR_BUTS }} />
            Buts
          </span>
        </div>
      </div>
      <div className="impression-pleine-largeur overflow-x-auto rounded-lg border border-slate-200 p-3">
        <div className="flex items-end gap-3" style={{ height: hauteur + 24 }}>
          {joueurs.map((j) => {
            const tirs = valeurTirs(j.numero);
            const buts = valeurButs(j.numero);
            return (
              <div key={j.player_id} className="flex flex-col items-center gap-1" style={{ minWidth: 28 }}>
                <div className="flex items-end gap-0.5" style={{ height: hauteur }}>
                  <div
                    title={`${j.nom} — Tirs : ${tirs}`}
                    className="w-2.5 rounded-t-sm"
                    style={{ height: `${Math.max(2, (tirs / maxValeur) * hauteur)}px`, backgroundColor: COULEUR_TIRS }}
                  />
                  <div
                    title={`${j.nom} — Buts : ${buts}`}
                    className="w-2.5 rounded-t-sm"
                    style={{ height: `${Math.max(2, (buts / maxValeur) * hauteur)}px`, backgroundColor: COULEUR_BUTS }}
                  />
                </div>
                <span className="w-9 truncate text-center text-[9px] text-slate-500" title={j.nom}>
                  {j.nom}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
