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

(Detaille en phase 2.) Deux modes d'import seront disponibles depuis l'ecran
Parametres > Import :

1. **Export structure** (plusieurs colonnes avec en-tetes) : mappage manuel des
   colonnes vers les champs de l'app.
2. **Export une seule colonne** (texte libre par ligne) : parseur tolerant qui
   detecte numero d'abonne / date / telephone / email et signale les lignes
   douteuses pour correction manuelle.

Un rapport (crees / mis a jour / corriges / a verifier) est genere a chaque import,
exportable en Excel pour transmettre les corrections a faire dans Syracuse.

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
