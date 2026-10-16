import type { JoueurComposition } from "../db/repository";
import type { Event } from "./match";
import { formatPourcentage, statParId } from "./stats";

export type TypeInsight = "positif" | "negatif" | "neutre";

export interface Insight {
  texte: string;
  type: TypeInsight;
}

/** Tirs minimum pour qu'un % de réussite soit jugé significatif (évite de mettre en avant 1/1). */
const SEUIL_TIRS_SIGNIFICATIF = 3;
/** Nombre de balles perdues à partir duquel c'est signalé comme point de vigilance. */
const SEUIL_BP_ELEVE = 5;

function evenementsDeJoueur(evenements: readonly Event[], numero: number): Event[] {
  return evenements.filter((e) => e.numero === numero);
}

/**
 * Points marquants d'un match, générés par des règles simples sur les statistiques déjà
 * calculées (pas d'IA) — meilleur buteur, joueur le plus efficace, discipline, etc.
 * Fonctionne aussi bien sur un match terminé qu'en cours (les insights reflètent alors
 * l'état actuel).
 */
export function genererInsightsMatch(joueurs: readonly JoueurComposition[], evenements: readonly Event[]): Insight[] {
  const insights: Insight[] = [];
  if (evenements.length === 0) return insights;

  const joueursDeChamp = joueurs.filter((j) => !j.gardien);
  const gardiens = joueurs.filter((j) => j.gardien);

  const buteurs = joueursDeChamp
    .map((j) => ({ joueur: j, buts: statParId("buts", evenementsDeJoueur(evenements, j.numero)) }))
    .filter((l) => l.buts > 0)
    .sort((a, b) => b.buts - a.buts);
  if (buteurs.length > 0) {
    const meilleur = buteurs[0];
    insights.push({
      texte: `${meilleur.joueur.nom} a été le meilleur buteur avec ${meilleur.buts} but${meilleur.buts > 1 ? "s" : ""}.`,
      type: "positif",
    });
  }

  const efficaces = joueursDeChamp
    .map((j) => {
      const evs = evenementsDeJoueur(evenements, j.numero);
      return { joueur: j, tirs: statParId("tirs", evs), reussite: statParId("reussite_tir", evs) };
    })
    .filter((l) => l.tirs >= SEUIL_TIRS_SIGNIFICATIF)
    .sort((a, b) => b.reussite - a.reussite);
  if (efficaces.length > 0) {
    const meilleur = efficaces[0];
    insights.push({
      texte: `${meilleur.joueur.nom} a été le plus efficace au tir : ${formatPourcentage(meilleur.reussite)} de réussite sur ${meilleur.tirs} tirs.`,
      type: "positif",
    });
  }

  const impacts = joueursDeChamp
    .map((j) => ({ joueur: j, impact: statParId("impact", evenementsDeJoueur(evenements, j.numero)) }))
    .filter((l) => l.impact > 0)
    .sort((a, b) => b.impact - a.impact);
  if (impacts.length > 0) {
    const meilleur = impacts[0];
    insights.push({
      texte: `${meilleur.joueur.nom} a eu le plus d'impact sur le match (score de ${meilleur.impact}).`,
      type: "positif",
    });
  }

  const bpEquipe = statParId("balles_perdues", evenements);
  if (bpEquipe >= SEUIL_BP_ELEVE) {
    insights.push({
      texte: `${bpEquipe} ballons perdus sur le match — un point à surveiller.`,
      type: "negatif",
    });
  }

  const evsP1 = evenements.filter((e) => e.periode === 1);
  const evsP2 = evenements.filter((e) => e.periode === 2);
  if (evsP2.length > 0) {
    const butsP1 = statParId("buts", evsP1);
    const butsP2 = statParId("buts", evsP2);
    if (butsP1 !== butsP2) {
      const meilleure = butsP2 > butsP1 ? "2e" : "1re";
      insights.push({
        texte: `Meilleure période offensive : la ${meilleure} mi-temps (${Math.max(butsP1, butsP2)} buts contre ${Math.min(butsP1, butsP2)}).`,
        type: "neutre",
      });
    }
  }

  const sanctionsEquipe = statParId("sanctions", evenements);
  if (sanctionsEquipe > 0) {
    const sanctionnes = joueurs
      .map((j) => ({ joueur: j, sanctions: statParId("sanctions", evenementsDeJoueur(evenements, j.numero)) }))
      .filter((l) => l.sanctions > 0)
      .sort((a, b) => b.sanctions - a.sanctions);
    const pire = sanctionnes[0];
    insights.push({
      texte: `${sanctionsEquipe} sanction${sanctionsEquipe > 1 ? "s" : ""} au total${pire ? `, dont ${pire.sanctions} pour ${pire.joueur.nom}` : ""}.`,
      type: "negatif",
    });
  }

  const gardiensClasses = gardiens
    .map((g) => {
      const evs = evenementsDeJoueur(evenements, g.numero);
      return { joueur: g, tirsSubis: statParId("tirs_subis", evs), pctArretsTotal: statParId("pct_arrets_total", evs) };
    })
    .filter((l) => l.tirsSubis > 0)
    .sort((a, b) => b.pctArretsTotal - a.pctArretsTotal);
  if (gardiensClasses.length > 0) {
    const meilleur = gardiensClasses[0];
    insights.push({
      texte: `${meilleur.joueur.nom} solide dans les buts : ${formatPourcentage(meilleur.pctArretsTotal)} d'arrêts sur ${meilleur.tirsSubis} tirs subis.`,
      type: "positif",
    });
  }

  return insights;
}
