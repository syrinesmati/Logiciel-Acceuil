# Accueil Mediatheque

Logiciel d'accueil pour la Mediatheque de l'Ariana : scan de carte abonne, choix du
motif de visite, statistiques de frequentation. Fonctionne hors ligne, en complement
de Syracuse (qui reste la reference pour la gestion des abonnes).

## Prerequis

- Node.js 22 ou 24, npm.
- Windows recommande (cible de production), mais le developpement fonctionne aussi
  sur macOS/Linux.

## Demarrer en developpement

```bash
npm install
npm run seed   # genere une base de demonstration (~200 abonnes, ~3000 visites)
npm run dev
```

`better-sqlite3` embarque des binaires precompiles Node-API (N-API), stables entre
versions de Node et d'Electron : aucune recompilation (`node-gyp`/Python) n'est
necessaire.

**Si `npm run dev` echoue avec `Error: Electron uninstall`** : certaines
configurations npm (script allowlisting) bloquent le telechargement automatique du
binaire Electron lors de `npm install`. Lancez alors :
```bash
node node_modules/electron/install.js
```
(Une seule fois ; le binaire est mis en cache dans `node_modules/electron/dist/`.)

## Base de donnees

- SQLite, stockee dans le dossier `userData` d'Electron (`%APPDATA%\bibliotheque-accueil`
  en developpement sous Windows).
- Schema et migrations : Drizzle ORM (`src/main/db/schema.ts`,
  `src/main/db/migrations/`). Apres une modification du schema :
  ```bash
  npm run db:generate
  ```
  Les migrations sont appliquees automatiquement au demarrage de l'app.

## Ecran d'accueil

Onglet **Accueil** (ecran par defaut). Scannez une carte (ou tapez le numero au
clavier puis Entree) : la fiche de l'abonne s'affiche (nom, age), avec des
boutons Homme/Femme si le sexe n'est pas renseigne. Choisissez un ou plusieurs
motifs (tuiles cliquables ou touches `1`-`9`), puis validez (`Entree`) ou
annulez (`Echap`). Si le numero est deja passe il y a moins de 5 minutes
(delai configurable), un avertissement demande confirmation avant de
continuer. Si le numero est inconnu, une fenetre "Numero introuvable" s'affiche :
les nouveaux abonnes doivent etre inscrits dans Syracuse, pas depuis ce poste
(refaire un import Syracuse si l'abonne vient d'y etre inscrit). `F2` ouvre une
recherche par nom (tolerante aux variantes arabes). `F3` permet d'enregistrer la
visite d'un visiteur qui n'est pas abonne, identifie par sa CIN (carte d'identite
nationale) plutot qu'un numero d'abonne. Sans action pendant 30 secondes (delai
configurable), l'ecran revient automatiquement au scan.

## Tableau de bord (protege par code PIN)

Onglet **Tableau de bord**. Filtre de periode en haut (aujourd'hui / cette
semaine / ce mois / cette annee / periode personnalisee) qui met a jour tous
les indicateurs et graphiques. Cartes cles (visites, abonnes uniques, moyenne
par jour, comparaison en % avec la periode precedente), evolution dans le
temps, repartition par motif / tranche d'age / sexe, croisement motif x
tranche d'age, heures d'affluence (jour de semaine x heure) et top 10 des
abonnes les plus assidus. L'age est toujours calcule a la date de la visite,
pas a aujourd'hui. Toutes les agregations sont calculees cote main (jamais
toutes les visites chargees dans le renderer).

Deux boutons d'export pour la periode filtree :

