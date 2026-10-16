import { useState } from "react";
import type { Route } from "../../app/routes";
import { genererMatchDemo } from "../../dev/genererMatchDemo";
import { importerRosterReel } from "../../dev/importerRosterReel";

export interface ReglagesScreenProps {
  onRetour: () => void;
  onNaviguer: (route: Route) => void;
}

/** Écran à construire : édition des touches, couleurs et libellés du dictionnaire d'actions. */
export function ReglagesScreen({ onRetour, onNaviguer }: ReglagesScreenProps) {
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [import_, setImport] = useState<{ enCours: boolean; message: string | null }>({ enCours: false, message: null });

  async function genererDemo() {
    setEnCours(true);
    setErreur(null);
    try {
      const matchId = await genererMatchDemo();
      onNaviguer({ name: "statistiques", matchId });
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Échec de la génération.");
      setEnCours(false);
    }
  }

  async function importerRoster() {
    setImport({ enCours: true, message: null });
    try {
      const nb = await importerRosterReel();
      setImport({ enCours: false, message: `${nb} joueurs importés (ou déjà présents).` });
    } catch (e) {
      setImport({ enCours: false, message: e instanceof Error ? e.message : "Échec de l'import." });
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <header className="flex items-center gap-3">
        <button type="button" onClick={onRetour} className="text-sm text-slate-500 hover:text-slate-800">
          ← Accueil
        </button>
        <h1 className="text-xl font-semibold text-slate-900">Réglages</h1>
      </header>
      <p className="text-sm text-slate-500">
        Écran à venir : personnaliser les touches, couleurs et libellés du dictionnaire d'actions.
      </p>

      <section className="space-y-2 rounded-lg border border-slate-200 p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Effectif</h2>
        <p className="text-sm text-slate-500">
          Charge l'effectif complet du club (39 joueurs dont les gardiens) pour ne pas avoir à les ressaisir un par
          un à chaque match. Sans effet si déjà importé (réutilise les joueurs existants par nom).
        </p>
        <button
          type="button"
          onClick={importerRoster}
          disabled={import_.enCours}
          className="rounded-md bg-club-primary px-4 py-2 text-sm font-medium text-white hover:bg-club-primary-dark disabled:opacity-50"
        >
          {import_.enCours ? "Import…" : "Importer l'effectif du club"}
        </button>
        {import_.message && <p className="text-sm text-slate-600">{import_.message}</p>}
      </section>

      <section className="space-y-2 rounded-lg border border-slate-200 p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Développement</h2>
        <p className="text-sm text-slate-500">
          Génère un match fictif complet (12 joueurs dont 2 gardiens, score 30-24) pour visualiser l'écran
          Statistiques sans ressaisir un match entier. Les joueurs "démo" sont réutilisés s'ils existent déjà.
        </p>
        <button
          type="button"
          onClick={genererDemo}
          disabled={enCours}
          className="rounded-md bg-club-primary px-4 py-2 text-sm font-medium text-white hover:bg-club-primary-dark disabled:opacity-50"
        >
          {enCours ? "Génération…" : "Générer un match de démo"}
        </button>
        {erreur && <p className="text-sm text-red-700">{erreur}</p>}
      </section>
    </div>
  );
}
