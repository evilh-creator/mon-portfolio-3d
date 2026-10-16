# Spécification des données – Outil stats handball EVDRLHB

Version du document : 1.4
Dictionnaire de référence : `v2`

Ce fichier est la source de vérité du modèle de données. Toute évolution du
dictionnaire ou du schéma passe d'abord par ici.

---

## 1. Principes non négociables

**1. L'événement est la donnée source.** Les statistiques ne sont jamais
stockées, elles sont recalculées à la volée depuis la liste d'événements. On
peut ainsi inventer de nouveaux indicateurs et les appliquer rétroactivement
aux anciens matchs.

**2. Un événement pointe vers un `action_id`, jamais vers une lettre.** La
lettre est un raccourci clavier, donc une préférence d'interface. Si `Z` est
un jour réassigné, les matchs passés doivent rester justes.

**3. Le dictionnaire est versionné et rattaché au match.** Un match conserve
la version du dictionnaire en vigueur le jour où il a été saisi. Comparer deux
matchs de versions différentes est possible, mais l'application doit le
signaler.

**4. Tout fonctionne hors ligne.** Saisie et calculs en local. Le réseau ne
sert qu'à la synchronisation et à la diffusion vers d'autres écrans.

**5. Les numéros de maillot changent d'un match à l'autre.** La feuille de
match fait foi. Un joueur est identifié par son `player_id`, et son numéro
n'est qu'une propriété de sa participation à un match donné.

---

## 2. Dictionnaire d'actions `v2`

`portee` indique de qui parle l'événement :
- `nous` – action réalisée par un de nos joueurs
- `adverse` – tir adverse, enregistré via notre gardien

`signe` sert uniquement à colorer l'interface et à construire des agrégats
par défaut. Il n'a aucun effet sur les calculs.

### Attaque

| action_id            | lettre | libellé                      | signe    | portée |
|----------------------|--------|------------------------------|----------|--------|
| `tir_arrete`         | A      | Tir arrêté par le gardien    | negatif  | nous   |
| `but`                | Z      | Tir + but                    | positif  | nous   |
| `passe_decisive`     | E      | Passe décisive               | positif  | nous   |
| `penalty_obtenu`     | R      | Penalty obtenu (7 m)         | positif  | nous   |
| `balle_perdue`       | T      | Balle perdue                 | negatif  | nous   |
| `neutralisation_subie` | Y    | Neutralisation balle en main | negatif  | nous   |
| `tir_hors_cible`     | N      | Tir hors cadre                | negatif  | nous   |
| `exclusion_provoquee` | I     | 2 minutes provoqué           | positif  | nous   |

`tir_arrete` et `tir_hors_cible` distinguent, côté attaque, les deux raisons
pour lesquelles un tir peut ne pas donner de but — symétrique à la distinction
`arret` / `tir_hors_cadre` déjà utilisée côté gardien pour les tirs adverses.
Les deux comptent comme des tirs manqués dans les statistiques (voir §4).

`exclusion_provoquee` est le pendant positif, côté attaquant, d'une exclusion
de 2 minutes obtenue contre l'adversaire (le défenseur adverse écope, pas un
des nôtres) — entre dans `actions_attaque` et `impact` au même titre qu'un but
ou une passe décisive.

### Défense

| action_id                | lettre | libellé                  | signe    | portée |
|--------------------------|--------|---------------------------|----------|--------|
| `neutralisation`         | Q      | Neutralisation           | positif  | nous   |
| `contre`                 | S      | Contre                   | positif  | nous   |
| `passage_force_obtenu`   | D      | Passage en force obtenu  | positif  | nous   |
| `interception`           | F      | Interception             | positif  | nous   |
| `erreur_defensive`       | O      | Erreur défensive         | negatif  | nous   |
| `penalty_concede`        | P      | Pénalty concédé (7 m)    | negatif  | nous   |
| `exclusion_2min`         | G      | Exclusion de 2 minutes   | negatif  | nous   |
| `avertissement`          | H      | Avertissement (carton jaune) | negatif | nous |
| `disqualification`       | J      | Disqualification (carton rouge) | negatif | nous |
| `carton_bleu`            | U      | Carton bleu (rapport)    | negatif  | nous   |

