import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db/db";
import type { ParticipationJoueur } from "../../db/repository";
import { participationsJoueur } from "../../db/repository";
import { formatPourcentage, statParId } from "../../domain/stats";
import type { StatId } from "../../domain/stats";

export interface ProfilJoueurScreenProps {
  playerId: string;
  onRetour: () => void;
}

const COULEUR_PRINCIPALE = "#2563EB";

interface LigneCarriere {
  libelle: string;
  valeur: (evenements: ParticipationJoueur["evenements"]) => string;
}

const CARRIERE_CHAMP: LigneCarriere[] = [
  { libelle: "Tirs", valeur: (e) => String(statParId("tirs", e)) },
  { libelle: "Buts", valeur: (e) => String(statParId("buts", e)) },
  { libelle: "% réussite", valeur: (e) => formatPourcentage(statParId("reussite_tir", e)) },
  { libelle: "Passes décisives", valeur: (e) => String(statParId("passes_decisives", e)) },
  { libelle: "7m obtenus", valeur: (e) => String(statParId("penalties_obtenus", e)) },
  { libelle: "Balles perdues", valeur: (e) => String(statParId("balles_perdues", e)) },
  { libelle: "Neutr. balle en main", valeur: (e) => String(statParId("neutralisations_subies", e)) },
  { libelle: "Neutr. défensives", valeur: (e) => String(statParId("neutralisations", e)) },
  { libelle: "Contres", valeur: (e) => String(statParId("contres", e)) },
  { libelle: "Passages en force", valeur: (e) => String(statParId("passages_force", e)) },
  { libelle: "Interceptions", valeur: (e) => String(statParId("interceptions", e)) },
  { libelle: "Sanctions", valeur: (e) => String(statParId("sanctions", e)) },
  { libelle: "Actions + attaque", valeur: (e) => String(statParId("actions_attaque", e)) },
  { libelle: "Actions + défense", valeur: (e) => String(statParId("volume_defensif", e)) },
  { libelle: "Impact", valeur: (e) => String(statParId("impact", e)) },
];

const CARRIERE_GARDIEN: LigneCarriere[] = [
  { libelle: "Tirs subis", valeur: (e) => String(statParId("tirs_subis", e)) },
  { libelle: "Arrêts", valeur: (e) => String(statParId("arrets", e)) },
  { libelle: "Hors cadre", valeur: (e) => String(statParId("hors_cadre_subis", e)) },
  { libelle: "Buts encaissés", valeur: (e) => String(statParId("buts_encaisses_gb", e)) },
  { libelle: "% arrêts cadrés", valeur: (e) => formatPourcentage(statParId("pct_arrets", e)) },
  { libelle: "% arrêts total", valeur: (e) => formatPourcentage(statParId("pct_arrets_total", e)) },
];

const COLONNES_MATCHS_CHAMP: readonly StatId[] = ["tirs", "buts", "reussite_tir", "passes_decisives", "balles_perdues", "sanctions", "impact"];
const COLONNES_MATCHS_GARDIEN: readonly StatId[] = ["tirs_subis", "arrets", "buts_encaisses_gb", "pct_arrets", "pct_arrets_total"];

const LIBELLES_COLONNE: Record<StatId, string> = {
  tirs: "Tirs",
  buts: "Buts",
  reussite_tir: "% tir",
  passes_decisives: "PD",
  penalties_obtenus: "7m obt.",
  balles_perdues: "BP",
  bilan_creation: "Bilan création",
  volume_defensif: "Actions + défense",
  tirs_subis_cadres: "Tirs subis cadrés",
  buts_encaisses_gb: "Buts encaissés",
  pct_arrets: "% arrêts cadrés",
  buts_encaisses: "Buts encaissés",
  exclusions: "Exclusions",
  neutralisations_subies: "Neutr. balle en main",
  neutralisations: "Neutr. déf.",
  contres: "Contres",
  passages_force: "Passages force",
  interceptions: "Interceptions",
  sanctions: "Sanctions",
  actions_attaque: "Actions + attaque",
  impact: "Impact",
  tirs_subis: "Tirs subis",
  arrets: "Arrêts",
  hors_cadre_subis: "Hors cadre",
  pct_arrets_total: "% arrêts total",
};

function formatColonne(id: StatId, evenements: ParticipationJoueur["evenements"]): string {
  const v = statParId(id, evenements);
  return id === "reussite_tir" || id === "pct_arrets" || id === "pct_arrets_total" ? formatPourcentage(v) : String(v);
}