- **Excel** : classeur avec une feuille par indicateur (resume, evolution, par
  motif, par tranche d'age, par sexe, motif x tranche d'age, heures
  d'affluence, top 10). Nom de fichier avec la periode, ex.
  `statistiques_2026-09.xlsx`.
- **PDF** : rapport mis en page (en-tete avec le nom de la bibliotheque et la
  periode, indicateurs cles, tous les graphiques, tableau des assidus),
  genere via une page dediee imprimee en PDF (`webContents.printToPDF`). Les
  noms arabes s'affichent correctement (meme police locale que le reste de
  l'app).

## Sauvegarde

La base de donnees est un fichier local sur ce PC (`%APPDATA%\bibliotheque-accueil`) :
**une copie automatique quotidienne est faite dans ce meme dossier**
(`sauvegardes-automatiques/`, 14 derniers jours conserves), mais elle ne protege
pas contre une panne du disque ou du PC. Pour une vraie protection, faites
regulierement (ex. chaque semaine) une **sauvegarde manuelle** depuis
Parametres > Securite > "Sauvegarder maintenant…", vers une cle USB ou un
dossier partage sur le reseau.

**En cas de remplacement du PC** : installez le logiciel normalement sur le
nouveau poste, puis dans Parametres > Securite > "Restaurer une sauvegarde…",
choisissez le fichier `.sqlite` recupere sur l'ancien poste. Un apercu (nombre
d'abonnes/visites) est affiche avant confirmation ; l'operation remplace
toutes les donnees actuelles et redemarre l'application.

## Parametres (protege par code PIN)

Onglet **Parametres**. Au tout premier acces, l'app demande de definir un code
PIN (4 a 6 chiffres, stocke hache — jamais en clair). Ensuite, le PIN est
redemande a chaque acces (pas de session gardee en memoire, c'est un poste
partage). Sous-onglets :

- **General** : nom de la bibliotheque, delai anti-double-scan, delai de
  retour automatique, tranches d'age (ajout/suppression/modification).
- **Motifs** : creation, renommage, choix d'icone et de couleur, activation
  ou desactivation (jamais de suppression physique), reordonnancement par
  glisser-deposer ou par les fleches.
- **Import Syracuse** / **Lignes a corriger** / **Historique des imports** :
  memes ecrans qu'avant, desormais proteges.
- **Securite** : changement du code PIN.

## Import Syracuse

Deux modes de fichier sont detectes automatiquement :

1. **Export structure** (plusieurs colonnes avec en-tetes, ex. `Code-barres,
   Prenom, Nom, Date de naissance, ...`) : un mappage des colonnes est propose
   automatiquement (modifiable) avant l'apercu.
2. **Export une seule colonne** (texte libre par ligne, un abonne par ligne) :
   parseur tolerant par tokens qui detecte numero d'abonne / nom / date /
   telephone / email dans n'importe quel ordre, et repare automatiquement les
   erreurs de saisie de date sans ambiguite (voir `dateRepair.ts`).

Chaque ligne obtient un statut **OK / Corrigee / A verifier / Rejetee** (voir
cahier des charges 4.3). L'ecran d'apercu affiche un tableau filtrable par statut
avant confirmation. L'import ecrit en base dans une seule transaction : upsert
sur `numero_abonne` (Syracuse fait foi, sauf le champ `sexe` jamais fourni par
l'import), et les lignes rejetees (numero introuvable ou en conflit) partent
dans l'ecran **Lignes a corriger** pour une reprise manuelle. Un rapport
(crees / mis a jour / corriges / rejetes) est affiche apres chaque import, avec
un bouton pour exporter les lignes en erreur en Excel (a corriger dans
Syracuse).

Pour tester : `npm run fixture:generer` regenere `fixtures/exemple_import_anonymise.xlsx`
(fichier synthetique reproduisant chaque cas d'erreur du cahier des charges),
utilisable directement depuis l'ecran d'import.

## Tests

```bash
npm test
```

## Build de l'installeur Windows

```bash
npm run build:win
```

Genere un installeur NSIS dans `release/` :
`release/bibliotheque-accueil-<version>-setup.exe`. C'est un installeur classique
(`oneClick: false`, choix du dossier d'installation, raccourci bureau) — aucun
compte administrateur ni composant externe requis. `better-sqlite3` (module
natif) est extrait tel quel de l'archive `.asar` et les migrations SQL sont
copiees a part ; aucune recompilation native n'a lieu au moment du build ni de
l'installation.

**Test d'installation sur poste "propre"** (recommande avant toute mise en
service) : copier `release/*-setup.exe` sur une machine Windows sans Node ni
outils de developpement, l'installer, lancer l'app, verifier qu'elle demarre
hors ligne (pas de connexion reseau necessaire), scanner un numero, consulter
le tableau de bord et exporter un Excel/PDF. La base de donnees se cree au
premier lancement dans `%APPDATA%\bibliotheque-accueil\`.

## Structure du projet

Voir `CLAUDE.md` pour le detail de l'architecture et des conventions.
