import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { matchsTerminesAvecEvenements } from "../../db/repository";
import type { Equipe } from "../../domain/match";
import { formatPourcentage, statParId } from "../../domain/stats";

export interface EquipeScreenProps {
  onRetour: () => void;
}

const COULEUR_MARQUES = "#16A34A";
const COULEUR_ENCAISSES = "#7C3AED";

type Resultat = "V" | "N" | "D";

function resultatMatch(buts: number, encaisses: number): Resultat {
  if (buts > encaisses) return "V";
  if (buts < encaisses) return "D";
  return "N";
}

const STYLE_RESULTAT: Record<Resultat, string> = {
  V: "bg-green-100 text-green-800",
  N: "bg-slate-100 text-slate-600",
  D: "bg-red-100 text-red-800",
};

export function EquipeScreen({ onRetour }: EquipeScreenProps) {
  const [equipe, setEquipe] = useState<Equipe>("A");
  const matchs = useLiveQuery(() => matchsTerminesAvecEvenements(equipe), [equipe]) ?? [];

  const lignes = matchs.map((m) => {
    const buts = statParId("buts", m.evenements);
    const encaisses = statParId("buts_encaisses", m.evenements);
    return {
      match: m.match,
      evenements: m.evenements,
      buts,
      encaisses,
      tirs: statParId("tirs", m.evenements),
      reussite: statParId("reussite_tir", m.evenements),
      pctArrets: statParId("pct_arrets", m.evenements),
      sanctions: statParId("sanctions", m.evenements),
      resultat: resultatMatch(buts, encaisses),
    };
  });

  const tousEvenements = matchs.flatMap((m) => m.evenements);
  const victoires = lignes.filter((l) => l.resultat === "V").length;
  const nuls = lignes.filter((l) => l.resultat === "N").length;
  const defaites = lignes.filter((l) => l.resultat === "D").length;
  const nbMatchs = lignes.length;

  const butsTotal = statParId("buts", tousEvenements);
  const encaissesTotal = statParId("buts_encaisses", tousEvenements);
  const tirsTotal = statParId("tirs", tousEvenements);
  const reussiteGlobale = statParId("reussite_tir", tousEvenements);
  const pctArretsGlobal = statParId("pct_arrets", tousEvenements);
  const sanctionsTotal = statParId("sanctions", tousEvenements);

  const moyenne = (total: number) => (nbMatchs > 0 ? (total / nbMatchs).toLocaleString("fr-FR", { maximumFractionDigits: 1 }) : "—");

  const maxValeur = Math.max(1, ...lignes.flatMap((l) => [l.buts, l.encaisses]));

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button type="button" onClick={onRetour} className="text-sm text-slate-500 hover:text-slate-800">
            ← Accueil
          </button>
          <h1 className="text-xl font-semibold text-slate-900">Équipe</h1>
        </div>
        <div className="flex gap-1 rounded-md border border-slate-200 p-0.5">
          {(["A", "B"] as const).map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setEquipe(e)}
              className={`rounded px-3 py-1 text-sm ${equipe === e ? "bg-club-primary text-white" : "text-slate-600 hover:bg-slate-100"}`}
            >
              Équipe {e}
            </button>
          ))}
        </div>
      </header>

      {nbMatchs === 0 ? (
        <p className="text-sm text-slate-500">Aucun match terminé pour l'équipe {equipe} pour l'instant.</p>
      ) : (
        <>
          <section className="rounded-lg border border-slate-200 p-4">
            <div className="mb-3 flex items-center gap-3">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Bilan — {nbMatchs} match{nbMatchs > 1 ? "s" : ""}
              </h2>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold text-slate-700">
                {victoires}V {nuls}N {defaites}D
              </span>
            </div>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-4">
              <LigneIndicateur libelle="Buts marqués" valeur={butsTotal} sous={`${moyenne(butsTotal)} / match`} />
              <LigneIndicateur libelle="Buts encaissés" valeur={encaissesTotal} sous={`${moyenne(encaissesTotal)} / match`} />
              <LigneIndicateur libelle="Différence" valeur={butsTotal - encaissesTotal} />
              <LigneIndicateur libelle="Tirs" valeur={tirsTotal} sous={`${moyenne(tirsTotal)} / match`} />
              <LigneIndicateur libelle="Efficacité au tir" valeur={formatPourcentage(reussiteGlobale)} />
              <LigneIndicateur libelle="% arrêts cadrés" valeur={formatPourcentage(pctArretsGlobal)} />
              <LigneIndicateur libelle="Sanctions" valeur={sanctionsTotal} sous={`${moyenne(sanctionsTotal)} / match`} />
            </dl>
          </section>

          <section>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Marqués / encaissés par match</h2>
              <div className="flex items-center gap-3 text-xs text-slate-600">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COULEUR_MARQUES }} />
                  Marqués
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COULEUR_ENCAISSES }} />
                  Encaissés
                </span>
              </div>
            </div>
            <div className="overflow-x-auto rounded-lg border border-slate-200 p-3">
              <div className="flex items-end gap-3" style={{ height: 160 }}>
                {lignes.map((l) => (
                  <div key={l.match.match_id} className="flex flex-col items-center gap-1" style={{ minWidth: 32 }}>
                    <div className="flex items-end gap-0.5" style={{ height: 130 }}>
                      <div
                        title={`vs ${l.match.adversaire} (${l.match.date}) — ${l.buts} marqués`}
                        className="w-3 rounded-t-sm"
                        style={{ height: `${Math.max(2, (l.buts / maxValeur) * 130)}px`, backgroundColor: COULEUR_MARQUES }}
                      />
                      <div
                        title={`vs ${l.match.adversaire} (${l.match.date}) — ${l.encaisses} encaissés`}
                        className="w-3 rounded-t-sm"
                        style={{ height: `${Math.max(2, (l.encaisses / maxValeur) * 130)}px`, backgroundColor: COULEUR_ENCAISSES }}
                      />
                    </div>
                    <span className="w-10 truncate text-center text-[9px] text-slate-500" title={l.match.adversaire}>
                      {l.match.adversaire}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Match par match</h2>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-club-primary text-white">
                    <th className="px-2 py-2 text-left">Date</th>
                    <th className="px-2 py-2 text-left">Adversaire</th>
                    <th className="px-2 py-2 text-center">Résultat</th>
                    <th className="px-2 py-2 text-right">Score</th>
                    <th className="px-2 py-2 text-right">Tirs</th>
                    <th className="px-2 py-2 text-right">% tir</th>
                    <th className="px-2 py-2 text-right">% arrêts cadrés</th>
                    <th className="px-2 py-2 text-right">Sanctions</th>
                  </tr>
                </thead>
                <tbody>
                  {[...lignes].reverse().map((l, index) => (
                    <tr key={l.match.match_id} className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                      <td className="border-t border-slate-100 px-2 py-1.5">{l.match.date}</td>
                      <td className="border-t border-slate-100 px-2 py-1.5">{l.match.adversaire}</td>
                      <td className="border-t border-slate-100 px-2 py-1.5 text-center">
                        <span className={`rounded px-1.5 py-0.5 font-semibold ${STYLE_RESULTAT[l.resultat]}`}>{l.resultat}</span>
                      </td>
                      <td className="border-t border-slate-100 px-2 py-1.5 text-right font-mono">
                        {l.buts} – {l.encaisses}
                      </td>
                      <td className="border-t border-slate-100 px-2 py-1.5 text-right font-mono">{l.tirs}</td>
                      <td className="border-t border-slate-100 px-2 py-1.5 text-right font-mono">{formatPourcentage(l.reussite)}</td>
                      <td className="border-t border-slate-100 px-2 py-1.5 text-right font-mono">{formatPourcentage(l.pctArrets)}</td>
                      <td className="border-t border-slate-100 px-2 py-1.5 text-right font-mono">{l.sanctions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function LigneIndicateur({ libelle, valeur, sous }: { libelle: string; valeur: string | number; sous?: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-slate-500">{libelle}</dt>
      <dd className="text-right font-mono font-semibold text-slate-900">
        {valeur}
        {sous && <span className="ml-1 text-[10px] font-normal text-slate-400">({sous})</span>}
      </dd>
    </div>
  );
}