export function ProfilJoueurScreen({ playerId, onRetour }: ProfilJoueurScreenProps) {
  const joueur = useLiveQuery(() => db.players.get(playerId), [playerId]);
  const participations = useLiveQuery(() => participationsJoueur(playerId), [playerId]) ?? [];

  if (!joueur) {
    return <div className="p-6 text-slate-500">Chargement…</div>;
  }

  const participationsChamp = participations.filter((p) => !p.gardien);
  const participationsGardien = participations.filter((p) => p.gardien);
  const evenementsChampCarriere = participationsChamp.flatMap((p) => p.evenements);
  const evenementsGardienCarriere = participationsGardien.flatMap((p) => p.evenements);

  const maxButs = Math.max(1, ...participationsChamp.map((p) => statParId("buts", p.evenements)));

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <header className="flex items-center gap-3">
        <button type="button" onClick={onRetour} className="text-sm text-slate-500 hover:text-slate-800">
          ← Accueil
        </button>
        <h1 className="text-xl font-semibold text-slate-900">
          {joueur.nom}
          {joueur.gardien && <span className="ml-2 text-sm text-slate-400">🧤 Gardien</span>}
        </h1>
      </header>

      {participations.length === 0 ? (
        <p className="text-sm text-slate-500">Ce joueur n'a encore participé à aucun match.</p>
      ) : (
        <>
          <p className="text-sm text-slate-500">
            {participations.length} match{participations.length > 1 ? "s" : ""} joué
            {participations.length > 1 ? "s" : ""} — équipe {joueur.equipe}
          </p>

          {participationsChamp.length > 0 && (
            <section className="rounded-lg border border-slate-200 p-4">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Carrière — joueur de champ ({participationsChamp.length} match{participationsChamp.length > 1 ? "s" : ""})
              </h2>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-3">
                {CARRIERE_CHAMP.map((ligne) => (
                  <div key={ligne.libelle} className="flex items-center justify-between">
                    <dt className="text-slate-500">{ligne.libelle}</dt>
                    <dd className="font-mono font-semibold text-slate-900">{ligne.valeur(evenementsChampCarriere)}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {participationsGardien.length > 0 && (
            <section className="rounded-lg border border-slate-200 p-4">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Carrière — gardien ({participationsGardien.length} match{participationsGardien.length > 1 ? "s" : ""})
              </h2>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-3">
                {CARRIERE_GARDIEN.map((ligne) => (
                  <div key={ligne.libelle} className="flex items-center justify-between">
                    <dt className="text-slate-500">{ligne.libelle}</dt>
                    <dd className="font-mono font-semibold text-slate-900">{ligne.valeur(evenementsGardienCarriere)}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {participationsChamp.length > 1 && (
            <section>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Buts par match</h2>
              <div className="overflow-x-auto rounded-lg border border-slate-200 p-3">
                <div className="flex items-end gap-3" style={{ height: 140 }}>
                  {participationsChamp.map((p) => {
                    const buts = statParId("buts", p.evenements);
                    return (
                      <div key={p.match.match_id} className="flex flex-col items-center gap-1" style={{ minWidth: 32 }}>
                        <div className="flex items-end" style={{ height: 110 }}>
                          <div
                            title={`vs ${p.match.adversaire} (${p.match.date}) — ${buts} but${buts > 1 ? "s" : ""}`}
                            className="w-4 rounded-t-sm"
                            style={{ height: `${Math.max(2, (buts / maxButs) * 110)}px`, backgroundColor: COULEUR_PRINCIPALE }}
                          />
                        </div>
                        <span className="w-10 truncate text-center text-[9px] text-slate-500" title={p.match.adversaire}>
                          {p.match.adversaire}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {participationsChamp.length > 0 && (
            <TableauMatchs titre="Détail par match — joueur de champ" participations={participationsChamp} colonnes={COLONNES_MATCHS_CHAMP} />
          )}
          {participationsGardien.length > 0 && (
            <TableauMatchs titre="Détail par match — gardien" participations={participationsGardien} colonnes={COLONNES_MATCHS_GARDIEN} />
          )}
        </>
      )}
    </div>
  );
}

function TableauMatchs({
  titre,
  participations,
  colonnes,
}: {
  titre: string;
  participations: ParticipationJoueur[];
  colonnes: readonly StatId[];
}) {
  return (
    <section>
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{titre}</h2>
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-club-primary text-white">
              <th className="px-2 py-2 text-left">Date</th>
              <th className="px-2 py-2 text-left">Adversaire</th>
              <th className="px-2 py-2 text-left">N°</th>
              {colonnes.map((id) => (
                <th key={id} className="px-2 py-2 text-right whitespace-nowrap">
                  {LIBELLES_COLONNE[id]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...participations].reverse().map((p, index) => (
              <tr key={p.match.match_id} className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                <td className="border-t border-slate-100 px-2 py-1.5">{p.match.date}</td>
                <td className="border-t border-slate-100 px-2 py-1.5">{p.match.adversaire}</td>
                <td className="border-t border-slate-100 px-2 py-1.5">{p.numero}</td>
                {colonnes.map((id) => (
                  <td key={id} className="border-t border-slate-100 px-2 py-1.5 text-right font-mono">
                    {formatColonne(id, p.evenements)}
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
