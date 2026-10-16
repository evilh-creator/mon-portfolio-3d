import { useState } from "react";
import type { Route } from "./app/routes";
import { AccueilScreen } from "./features/accueil/AccueilScreen";
import { ConfigMatchScreen } from "./features/config-match/ConfigMatchScreen";
import { EquipeScreen } from "./features/equipe/EquipeScreen";
import { ListeJoueursScreen } from "./features/joueurs/ListeJoueursScreen";
import { ProfilJoueurScreen } from "./features/joueurs/ProfilJoueurScreen";
import { ReglagesScreen } from "./features/reglages/ReglagesScreen";
import { SaisieScreen } from "./features/saisie/SaisieScreen";
import { StatistiquesScreen } from "./features/statistiques/StatistiquesScreen";

function App() {
  const [route, setRoute] = useState<Route>({ name: "accueil" });

  switch (route.name) {
    case "config-match":
      return (
        <ConfigMatchScreen
          onRetour={() => setRoute({ name: "accueil" })}
          onMatchPret={(matchId) => setRoute({ name: "saisie", matchId })}
        />
      );
    case "saisie":
      return (
        <SaisieScreen matchId={route.matchId} onQuitter={() => setRoute({ name: "accueil" })} onNaviguer={setRoute} />
      );
    case "statistiques":
      return (
        <StatistiquesScreen matchId={route.matchId} onRetour={() => setRoute({ name: "accueil" })} onNaviguer={setRoute} />
      );
    case "joueurs":
      return <ListeJoueursScreen onRetour={() => setRoute({ name: "accueil" })} onNaviguer={setRoute} />;
    case "joueur":
      return <ProfilJoueurScreen playerId={route.playerId} onRetour={() => setRoute({ name: "accueil" })} />;
    case "equipe":
      return <EquipeScreen onRetour={() => setRoute({ name: "accueil" })} />;
    case "reglages":
      return <ReglagesScreen onRetour={() => setRoute({ name: "accueil" })} onNaviguer={setRoute} />;
    case "accueil":
    default:
      return <AccueilScreen onNaviguer={setRoute} />;
  }
}

export default App;
