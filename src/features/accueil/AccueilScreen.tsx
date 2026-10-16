import { useLiveQuery } from "dexie-react-hooks";
import { FondLignes } from "../../app/FondLignes";
import type { Route } from "../../app/routes";
import { matchsReprenables, matchsTermines } from "../../db/repository";

export interface AccueilScreenProps {
  onNaviguer: (route: Route) => void;
}

export function AccueilScreen({ onNaviguer }: AccueilScreenProps) {
  const reprises = useLiveQuery(matchsReprenables, []) ?? [];
  const termines = useLiveQuery(matchsTermines, []) ?? [];

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      <header className="relative flex items-center justify-between gap-4 overflow-hidden rounded-xl border border-slate-200 bg-white px-5 py-4">
        <FondLignes />
        <div className="relative z-10 flex items-center gap-4">
          <img src="/logo-club.png" alt="Entente Handball Val de Reuil Louviers" className="h-16 w-auto" />
          <div>
            <h1 className="text-2xl font-bold text-club-primary">EVDRLHB — Stats handball</h1>
            <p className="text-sm text-slate-500">Saisie et analyse de matchs, hors ligne.</p>
          </div>
        </div>
        <img src="/logo-ffhb.webp" alt="Fédération Française de Handball" className="relative z-10 h-12 w-auto" />
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <CarteMenu
          titre="Nouveau match"
          description="Configurer un match et sa feuille"
          onClick={() => onNaviguer({ name: "config-match" })}
        />
        <CarteMenu
          titre="Match en cours"
          description={reprises.length > 0 ? `${reprises.length} en attente` : "Aucun pour l'instant"}
          onClick={() => reprises[0] && onNaviguer({ name: "saisie", matchId: reprises[0].match_id })}
          desactive={reprises.length === 0}
        />
        <CarteMenu
          titre="Statistiques"
          description="Récap et analyse des matchs"
          onClick={() => onNaviguer({ name: "statistiques" })}
        />
        <CarteMenu
          titre="Joueurs"
          description="Profil et historique par joueur"
          onClick={() => onNaviguer({ name: "joueurs" })}
        />
        <CarteMenu
          titre="Équipe"
          description="Bilan et tendances sur la saison"
          onClick={() => onNaviguer({ name: "equipe" })}
        />
        <CarteMenu
          titre="Réglages"
          description="Touches, couleurs, dictionnaire"
          onClick={() => onNaviguer({ name: "reglages" })}
        />
      </section>

      {reprises.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Matchs en attente</h2>
          <ul className="space-y-1.5">
            {reprises.map((match) => (
              <li
                key={match.match_id}
                className="flex items-center justify-between rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm"
              >
                <span>
                  vs {match.adversaire} — {match.date} ({match.statut === "en_cours" ? "en cours" : "config"})
                </span>
                <button
                  type="button"
                  onClick={() => onNaviguer({ name: "saisie", matchId: match.match_id })}
                  className="rounded-md border border-amber-400 px-3 py-1 text-amber-900 hover:bg-amber-100"
                >
                  Reprendre
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {termines.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Matchs terminés</h2>
          <ul className="space-y-1.5">
            {termines.map((match) => (
              <li
                key={match.match_id}
                className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <span>
                  vs {match.adversaire} — {match.date} ({match.domicile ? "domicile" : "extérieur"})
                </span>
                <button
                  type="button"
                  onClick={() => onNaviguer({ name: "statistiques", matchId: match.match_id })}
                  className="rounded-md border border-slate-300 px-3 py-1 text-slate-700 hover:bg-slate-100"
                >
                  Voir les stats
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

interface CarteMenuProps {
  titre: string;
  description: string;
  onClick: () => void;
  desactive?: boolean;
}

function CarteMenu({ titre, description, onClick, desactive = false }: CarteMenuProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={desactive}
      className="flex flex-col items-start gap-1 rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm transition-colors hover:border-club-primary hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:bg-white"
    >
      <span className="text-sm font-semibold text-slate-900">{titre}</span>
      <span className="text-xs text-slate-500">{description}</span>
    </button>
  );
}