`avertissement` n'entraîne aucune exclusion : c'est un simple marqueur
disciplinaire, affiché en permanence sur la carte du joueur pour le reste du
match. `disqualification` exclut le joueur du reste du match dès sa saisie —
voir §7 pour la règle de disqualification automatique après 3 exclusions.
`carton_bleu` suit la même logique de marqueur permanent qu'`avertissement` :
il ne déclenche par lui-même ni exclusion ni disqualification (en pratique le
carton bleu s'accompagne toujours d'un 2 minutes ou d'un rouge — c'est à
l'utilisateur de saisir l'un ET l'autre, comme sur une vraie feuille de
match). `erreur_defensive` n'a pas d'effet déduit particulier : c'est un
simple compteur d'erreurs, comme `balle_perdue` côté attaque.

`penalty_concede` ouvre une fenêtre d'attente symétrique à `penalty_obtenu`
(voir §7 "Tir de penalty") : seules les trois issues côté gardien restent
cliquables juste après.

### Gardien

| action_id           | lettre | libellé                  | signe    | portée  |
|----------------------|--------|--------------------------|----------|---------|
| `arret`             | W      | Tir adverse arrêté       | positif  | adverse |
| `tir_hors_cadre`    | X      | Tir adverse hors cadre   | positif  | adverse |
| `but_encaisse_6m`   | C      | But encaissé à 6 m       | negatif  | adverse |
| `but_encaisse_9m`   | V      | But encaissé à 9 m       | negatif  | adverse |
| `but_encaisse_cage_vide` | B | But encaissé cage vide   | negatif  | adverse |

`but_encaisse_cage_vide` est le seul événement sans joueur : `numero` vaut
`NULL`. Il compte dans les buts encaissés de l'équipe, jamais dans ceux d'un
gardien, et n'entre dans aucun calcul de pourcentage d'arrêts.

### Changement

| action_id     | lettre | libellé          | signe   | portée |
|---------------|--------|------------------|---------|--------|
| `entree_jeu`  | K      | Entrée en jeu    | neutre  | nous   |
| `sortie_jeu`  | L      | Sortie du jeu    | neutre  | nous   |

Ces deux actions ne mesurent pas une performance : elles horodatent la
présence sur le terrain, et servent uniquement au calcul du temps de jeu
(voir §7 "Temps de jeu"). `signe` vaut `neutre` — la première vraie utilisation
de cette valeur dans le dictionnaire — pour qu'elles n'apparaissent jamais
dans un agrégat positif/négatif par défaut.

Déclenchées avant tout par le glisser-déposer de l'écran de saisie (glisser
une carte du banc sur une carte du terrain, ou sur un emplacement vide), pas
par la grille de boutons habituelle. La lettre reste néanmoins écrite dans le
dictionnaire — comme toute action — et fonctionne au clavier en filet de
secours (`7K` fait entrer le joueur 7).

### Temps mort

| action_id            | lettre | libellé             | signe   | portée  |
|----------------------|--------|---------------------|---------|---------|
| `temps_mort_nous`    | M      | Temps mort EVDR     | neutre  | nous    |
| `temps_mort_adverse` | 0      | Temps mort adverse  | neutre  | adverse |

Comme `entree_jeu`/`sortie_jeu`, ces deux actions n'ont pas de joueur
(`numero = NULL`) et ne mesurent aucune performance. Elles sont déclenchées
par deux boutons dédiés à côté du score, jamais par la grille de boutons ni
par la grammaire numéro+lettre — d'où le choix de `0` comme lettre pour
`temps_mort_adverse` : ce n'est pas un vrai raccourci clavier (seule une
lettre A-Z déclenche une action, `0` est un chiffre traité par la saisie du
numéro), juste un identifiant unique côté données pour une action qui n'a de
toute façon aucune vocation à être tapée au clavier.

Cliquer sur l'un des deux boutons fige le chronomètre principal (à charge du
banc de le relancer à la fin de la minute) et déclenche un décompte d'une
minute affiché sous le bouton concerné — un chronomètre réel, indépendant du
temps de jeu et non pausable, comme un vrai temps mort. L'événement apparaît
dans le fil d'actualité comme n'importe quel autre. Ce décompte est persisté
sur le match (horodatage réel de fin) plutôt que gardé en mémoire locale de
l'écran : naviguer vers un autre écran pendant le temps mort — consulter les
statistiques, typiquement — ne le réinitialise pas.

