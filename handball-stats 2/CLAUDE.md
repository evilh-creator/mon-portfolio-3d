# Projet stats handball EVDRLHB

Outil de saisie et d'analyse statistique de matchs de handball, utilisé en
direct au bord du terrain.

La spécification des données fait autorité : voir @SPEC-donnees.md
Ne jamais modifier le schéma ou le dictionnaire sans mettre ce fichier à jour.

## Règles projet

- Tout doit fonctionner hors ligne.
- Les événements pointent vers un `action_id`, jamais vers une lettre.
- Aucune statistique n'est stockée, tout est recalculé depuis les events.
- Le dictionnaire d'actions et les définitions de statistiques sont des
  données, pas du code. Rien n'est écrit en dur.
- La saisie doit rester utilisable en moins de 3 secondes par événement.
  Toute proposition qui allonge la saisie est à signaler avant d'être
  implémentée.

## Stack

- React + Vite + TypeScript
- Dexie (IndexedDB) pour le stockage local
- Tailwind pour l'interface
- vite-plugin-pwa pour le mode hors ligne et l'installation

## Commandes

```bash
npm run dev      # serveur de développement
npm run build    # build de production
npm run lint     # lint
```

## Conventions

- Les `action_id` et les identifiants de statistiques sont typés, jamais des
  chaînes libres.
- Aucune suppression physique d'événement : `annule = true`.
- Les libellés visibles sont en français.
