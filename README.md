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

## Import Syracuse

Onglet **Import Syracuse** de l'app. Deux modes de fichier sont detectes
automatiquement :

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

Genere un installeur NSIS dans `release/`.

## Structure du projet

Voir `CLAUDE.md` pour le detail de l'architecture et des conventions.