Tant qu'un temps mort est en cours, les deux boutons sont désactivés : on ne
peut pas en déclencher un second par-dessus. En cas de fausse manip, la
correction passe par le mécanisme habituel d'annulation du dernier événement
(RETOUR ARR.) plutôt que par un bouton dédié — annuler un `temps_mort_nous`
ou `temps_mort_adverse` efface aussi son décompte, ce qui réactive
immédiatement les deux boutons.

### Lettres réservées

`AZERTY` = attaque, `QSDFG` = défense, `WXCVB` = gardien, plus `N` (attaque,
`tir_hors_cible`), `H` (défense, `avertissement`), `J` (défense,
`disqualification`), `K` (changement, `entree_jeu`), `L` (changement,
`sortie_jeu`), `M` (temps mort, `temps_mort_nous`), `I` (attaque,
`exclusion_provoquee`), `O` (défense, `erreur_defensive`), `P` (défense,
`penalty_concede`) et `U` (défense, `carton_bleu`).

Toutes les lettres du clavier sont désormais réellement attribuées.
`temps_mort_adverse` utilise `0` (un chiffre, jamais un raccourci clavier
réel) plutôt qu'une lettre, puisqu'il n'a de toute façon aucune vocation à
être tapé au clavier.

---

## 3. Schéma de données

### `dictionaries`
```
version           texte      "v2"
created_at        date
label             texte      "Dictionnaire V2 – saison 2026"
```

### `actions`
```
dictionary_version  texte    -> dictionaries.version
action_id           texte    "but"
lettre              texte    "Z", unique par version
libelle             texte
categorie           enum     attaque | defense | gardien | changement
portee              enum     nous | adverse
signe               enum     positif | negatif | neutre
ordre               entier   position d'affichage dans sa catégorie
actif               booléen  permet de masquer sans supprimer
```

### `players`
```
player_id       uuid
nom             texte
equipe          enum      A | B
gardien         booléen   valeur par défaut, surchargeable par match
```

### `matches`
```
match_id            uuid
date                date
equipe              enum     A | B
adversaire          texte
type_match          enum?    Coupe de Normandie | Coupe de France | Championnat R1 | Championnat R3
domicile            booléen
dictionary_version  texte    -> dictionaries.version
nb_periodes         entier   2
duree_periode_min   entier   30
statut              enum     config | en_cours | termine
```

`type_match` est facultatif : les matchs existants restent sans type et ne sont
pas reclassés. Le choix du menu « Type de match » est enregistré à la création.
Ce champ non indexé ne nécessite pas de migration IndexedDB.

### `match_players`
Composition de la feuille de match.
```
match_id        uuid
player_id       uuid
numero          entier   0 à 99, unique dans le match
gardien         booléen
ordre           entier   position dans la bande du haut
```

### `events`
La table centrale. Tout le reste en découle.
```
event_id        uuid
match_id        uuid
ordre           entier   séquence de saisie, 1, 2, 3...
periode         entier   1 ou 2
chrono_ms       entier   temps de jeu écoulé dans la période
numero          entier?  numéro du joueur au moment de l'action, NULL si
                         l'événement n'est attribuable à personne
action_id       texte
position        texte?   qualificatif optionnel de zone, NULL si non saisi
saisi_a         datetime horodatage réel, pour l'audit
annule          booléen  suppression logique, jamais de DELETE
```

`numero` est stocké en clair **en plus** de la jointure vers `match_players`.
C'est une dénormalisation volontaire : elle garantit que l'événement reste
lisible même si la composition est corrigée après coup.

---

## 4. Définition des statistiques

Une statistique est une donnée, pas du code. Trois formes suffisent à couvrir
l'intégralité des indicateurs prévus.

### Compteur
```json
{ "id": "buts", "libelle": "Buts", "type": "compteur",
  "actions": ["but"] }
```

### Somme
```json
{ "id": "volume_defensif", "libelle": "Volume défensif", "type": "somme",
  "actions": ["neutralisation", "contre", "passage_force_obtenu", "interception"] }
```

### Ratio
```json
{ "id": "reussite_tir", "libelle": "% réussite", "type": "ratio",
  "numerateur": ["but"],
  "denominateur": ["but", "tir_arrete", "tir_hors_cible"],
  "format": "pourcentage", "decimales": 1 }
```

### Statistiques par défaut

