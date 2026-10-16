import { trouverOuCreerJoueur } from "../db/repository";
import type { Equipe } from "../domain/match";

/**
 * Effectif réel du club, transcrit depuis la liste fournie. Un seul groupe (pas de distinction
 * A/B) : tous rattachés à "A" en base, l'écran Joueurs les affiche à plat, gardiens en tête.
 * Rejouable sans dupliquer : chaque joueur est retrouvé par nom s'il existe déjà.
 */
const ROSTER_REEL: readonly (readonly [nom: string, gardien: boolean])[] = [
  ["Thomas BOUVOT", false],
  ["Alexandre BOUVOT", false],
  ["Antoine BOUVOT", false],
  ["Théo GERVAIS", false],
  ["Théo LOYAUTE", false],
  ["Florent POMPILUS", false],
  ["Jean-Kévin MANDIANGU", false],
  ["Mavrick AUBRY", false],
  ["Hugo PASQUALINI", true],
  ["Alban COGNIEN", true],
  ["Damien CATEL", false],
  ["Benjamin JAUNET", false],
  ["Malo BOCAGE", false],
  ["Yanis COHAN", false],
  ["Fabien COHAN", true],
  ["Cyril TAHON", false],
  ["Julien SEGOUIN", false],
  ["Jordi FICHET-GARCIA", false],
  ["Scotty BAUDU", false],
  ["Médéric MEUNIER", false],
  ["Gabriel LEBER TEJERA", true],
  ["Jydin POUEHE", false],
  ["Adrien RONDEAU", false],
  ["Edouard LAMIEL", false],
  ["Kilian CHARDON", false],
  ["Gabriel FICHET", false],
  ["Serge Maïck OKOKO ELENGA", false],
  ["Loan CAPON", false],
  ["Ronni SILVA", true],
  ["Kilian LIGNY", false],
  ["Florentin MORIN", false],
  ["Jules VALLE", false],
  ["Florian LANCELEVEE", false],
  ["Nathan LESENNE", false],
  ["BELKAIDI Hatim", true],
  ["LAGUEL Kévin", false],
  ["CARLES Louis", false],
  ["REY Stéphane", false],
  ["RAYNEL Romain", true],
];

export async function importerRosterReel(): Promise<number> {
  const equipe: Equipe = "A";
  for (let i = 0; i < ROSTER_REEL.length; i++) {
    const [nom, gardien] = ROSTER_REEL[i];
    await trouverOuCreerJoueur(equipe, nom, gardien, i);
  }
  return ROSTER_REEL.length;
}
