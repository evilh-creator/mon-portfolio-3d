import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { db } from "../../db/db";
import { creerJoueur, creerMatch, derniersNumerosParJoueur, enregistrerCompositionMatch } from "../../db/repository";
import type { Equipe, Match, MatchPlayer, Player, TypeMatch } from "../../domain/match";
import { comparerJoueurs, TYPES_MATCH } from "../../domain/match";

interface LigneComposition {
  player_id: string;
  nom: string;
  gardien: boolean;
  numero: string;
}

function aujourdhui(): string {
  return new Date().toISOString().slice(0, 10);
}

export interface ConfigMatchScreenProps {
  onMatchPret: (matchId: string) => void;
  onRetour: () => void;
}

export function ConfigMatchScreen({ onMatchPret, onRetour }: ConfigMatchScreenProps) {
  const [date, setDate] = useState(aujourdhui);
  const [equipe, setEquipe] = useState<Equipe>("A");
  const [adversaire, setAdversaire] = useState("");
  const [typeMatch, setTypeMatch] = useState<TypeMatch | "">("");
  const [domicile, setDomicile] = useState(true);
  const [nbPeriodes, setNbPeriodes] = useState(2);
  const [dureePeriode, setDureePeriode] = useState(30);

  const [composition, setComposition] = useState<LigneComposition[]>([]);
  const [nouveauNom, setNouveauNom] = useState("");
  const [nouveauGardien, setNouveauGardien] = useState(false);

  const [erreurs, setErreurs] = useState<string[]>([]);
  const [matchCree, setMatchCree] = useState<Match | null>(null);

  const roster = useLiveQuery(() => db.players.where("equipe").equals(equipe).toArray(), [equipe]) ?? [];
  const rosterDisponible = roster
    .filter((joueur) => !composition.some((ligne) => ligne.player_id === joueur.player_id))
    .sort(comparerJoueurs);
  const derniersNumeros = useLiveQuery(() => derniersNumerosParJoueur(equipe), [equipe]);

  function ajouterALaComposition(joueur: Player) {
    const dernierNumero = derniersNumeros?.get(joueur.player_id);
    setComposition((lignes) => [
      ...lignes,
      {
        player_id: joueur.player_id,
        nom: joueur.nom,
        gardien: joueur.gardien,
        numero: dernierNumero !== undefined ? String(dernierNumero) : "",
      },
    ]);
  }

  function retirerDeLaComposition(playerId: string) {
    setComposition((lignes) => lignes.filter((ligne) => ligne.player_id !== playerId));
  }

  function majLigne(playerId: string, patch: Partial<LigneComposition>) {
    setComposition((lignes) =>
      lignes.map((ligne) => (ligne.player_id === playerId ? { ...ligne, ...patch } : ligne)),
    );
  }

  function deplacer(index: number, direction: -1 | 1) {
    setComposition((lignes) => {
      const cible = index + direction;
      if (cible < 0 || cible >= lignes.length) return lignes;
      const copie = [...lignes];
      [copie[index], copie[cible]] = [copie[cible], copie[index]];
      return copie;
    });
  }

  async function ajouterNouveauJoueur() {
    const nom = nouveauNom.trim();
    if (!nom) return;
    const joueur = await creerJoueur(equipe, nom, nouveauGardien);
    ajouterALaComposition(joueur);
    setNouveauNom("");
    setNouveauGardien(false);
  }

  function validerComposition(): string[] {
    const problemes: string[] = [];
    if (!adversaire.trim()) problemes.push("L'adversaire est obligatoire.");
    if (composition.length === 0) problemes.push("La feuille de match est vide.");

    const numeros = new Map<string, number>();
    for (const ligne of composition) {
      if (ligne.numero.trim() === "") {
        problemes.push(`Numéro manquant pour ${ligne.nom}.`);
        continue;
      }
      const n = Number(ligne.numero);
      if (!Number.isInteger(n) || n < 0 || n > 99) {
        problemes.push(`Numéro invalide pour ${ligne.nom} (0 à 99).`);
        continue;
      }
      if (numeros.has(ligne.numero)) {
        problemes.push(`Numéro ${n} attribué deux fois (${numeros.get(ligne.numero)}… et ${ligne.nom}).`);
      }
      numeros.set(ligne.numero, n);
    }

    if (!composition.some((ligne) => ligne.gardien)) {
      problemes.push("Aucun gardien dans la feuille de match.");
    }

    return problemes;
  }

  async function soumettre() {
    const problemes = validerComposition();
    setErreurs(problemes);
    if (problemes.length > 0) return;

    const match = await creerMatch({ date, equipe, adversaire, type_match: typeMatch || undefined, domicile, nb_periodes: nbPeriodes, duree_periode_min: dureePeriode });

    const lignes: Omit<MatchPlayer, "match_id">[] = composition.map((ligne, index) => ({
      player_id: ligne.player_id,
      numero: Number(ligne.numero),
      gardien: ligne.gardien,
      ordre: index,
    }));
    await enregistrerCompositionMatch(match.match_id, lignes);

    setMatchCree(match);
    setComposition([]);
    setAdversaire("");
    setTypeMatch("");
    setErreurs([]);
  }

  if (matchCree) {
    return (
      <div className="mx-auto max-w-xl space-y-4 p-6">
        <button type="button" onClick={onRetour} className="text-sm text-slate-500 hover:text-slate-800">
          ← Accueil
        </button>
        <div className="rounded-lg border border-green-300 bg-green-50 p-4 text-green-900">
          <p className="font-medium">Match créé.</p>
          <p className="text-sm">
            {matchCree.adversaire} — {matchCree.date} ({matchCree.domicile ? "domicile" : "extérieur"}), dictionnaire{" "}
            {matchCree.dictionary_version}.
          </p>
        </div>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            className="rounded-md bg-club-primary px-4 py-2 text-sm font-medium text-white hover:bg-club-primary-dark"
            onClick={() => onMatchPret(matchCree.match_id)}
          >
            Commencer la saisie
          </button>
          <button
            type="button"
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            onClick={() => setMatchCree(null)}
          >
            Configurer un autre match
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-6">
      <header className="flex items-center gap-3">
        <button type="button" onClick={onRetour} className="text-sm text-slate-500 hover:text-slate-800">
          ← Accueil
        </button>
        <h1 className="text-xl font-semibold text-slate-900">Configuration du match</h1>
      </header>

      <section className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          Date
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-slate-700">
          Équipe
          <select
            value={equipe}
            onChange={(e) => setEquipe(e.target.value as Equipe)}
            className="rounded-md border border-slate-300 px-3 py-2"
          >
            <option value="A">A</option>
            <option value="B">B</option>
          </select>
        </label>

        <label className="col-span-2 flex min-w-0 flex-col gap-1 text-sm text-slate-700 sm:col-span-1">
          Adversaire
          <input
            type="text"
            value={adversaire}
            onChange={(e) => setAdversaire(e.target.value)}
            className="min-w-0 rounded-md border border-slate-300 px-3 py-2"
            placeholder="Nom de l'équipe adverse"
          />
        </label>

        <label className="col-span-2 flex min-w-0 flex-col gap-1 text-sm text-slate-700 sm:col-span-1">
          Type de match
          <select
            value={typeMatch}
            onChange={(e) => setTypeMatch(e.target.value as TypeMatch | "")}
            className="min-w-0 rounded-md border border-slate-300 px-3 py-2"
          >
            <option value="">Sélectionner un type</option>
            {TYPES_MATCH.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={domicile} onChange={(e) => setDomicile(e.target.checked)} />
          Match à domicile
        </label>

        <div />

        <label className="flex flex-col gap-1 text-sm text-slate-700">
          Périodes
          <input
            type="number"
            min={1}
            value={nbPeriodes}
            onChange={(e) => setNbPeriodes(Number(e.target.value))}
            className="rounded-md border border-slate-300 px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-slate-700">
          Durée d'une période (min)
          <input
            type="number"
            min={1}
            value={dureePeriode}
            onChange={(e) => setDureePeriode(Number(e.target.value))}
            className="rounded-md border border-slate-300 px-3 py-2"
          />
        </label>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Feuille de match</h2>

        {composition.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="w-10"></th>
                <th className="py-1">Joueur</th>
                <th className="w-20">Numéro</th>
                <th className="w-20">Gardien</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {composition.map((ligne, index) => (
                <tr key={ligne.player_id} className="border-t border-slate-100">
                  <td className="py-1">
                    <button type="button" onClick={() => deplacer(index, -1)} disabled={index === 0} className="px-1 disabled:opacity-30">
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => deplacer(index, 1)}
                      disabled={index === composition.length - 1}
                      className="px-1 disabled:opacity-30"
                    >
                      ↓
                    </button>
                  </td>
                  <td className="py-1">{ligne.nom}</td>
                  <td>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={ligne.numero}
                      onChange={(e) => majLigne(ligne.player_id, { numero: e.target.value })}
                      className="w-16 rounded-md border border-slate-300 px-2 py-1"
                    />
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      checked={ligne.gardien}
                      onChange={(e) => majLigne(ligne.player_id, { gardien: e.target.checked })}
                    />
                  </td>
                  <td>
                    <button type="button" onClick={() => retirerDeLaComposition(ligne.player_id)} className="text-slate-400 hover:text-red-600">
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {rosterDisponible.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {rosterDisponible.map((joueur) => (
              <button
                key={joueur.player_id}
                type="button"
                onClick={() => ajouterALaComposition(joueur)}
                className="rounded-full border border-slate-300 px-3 py-1 text-sm hover:bg-slate-100"
              >
                + {joueur.nom}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2 border-t border-slate-100 pt-3">
          <label className="flex flex-1 flex-col gap-1 text-sm text-slate-700">
            Nouveau joueur (équipe {equipe})
            <input
              type="text"
              value={nouveauNom}
              onChange={(e) => setNouveauNom(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && ajouterNouveauJoueur()}
              className="rounded-md border border-slate-300 px-3 py-2"
              placeholder="Nom du joueur"
            />
          </label>
          <label className="flex items-center gap-2 pb-2 text-sm text-slate-700">
            <input type="checkbox" checked={nouveauGardien} onChange={(e) => setNouveauGardien(e.target.checked)} />
            Gardien
          </label>
          <button
            type="button"
            onClick={ajouterNouveauJoueur}
            className="rounded-md bg-club-primary px-4 py-2 text-sm font-medium text-white hover:bg-club-primary-dark"
          >
            Ajouter
          </button>
        </div>
      </section>

      {erreurs.length > 0 && (
        <ul className="list-disc space-y-1 rounded-md border border-red-300 bg-red-50 p-3 pl-8 text-sm text-red-800">
          {erreurs.map((erreur) => (
            <li key={erreur}>{erreur}</li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={soumettre}
        className="w-full rounded-md bg-club-primary px-4 py-3 text-sm font-medium text-white hover:bg-club-primary-dark"
      >
        Créer le match
      </button>
    </div>
  );
}