| id                  | type     | définition                                        |
|---------------------|----------|-----------------------------------------------------|
| `tirs`              | somme    | but + tir_arrete + tir_hors_cible                 |
| `buts`              | compteur | but                                               |
| `reussite_tir`      | ratio    | but / (but + tir_arrete + tir_hors_cible)         |
| `passes_decisives`  | compteur | passe_decisive                                    |
| `penalties_obtenus` | compteur | penalty_obtenu                                    |
| `balles_perdues`    | compteur | balle_perdue                                      |
| `bilan_creation`    | ratio    | passe_decisive – balle_perdue (différence)        |
| `volume_defensif`   | somme    | neutralisation + contre + passage_force + interception |
| `tirs_subis_cadres` | somme    | arret + but_encaisse_6m + but_encaisse_9m         |
| `buts_encaisses_gb` | somme    | but_encaisse_6m + but_encaisse_9m                 |
| `pct_arrets`        | ratio    | arret / (arret + but_encaisse_6m + but_encaisse_9m) |
| `buts_encaisses`    | somme    | buts_encaisses_gb + but_encaisse_cage_vide        |
| `exclusions`        | compteur | exclusion_2min                                    |

`buts_encaisses_gb` et `pct_arrets` sont des statistiques **de gardien** et
ignorent les buts cage vide. `buts_encaisses` est une statistique **d'équipe**
et les inclut. Confondre les deux fausserait le pourcentage d'arrêts.

Note : `bilan_creation` est une différence, pas un ratio. Prévoir un quatrième
type `difference` ou l'exprimer comme une somme avec des poids négatifs.

---

## 5. Grammaire de saisie clavier

```
CHIFFRE       accumule dans le tampon numéro, 2 chiffres maximum
LETTRE        termine le numéro, valide et enregistre l'événement
CHIFFRE       saisi juste après une lettre : qualifie la position du tir
ESPACE        démarre / arrête le chronomètre
RETOUR ARR.   annule le dernier événement enregistré
ÉCHAP         vide le tampon numéro sans rien enregistrer
```

### Qualificatif de position

Les chiffres saisis **avant** la lettre désignent le joueur. Le chiffre saisi
**juste après** la lettre qualifie la zone du tir. Il est facultatif : un
événement sans qualificatif est parfaitement valide, `position` vaut `NULL`.

| touche | position    |
|--------|-------------|
| `6`    | 6 m         |
| `9`    | 9 m         |
| `7`    | 7 m         |
| `1`    | aile        |
| `2`    | contre-attaque |

Applicable à toute action de tir, y compris `arret`. C'est ce qui débloque un
`% arrêts` par distance, impossible autrement puisque `arret` seul ne dit rien
de la provenance du tir.

```
9Z      but
9Z6     but à 6 m
1W9     arrêt sur un tir à 9 m
```

La fenêtre de saisie du qualificatif se ferme dès qu'un chiffre est suivi d'un
autre chiffre sans lettre, ou après un court délai. En cas de doute, le
système enregistre sans position plutôt que de risquer une mauvaise
attribution.

Règles :

- Minuscules et majuscules équivalentes.
- La lettre est le délimiteur, aucune validation n'est requise. `1Z` = joueur 1,
  `13Z` = joueur 13.
- Numéro absent de la feuille de match : refus, flash rouge, le tampon est
  vidé. Aucun événement n'est écrit.
- Lettre inconnue ou inactive : refus silencieux, le tampon est conservé.
- Lettre saisie avec un tampon vide : refus, sauf si `gardien_implicite` est
  activé et que la lettre appartient à la catégorie gardien.
- Le chronomètre à l'arrêt n'empêche pas la saisie. `chrono_ms` prend
  simplement la valeur en cours.

### Gardien en jeu

Les gardiens partagent le même panneau "sur le terrain" et le même
glisser-déposer que les joueurs de champ (voir §7 "Temps de jeu") : il n'y a
plus de sélecteur dédié. Le **gardien en jeu** est simplement, à tout instant,
celui des joueurs actuellement sur le terrain qui porte l'indicateur gardien
— `NULL` si l'équipe joue "à 7" (cage vide, aucun gardien sur le terrain).

Cette unification permet nativement de jouer à 6 + 1 gardien ou à 7 joueurs
de champ : c'est la même mécanique d'entrée/sortie dans les deux cas, sans
distinction de catégorie à l'écran.

Le gardien en jeu doit rester visuellement évident en permanence, car un
gardien resté sur le terrain par erreur après un changement attribue
silencieusement les arrêts au mauvais joueur. C'est l'erreur la plus coûteuse
du système : elle ne provoque aucun message d'erreur et ne se détecte qu'après
le match.

