# CLAUDE.md

Logiciel d'accueil pour la Mediatheque de l'Ariana (Electron/React/SQLite). Outil de
frequentation en complement de Syracuse (SIGB Archimed), qui reste la reference abonnes.
Cahier des charges complet : `prompt_claude_code_bibliotheque_1.md`.

## Commandes

- `npm install` — installe les dependances. `better-sqlite3` utilise des binaires
  N-API precompiles (pas de recompilation node-gyp/Python necessaire). Si le
  telechargement du binaire Electron est bloque par le script-allowlisting de npm,
  voir README > Prerequis.
- `npm run dev` — lance l'app en developpement (electron-vite, HMR renderer).
- `npm run seed` — regenere une base de demonstration (~200 abonnes, ~3000 visites sur
  6 mois) dans le dossier `userData` de dev. A relancer apres chaque `npm run dev` frais
  si la base est vide.
- `npm run db:generate` — genere une migration Drizzle apres modification de
  `src/main/db/schema.ts`.
- `npm test` — tests Vitest (parseur d'import, normalisation arabe, age/tranches, stats).
- `npm run typecheck` / `npm run lint` / `npm run format` — verifications avant chaque
  fin de phase.
- `npm run build:win` — build + genere l'installeur Windows (NSIS) via electron-builder.
- `npm run fixture:generer` — regenere `fixtures/exemple_import_anonymise.xlsx` (mode
  colonne unique, tous les cas d'erreur du 4.3) depuis `scripts/genererFixtureImport.ts`.

## Architecture

- **Process main** (`src/main/`) : seul endroit qui touche SQLite (better-sqlite3 +
  Drizzle ORM). Handlers IPC dans `src/main/ipc/`, logique metier dans
  `src/main/services/`, acces DB dans `src/main/db/`.
- **Preload** (`src/preload/`) : expose une API typee (`window.api`) via
  `contextBridge`. `contextIsolation: true`, `nodeIntegration: false` — le renderer
  n'importe jamais `electron` ni les modules Node directement.
- **Renderer** (`src/renderer/src/`) : React 19 + Tailwind v4 + shadcn/ui (composants
  copies dans `components/ui/`, pas de package npm). Ecrans dans `screens/`.
- **Partage** (`src/shared/`) : types et constantes IPC utilises par main, preload et
  renderer (`@shared/*`).
- **`AbonneSource`** (`src/main/services/abonneSource.ts`) : couche d'abstraction
  volontaire devant la table `abonnes`. Aujourd'hui = SQLite local alimente par import
  Syracuse ; une future connexion directe (SIP2 / web service) devra implementer la
  meme interface sans toucher au reste de l'app.
- Suppression logique uniquement (`actif = false`) pour `abonnes` et `motifs` : on ne
  supprime jamais une ligne referencee par des visites (historique de stats).
- **Import Syracuse** (`src/main/services/importParser/`) : fonctions pures et testables
  independamment de la DB — `lecteurFichier` (xlsx/csv -> lignes brutes), `detectionFormat`
  (colonne unique vs mapping de colonnes + suggestion de mappage), `parseurColonneUnique`
  (tokenizer tolerant), `parseurColonnesMappees`, `dateRepair` (reparation de dates),
  `conflits` (numero en conflit, fichier + base), `exportErreurs` (classeur Excel des
  lignes en erreur). `services/importService.ts` orchestre ces fonctions et ecrit en
  base (transaction unique). IPC dans `ipc/import.ts`, ecrans dans
  `renderer/src/screens/Import/`.

## Donnees et confidentialite

- Le fichier `Archimed.Search.Export_639260300114978837_35379.xlsx` a la racine est un
  **vrai** export Syracuse (donnees personnelles reelles) fourni pour construire et
  tester le parseur d'import. Il est dans `.gitignore` et **ne doit jamais etre commite
  ni copie dans `fixtures/`**. Le fixture versionne (`fixtures/exemple_import_anonymise.xlsx`,
  phase 2) est entierement synthetique.
- Ce fichier reel s'est revele etre un export **structure** (colonnes `Code-barres,
  Prenom, Nom, Date de naissance, Ville, Inscrit a, Email`), different du format
  "une seule colonne de texte" decrit dans le cahier des charges section 4.3. Les deux
  modes d'import (mapping de colonnes structure + parseur tolerant par tokens) sont
  neanmoins tous les deux implementes, comme demande.
- `numero_abonne` est stocke en `text` sans longueur fixe (les vrais codes-barres
  observes font 8-9 chiffres, pas 5 comme dans l'exemple du cahier des charges).
- Les noms d'abonnes melangent ecriture arabe et latine dans les vraies donnees : la
  normalisation de recherche (`services/nomArabe.ts`) et l'affichage (`dir="auto"`)
  doivent bien fonctionner pour les deux, pas seulement l'arabe.

## Piege connu du bundler (process main)

Le plugin CJS-shim d'electron-vite (`renderChunk`, format ESM) localise "le dernier
import" du bundle final avec une **regex sur le texte brut**, pas un vrai parseur.
Si une chaine de caracteres du code source (ex: un nom de feuille Excel) contient le
mot `import` immediatement suivi d'un guillemet fermant (ex: `'Erreurs import'`), la
regex la confond avec une instruction `import` et insere le shim CJS en plein milieu
du fichier, cassant tout le bundle main avec une erreur esbuild `Unterminated string
literal` sans rapport apparent avec la vraie cause. Deja rencontre avec le nom de
feuille `'Erreurs import'` dans `exportErreurs.ts` (renomme en `'Lignes a corriger'`).
**Evitez d'avoir le mot "import" juste avant un guillemet fermant dans une chaine du
code du process main.**

## Conventions

- TypeScript strict partout. Alias : `@main/*`, `@renderer/*`, `@shared/*`.
- Noms de variables/fonctions/commentaires en francais (coherent avec le domaine
  metier et l'utilisateur final).
- Zod pour valider toute entree IPC et tout formulaire.
- Toute agregation statistique se fait en SQL cote main (`services/stats.ts`), jamais
  en chargeant toutes les visites dans le renderer.
- Polices arabes embarquees localement dans `src/renderer/src/assets/fonts/` (Noto
  Sans Arabic, subsets arabic+latin telecharges depuis Google Fonts) — jamais de CDN,
  l'app doit fonctionner hors ligne.

## Etat d'avancement

Voir le plan approuve dans la conversation Claude Code pour le detail des 7 phases.
Phase 1 (initialisation) et phase 2 (import Syracuse) terminees. Phase 3 (ecran
d'accueil) a venir.
