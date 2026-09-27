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
- **Ecran d'accueil** (`src/main/services/accueilService.ts` + `renderer/src/screens/Accueil/`) :
  machine a etats simple (`scan` / `confirmationDoubleScan` / `fiche` /
  `inscriptionRapide` / `confirmationVisite`) pilotee par `AccueilScreen.tsx`.
  Anti-double-scan et retour automatique lisent leur delai dans `parametres`
  (`services/parametresService.ts`, valeurs par defaut posees au premier lancement).
  Motifs par defaut poses de la meme facon (`services/motifsService.ts`) —
  necessaire car `npm run seed` est un script de dev, pas le premier lancement reel.
  Nettoyage de la saisie douchette dans `services/scanUtils.ts`.
- **Parametres** (`services/pinService.ts`, `parametresService.ts`, `motifsService.ts`
  + `renderer/src/screens/Parametres/`) : zone protegee par un code PIN (scrypt +
  sel, jamais stocke en clair, jamais verifie a nouveau une fois la zone quittee —
  pas de session persistante, cf. `ParametresGate.tsx`). Le PIN se definit tout
  seul au tout premier acces (pas de vraie authentification, juste une barriere
  contre la manipulation par un usager). CRUD complet des motifs (creation,
  renommage, icone/couleur, activation, reordonnancement drag & drop + fleches),
  tranches d'age et delais stockes en JSON/texte dans `parametres`, onglets Import
  Syracuse / Lignes a corriger / Historique reutilisent les ecrans de la phase 2.
- **Tableau de bord** (`services/statsService.ts`, `statsCalculs.ts`, `chargeurStats.ts`,
  `periode.ts` + `renderer/src/screens/Dashboard/`) : `chargeurStats.ts` charge en
  une requete SQL les visites *de la periode filtree uniquement* (jamais toutes les
  visites) avec juste ce qu'il faut (abonne, motifs) ; tout le calcul (indicateurs,
  evolution, repartitions, croisement motif x age, heatmap, top 10) est ensuite fait
  par des fonctions JS pures dans `statsCalculs.ts`, testables sans DB. Choix
  deliberement different d'agregations SQL pures : l'age a la date de la visite et
  les bornes de jour locales sont plus surs a calculer avec `calculerAge`/Date locale
  qu'avec les fonctions de date de SQLite sur des timestamps UTC. Le renderer ne
  recoit jamais que le resultat agrege final (`TableauDeBord`). Protege par le meme
  `ParametresGate` que les Parametres, mais navigation separee ("Tableau de bord").
- **Export statistiques** (`services/exportStats.ts`, `exportPdf.ts` +
  `renderer/src/screens/Rapport/RapportPage.tsx`) : l'Excel est un classeur
  multi-feuilles construit directement depuis `TableauDeBord`. Le PDF reutilise
  les MEMES composants de graphique que le tableau de bord (coherence visuelle
  garantie) sur une page de rapport dediee, chargee via une route par hash
  (`#/rapport?type=...`, voir `main.tsx`) dans une `BrowserWindow` invisible ;
  la page signale sa fin de rendu (`ipcRenderer.send('rapport:signaler-pret')`,
  apres un `requestAnimationFrame` + delai pour laisser Recharts terminer sa
  passe de mesure) avant que le main appelle `webContents.printToPDF`. Pas de
  second point d'entree Vite : plus simple a maintenir qu'une config MPA.
- **Packaging** (`electron-builder.yml`, `build/icon.png`) : cible NSIS
  (`npm run build:win`). Deux points delicats propres a ce projet :
  - `better-sqlite3` est un module natif (N-API) : son `.node` ne peut pas se
    charger depuis l'interieur d'un `.asar`, d'ou `asarUnpack:
    node_modules/better-sqlite3/**`. Verifie apres chaque build que
    `release/win-unpacked/resources/app.asar.unpacked/node_modules/better-sqlite3/`
    contient bien `prebuilds/` (sinon l'app crashe au demarrage sur la machine
    cible, erreur silencieuse en dehors de `dev`).
  - Les migrations Drizzle (`src/main/db/migrations/*.sql`) ne sont pas dans le
    bundle JS : `extraResources` les copie vers `resources/migrations/`, lu par
    `main/index.ts` via `process.resourcesPath` quand `app.isPackaged`.
  - `npmRebuild: false` : le binaire N-API precompile suffit, aucune
    recompilation native (node-gyp/Python) requise ni souhaitee sur la machine
    de build.

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
- Les statistiques se calculent cote main a partir des seules visites de la periode
  filtree (jamais "toutes les visites"), et seul le resultat agrege est renvoye au
  renderer (voir `services/statsCalculs.ts`).
- Polices arabes embarquees localement dans `src/renderer/src/assets/fonts/` (Noto
  Sans Arabic, subsets arabic+latin telecharges depuis Google Fonts) — jamais de CDN,
  l'app doit fonctionner hors ligne.

## Etat d'avancement

Voir le plan approuve dans la conversation Claude Code pour le detail des 7 phases.
Les 7 phases sont terminees (initialisation, import Syracuse, ecran d'accueil,
parametres + code PIN, tableau de bord, export Excel/PDF, packaging Windows).
Navigation : Accueil (libre) / Tableau de bord (protege par PIN, avec boutons
d'export Excel/PDF) / Parametres (protege par PIN, sous-onglets General,
Motifs, Import Syracuse, Lignes a corriger, Historique, Securite).