### Option `gardien_implicite`

Quand elle est active, une lettre de la catégorie gardien saisie sans numéro
est attribuée automatiquement au gardien en jeu. Un tir adverse passe alors
d'environ trois frappes à une seule, sur les événements les plus fréquents du
match.

Le numéro reste explicitement écrit dans l'événement. Un changement de gardien
en cours de match n'a donc aucun effet rétroactif sur les événements déjà
enregistrés.

`B` fait exception : cet événement n'a jamais de joueur, même quand
`gardien_implicite` est actif. Il s'enregistre avec `numero = NULL`.

---

## 6. Décisions ouvertes

À trancher avant d'écrire l'écran de saisie.

**1. Autres sanctions.** ~~`exclusion_2min` ne couvre ni l'avertissement, ni
le carton rouge.~~ Résolu : `avertissement` (H) et `disqualification` (J)
ajoutés au dictionnaire v2 (voir §2 Défense et §7 Infériorité numérique).

**2. Temps de jeu.** ~~Non traité en v2. Sans lui, aucune statistique ne peut
être ramenée à 30 ou 60 minutes.~~ Résolu : `entree_jeu` (K) et `sortie_jeu`
(L) ajoutés au dictionnaire v2 (voir §2 Changement et §7 Temps de jeu).

---

## 7. Règles déduites de la chronologie

Certaines informations n'ont pas besoin d'être saisies : elles se déduisent de
l'ordre des événements. Elles sont calculées à la lecture, jamais stockées, et
s'appliquent donc rétroactivement aux matchs déjà enregistrés.

### Tir de penalty

Le premier `but`, `tir_arrete` ou `tir_hors_cible` qui suit un
`penalty_obtenu` est le tir du penalty, quel que soit le joueur qui
l'exécute. Ce n'est pas forcément celui qui a obtenu le 7 m.

```
6R,9Z   ->  le but de 9 est un 7 m transformé
```

Conséquence : le `% réussite` peut être décliné en deux versions, avec et sans
les 7 m. Un tireur de penalty voit sinon son pourcentage artificiellement
gonflé.

Limite : si le penalty n'est pas suivi d'un tir enregistré, la règle ne
s'applique à rien. Un qualificatif `7` explicite (`9Z7`) reste prioritaire sur
la déduction.

L'interface doit signaler discrètement, après un `R`, que le prochain tir sera
interprété comme un 7 m, avec la possibilité d'annuler cette interprétation.

### Pénalty concédé

Symétrique du tir de penalty, côté défense cette fois : après un
`penalty_concede` (P), seules trois touches restent cliquables pour la
réponse du gardien — `but_encaisse_6m`, `arret` et `tir_hors_cadre`. Le but
encaissé sur ce 7 m est enregistré comme un `but_encaisse_6m` faute de bucket
dédié à 7 m ; ce n'est pas gênant puisque `pct_arrets`/`pct_arrets_total`
restent des ratios globaux, pas ventilés par distance.

Contrairement au tir de penalty (attribué à qui a exécuté le tir), la réponse
du gardien suit ici la règle habituelle du "gardien en jeu" (§5) : un clic
sans numéro pré-sélectionné l'attribue automatiquement au gardien
actuellement sur le terrain.

### Infériorité numérique

`exclusion_2min` étant horodaté, chaque occurrence ouvre une fenêtre de deux
minutes d'infériorité numérique. Cette information est donc **déjà déductible**
sans aucune saisie supplémentaire.

L'analyse d'équipe (fenêtres d'infériorité numérique agrégées) n'est pas
implémentée pour l'instant, mais c'est une analyse gratuite qui deviendra
disponible dès que le volume de matchs sera suffisant.

Le statut disciplinaire **par joueur**, en revanche, est implémenté et
recalculé en direct depuis les événements, jamais stocké :

- Les `exclusion_2min` d'un même joueur se cumulent si la deuxième survient
  avant la fin de la première : le décompte n'est pas remis à zéro, il est
  prolongé de 2 minutes supplémentaires. Une exclusion qui démarre après la
  fin de la précédente ouvre au contraire une fenêtre neuve.
- Le temps s'accumule sur le temps de jeu (période × durée de période +
  `chrono_ms`), pas sur l'horloge murale : une exclusion continue de courir
  d'une période à l'autre, mais pas pendant que le chronomètre est à l'arrêt.
