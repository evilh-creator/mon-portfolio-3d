import { useLiveQuery } from "dexie-react-hooks";
import type { Route } from "../../app/routes";
import { db } from "../../db/db";
import { supprimerJoueur } from "../../db/repository";
import { comparerJoueurs } from "../../domain/match";

export interface ListeJoueursScreenProps {
  onRetour: () => void;
  onNaviguer: (route: Route) => void;
}

export function ListeJoueursScreen({ onRetour, onNaviguer }: ListeJoueursScreenProps) {
  const joueurs = useLiveQuery(() => db.players.toArray(), []) ?? [];
  const tries = [...joueurs].sort(comparerJoueurs);

  function handleSupprimer(nom: string, playerId: string) {
    const confirme = window.confirm(
      `Supprimer ${nom} de la liste des joueurs ?\n\nSon historique de matchs déjà saisi est conservé (numéro, statistiques), mais son nom n'apparaîtra plus dessus.`,
    );
    if (!confirme) return;
    void supprimerJoueur(playerId);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <header className="flex items-center gap-3">
        <button type="button" onClick={onRetour} className="text-sm text-slate-500 hover:text-slate-800">
          ← Accueil
        </button>
        <h1 className="text-xl font-semibold text-slate-900">Joueurs</h1>
      </header>

      {tries.length === 0 ? (
        <p className="text-sm text-slate-500">Aucun joueur enregistré pour l'instant.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {tries.map((j) => (
            <div
              key={j.player_id}
              className="flex items-center gap-0.5 rounded-lg border border-slate-200 py-1 pr-1 pl-3 text-sm hover:border-slate-400 hover:bg-slate-50"
            >
              <button
                type="button"
                onClick={() => onNaviguer({ name: "joueur", playerId: j.player_id })}
                className="flex items-center gap-2"
              >
                {j.nom}
                {j.gardien && <span className="text-xs text-slate-400">🧤</span>}
              </button>
              <button
                type="button"
                onClick={() => handleSupprimer(j.nom, j.player_id)}
                title="Supprimer ce joueur"
                aria-label={`Supprimer ${j.nom}`}
                className="ml-1 rounded px-1.5 py-0.5 text-slate-300 hover:bg-red-50 hover:text-red-600"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
