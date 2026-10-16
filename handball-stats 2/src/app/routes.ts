export type Route =
  | { name: "accueil" }
  | { name: "config-match" }
  | { name: "saisie"; matchId: string }
  | { name: "statistiques"; matchId?: string }
  | { name: "joueurs" }
  | { name: "joueur"; playerId: string }
  | { name: "equipe" }
  | { name: "reglages" };