- Le **2ᵉ** `avertissement` d'un même joueur vaut exclusion de 2 minutes
  automatique, au moment même de ce 2ᵉ carton jaune : il entre dans le même
  comptage et le même cumul que les `exclusion_2min` explicites.
- La **3ᵉ** exclusion de 2 minutes d'un même joueur sur le match (qu'elle
  soit explicite ou déclenchée par un 2ᵉ avertissement) vaut disqualification
  automatique (règle du handball) : aucun événement `disqualification`
  supplémentaire n'est écrit, le statut se déduit du simple comptage.
- `avertissement` reste par ailleurs un marqueur permanent (affiché pour le
  reste du match), sans effet sur le temps de jeu au-delà de la règle
  ci-dessus.

Affichage et disponibilité attendus sur la carte du joueur concerné :

- **Exclusion temporaire** (2 minutes, explicite ou via 2ᵉ avertissement) :
  carte grisée avec décompte du temps restant, mais **reste sélectionnable**
  — uniquement pour lui appliquer une nouvelle `exclusion_2min`, un
  `avertissement` ou une `disqualification`. Toute autre action reste
  refusée tant qu'il n'est pas revenu sur le terrain.
- **Disqualification** (carton rouge explicite ou automatique après 3
  exclusions) : carte grisée avec un petit repère rouge en bas à droite, et
  **devient non sélectionnable** pour le reste du match.
- **Avertissement** : petit repère jaune, dès le premier carton, sans effet
  sur la sélectionnabilité.

### Temps de jeu

Le temps de jeu d'un joueur se déduit de ses `entree_jeu`/`sortie_jeu`,
horodatés comme n'importe quel événement (période × durée de période +
`chrono_ms`) — jamais stocké, recalculé à la lecture, comme tout le reste.

- Les mouvements d'un joueur sont triés par ordre de saisie ; chaque paire
  `entree_jeu` → `sortie_jeu` ouvre et ferme un intervalle. Une `entree_jeu`
  sans `sortie_jeu` qui suit est considérée en cours : l'intervalle se ferme
  à l'instant du calcul (match en cours) ou à la fin programmée du match
  (match terminé).
- Comme pour les exclusions, le temps s'accumule sur le temps de jeu, pas sur
  l'horloge murale : il n'avance pas pendant que le chronomètre est à
  l'arrêt.
- **Aucune entrée n'est écrite d'office, gardiens compris.** La composition de
  départ (habituellement 6 joueurs de champ + 1 gardien, mais rien n'empêche
  7 joueurs de champ pour jouer "à 7", cage vide) se constitue en glissant
  chaque titulaire sur un emplacement libre de la colonne "Sur le terrain" —
  7 emplacements au total, gardiens et joueurs de champ confondus. Tant que ça
  n'a pas été fait, un joueur reste au banc et son temps de jeu reste à zéro.
- Un changement de gardien passe par le même glisser-déposer qu'un changement
  de joueur de champ (glisser le remplaçant depuis le banc sur le gardien en
  place) : une vraie paire `sortie_jeu`/`entree_jeu` horodatée, jamais un
  simple changement d'état d'interface — c'est ce qui rend le temps de jeu des
  gardiens mesurable au même titre que celui des joueurs de champ.
- Un joueur disqualifié (carton rouge, explicite ou automatique) ne peut plus
  recevoir d'`entree_jeu` : impossible de le remettre sur le terrain une fois
  exclu pour le reste du match.
- Un joueur de champ sur le terrain qui devient grisé (`exclusion_2min`,
  `disqualification`, ou 2ᵉ `avertissement` qui vaut exclusion automatique)
  reçoit d'office une `sortie_jeu` au même instant : il rejoint le banc
  plutôt que de rester affiché sur le terrain alors qu'il n'y joue plus.

---

## 8. Contrainte sur la création d'actions

Ajouter une action à chaud a un coût que l'interface doit rendre visible.

Une statistique est définie par une liste d'`action_id`. Une action créée
après coup n'appartient à aucune liste : elle est enregistrée mais n'apparaît
dans aucun total. L'écran de configuration doit donc **avertir dès qu'une
action active n'entre dans aucune statistique**, et proposer de l'ajouter aux
agrégats existants de sa catégorie.

Deuxième effet, plus subtil : une action créée aujourd'hui n'existe pas dans
les matchs passés. Une statistique qui s'appuie dessus vaudra zéro sur tout
l'historique antérieur, ce qui ressemble à une baisse de performance alors
qu'il s'agit d'une absence de mesure. Les graphiques d'évolution doivent
distinguer « zéro » de « non mesuré ».

---

## 9. Note de fin de match (pondération des actions)

Contrairement aux statistiques du §4 (des compteurs), la note sur 10 d'un
joueur est un score **pondéré et ajusté au temps de jeu** — chaque type
d'action ne pèse pas la même chose, et un joueur qui n'a joué que 5 minutes ne
doit pas être mieux (ou pire) noté qu'un titulaire à 60 minutes sur un coup de
chance statistique. Les poids ci-dessous reprennent tels quels la feuille de
référence du club ("Pondération des actions – Handball") ; ce sont des
données de calcul, pas des constantes de code arbitraires — toute évolution
doit d'abord passer par une mise à jour de cette feuille.

### Pondération par action

| action_id              | poids | bloc               |
|-------------------------|-------|--------------------|
| `but`                   | +2,00 | Attaque positif    |
| `passe_decisive`        | +1,50 | Attaque positif    |
| `penalty_obtenu`        | +1,00 | Attaque positif    |
| `exclusion_provoquee`   | +1,00 | Attaque positif    |
| `neutralisation_subie`  | -0,50 | Attaque négatif    |
| `tir_arrete`/`tir_hors_cible` (normal) | -1,00 | Attaque négatif |
| `tir_arrete`/`tir_hors_cible` (tir de penalty, voir §7) | -1,50 | Attaque négatif |
| `balle_perdue`          | -1,50 | Attaque négatif    |
| `neutralisation`        | +0,50 | Défense positif    |
| `contre`                | +0,50 | Défense positif    |
| `passage_force_obtenu`  | +1,00 | Défense positif    |
| `interception`          | +1,00 | Défense positif    |
| `erreur_defensive`      | -1,50 | Défense négatif    |
| `penalty_concede`       | -1,00 | Défense négatif    |
| `exclusion_2min`/`avertissement`/`disqualification`/`carton_bleu` | -1,00 chacune | Défense négatif |
| `arret` (gardien)       | +2,00 | Gardien (impact du gardien uniquement) |
| `tir_hors_cadre` (gardien) | 0  | Gardien |
| `but_encaisse_6m`       | -0,50 | Gardien |
| `but_encaisse_9m`       | -1,00 | Gardien |

Un but/arrêt/but encaissé sur penalty a exactement le même poids que sa
version "normale" (`but` = `but` sur penalty = +2,00 ; `but_encaisse_6m` =
même bucket pour le penalty encaissé, voir §7 "Pénalty concédé") : aucune
distinction de calcul n'est nécessaire pour ces cas. Seul le tir raté après
un `penalty_obtenu` change de poids (-1,50 au lieu de -1,00) — c'est la seule
pondération qui dépend du contexte plutôt que du seul `action_id`.

`carton_rouge_provoqué` (+1,00 sur la feuille de référence, un adverse exclu
définitivement à cause de nous) n'a pas d'équivalent dans le dictionnaire
d'actions aujourd'hui — rien ne trace cet événement — et n'entre donc dans
aucun calcul tant qu'aucune action correspondante n'est ajoutée.

### Score d'impact (T1 à T4) et note /10

Pour un joueur de champ, l'impact brut se décompose en 4 blocs, affichés
chacun dans son propre tableau sur l'écran Statistiques :

1. Actions positives — Attaque
2. Actions positives — Défense
3. Actions négatives — Attaque
4. Actions négatives — Défense

Le tableau **Général** additionne les 4 (T1+T2+T3+T4 = impact brut) et calcule
la note /10, ajustée au temps de jeu réel du joueur :

```
minutes          = temps de jeu (ms) / 60000
impact / 30 min  = (impact brut / minutes) × 30
impact ajusté    = impact / 30 min × (minutes / (minutes + 10))
note / 10        = 5 + impact ajusté / 3          (bornée à [0, 10])
```

Le facteur `minutes / (minutes + 10)` ramène vers 0 le rythme d'un joueur
n'ayant joué que quelques minutes (petit échantillon, donc peu fiable) sans
jamais l'ignorer complètement ; à 0 minute jouée, la note vaut 5 (neutre).
Un gardien reçoit la même note, calculée sur son seul impact gardien (arrêts
et buts encaissés) — sans les 4 tableaux attaque/défense, qui ne le
concernent pas.
