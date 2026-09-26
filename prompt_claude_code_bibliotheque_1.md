# Projet : Logiciel d'accueil pour bibliothèque

> Avant d'écrire la moindre ligne de code : lis tout ce document, pose-moi tes questions si quelque chose est ambigu, puis propose-moi un plan d'implémentation détaillé. Attends ma validation avant de commencer.

## 1. Contexte

La bibliothèque **Médiathèque de l'Ariana** a besoin d'un logiciel d'accueil installé sur **un seul poste Windows** à l'entrée. Quand un abonné arrive, l'employé scanne le code-barres de sa carte avec une douchette USB, puis sélectionne le ou les motifs de sa visite (prêt, retour, lecture sur place, recherche, Internet…). Toutes les visites sont enregistrées et alimentent un tableau de bord de statistiques.

### Lien avec Syracuse

La bibliothèque utilise déjà **Syracuse** (SIGB d'Archimed, installé en local) pour gérer les abonnés, le catalogue, les prêts et les retours. **Syracuse reste la référence pour les abonnés.** Notre logiciel ne le remplace pas : c'est un **outil de fréquentation** à côté de Syracuse.

- Les abonnés sont importés régulièrement depuis un export de Syracuse (voir 4.3).
- Pas de gestion complète des abonnés dans notre logiciel. Seulement : inscription rapide de dépannage, compléter une fiche (ex. sexe), recherche.
- Pas de connexion directe à Syracuse pour cette version. Prévois quand même une couche `AbonneSource` isolée, pour pouvoir brancher plus tard une connexion directe (web service ou SIP2) sans tout réécrire.

### Cartes et codes-barres

- Les cartes portent un **code-barres 1D classique** qui contient **le numéro d'abonné** (ex. `43180`).
- Le numéro scanné = le numéro de l'abonné dans Syracuse. Pas de table de correspondance nécessaire.
- La saisie manuelle du numéro au clavier doit aussi fonctionner (abonné qui a oublié sa carte, carte abîmée).

### Utilisation

C'est un logiciel **pour un vrai client, utilisé au quotidien** : il doit être fiable, simple à utiliser pour un personnel non technique, fonctionner **hors ligne**, et s'installer via un simple installeur `.exe`.

L'interface est **en français**, mais **les noms des abonnés sont en arabe** (voir 5.1).

## 2. Stack technique (imposée)

- **Electron** avec **electron-vite** (template React + TypeScript)
- **React 18+ / TypeScript** en mode `strict`
- **Tailwind CSS + shadcn/ui** pour l'interface
- **SQLite** via **better-sqlite3** + **Drizzle ORM** (avec migrations versionnées)
- **Recharts** pour les graphiques
- **exceljs** pour lire/écrire les fichiers Excel, **papaparse** pour les CSV
- **date-fns** (locale `fr`) pour les dates
- **zod** pour la validation
- **Vitest** pour les tests unitaires
- **electron-builder** pour générer l'installeur Windows (NSIS)

### Architecture Electron

- Toute la logique base de données tourne dans le **process main**. Le renderer n'accède jamais directement à SQLite.
- Communication via **IPC typé** : un `preload` qui expose une API via `contextBridge`, avec `contextIsolation: true` et `nodeIntegration: false`.
- Types partagés entre main et renderer dans un dossier `shared/`.
- Le fichier de base de données est stocké dans `app.getPath('userData')`.
- Attention : `better-sqlite3` est un module natif, il doit être recompilé pour Electron (`electron-builder install-app-deps` ou `@electron/rebuild`). Configure-le dès le départ.

## 3. Modèle de données

Propose le schéma Drizzle final, mais voici la base attendue :

**abonnes**
- `id`, `numero_abonne` (texte, unique, c'est la valeur du code-barres), `nom_complet` (en arabe, tel qu'il vient de Syracuse), `nom_normalise` (pour la recherche, voir 5.1), `date_naissance` (nullable), `sexe` (H/F, nullable), `telephone` (nullable), `email` (nullable), `source` (`import` ou `inscription_rapide`), `date_premier_import`, `date_derniere_maj`, `actif`
- Le nom arrive en un seul bloc (prénom + nom, parfois composé : « محمد علي … »). **Ne pas essayer de séparer prénom et nom.**

**motifs**
- `id`, `libelle`, `icone` (nom d'icône lucide-react), `couleur`, `ordre`, `actif`
- Valeurs initiales (seed) : Prêt, Retour, Lecture sur place, Recherche, Internet

**visites**
- `id`, `abonne_id` (FK), `date_heure`

**visite_motifs** (table de liaison : une visite peut avoir plusieurs motifs)
- `visite_id`, `motif_id`

**imports** (historique)
- `id`, `date`, `nom_fichier`, `nb_crees`, `nb_mis_a_jour`, `nb_rejetes`, `rapport` (JSON)

**lignes_a_corriger**
- lignes d'import non reconnues, en attente de correction manuelle (voir 4.3)

**parametres** (clé/valeur)
- nom de la bibliothèque, code PIN admin, tranches d'âge, délai anti-double-scan, etc.

Ne jamais supprimer physiquement un motif ou un abonné qui a des visites : utiliser `actif = false` pour conserver l'historique des statistiques.

## 4. Fonctionnalités

### 4.1 Écran d'accueil (l'écran principal, celui qui reste ouvert toute la journée)

- Grand champ de saisie **toujours focalisé** (re-focus automatique après chaque action et si l'utilisateur clique ailleurs).
- La douchette se comporte comme un clavier : elle tape le numéro puis `Entrée`. Nettoyer la saisie (espaces, zéros ou caractères parasites éventuels du scanner).
- Après le scan, afficher la **fiche de l'abonné** : numéro, nom (en arabe, bien lisible), âge.
- Si le **sexe** n'est pas renseigné, afficher deux boutons H / F sur la fiche pour le compléter en un clic. Ce n'est pas bloquant : on peut valider la visite sans.
- Afficher les motifs actifs sous forme de **grandes tuiles cliquables** (icône + couleur), **sélection multiple**, puis un bouton **Valider**.
- Raccourcis clavier : `1` à `9` pour cocher les motifs, `Entrée` pour valider, `Échap` pour annuler.
- Après validation : notification de confirmation, puis retour automatique à l'écran de scan.
- Si aucune action pendant **[30] secondes**, retour automatique à l'écran de scan.
- **Anti-double-scan** : si le même numéro est scanné à nouveau dans un délai de **[5] minutes**, afficher un avertissement avec possibilité de continuer quand même.
- **Recherche par nom** accessible depuis l'accueil (bouton ou raccourci `F2`) pour retrouver un abonné sans carte.
- Afficher en permanence un petit compteur : « Visites aujourd'hui : N ».

### 4.2 Numéro inconnu → inscription rapide

- Si le numéro n'existe pas, proposer : « Abonné introuvable. Il a peut-être été inscrit dans Syracuse après le dernier import. L'inscrire ici ? »
- Formulaire rapide, numéro pré-rempli : nom complet (champ en arabe), date de naissance, sexe, téléphone.
- L'abonné est marqué `source = inscription_rapide`. Lors du prochain import Syracuse, ses données sont **remplacées** par celles de Syracuse (qui fait foi), sans perdre ses visites.
- Après l'enregistrement, enchaîner directement sur le choix des motifs.

### 4.3 Import des abonnés depuis Syracuse

L'export actuel fourni par la bibliothèque a un format **non structuré**. Un fichier d'exemple **anonymisé** est fourni : `fixtures/exemple_import_anonymise.xlsx`. Utilise-le pour les tests. **Ne jamais mettre de vraies données d'abonnés dans le dépôt git.**

**Format observé :**
- Une seule colonne (A). Chaque ligne est un texte : `numéro  nom complet en arabe  date de naissance  téléphone`
  - ex. `10001 محمد التونسي 12-05-2008 23456789`
- Des lignes d'en-tête avec le **nom du mois en arabe** (ex. `جانفي`, `أوت`) et des lignes vides : à ignorer.
- Numéro d'abonné : 5 chiffres. Date : `jj-mm-aaaa`. Téléphone : 8 chiffres.
- Environ **5 % des lignes contiennent des erreurs de saisie**. Exemples réels (reproduits dans le fichier d'exemple) :
  - date mal tapée : `3008-2004`, `10-09--2005`, `18-092012`, `19-009-2000`, `17-09-`, `29 08 2016`, année seule `2011`
  - ordre des champs inversé : téléphone avant la date, ou numéro d'abonné à la fin de la ligne
  - téléphone manquant, trop court (7 chiffres) ou trop long, email à la place du téléphone
  - nom collé à la date : `…زغلامي07-10-2013`
  - numéro d'abonné avec un chiffre en trop (6 chiffres)
  - **même numéro d'abonné pour deux personnes différentes**

**Parseur attendu (tolérant, par tokens plutôt qu'une seule regex) :**
1. Découper la ligne. Identifier les tokens : numéro d'abonné, date, téléphone, email ; tout le texte arabe restant = nom complet.
2. Reconnaître le numéro d'abonné où qu'il soit dans la ligne (en début de ligne en priorité).
3. Réparer automatiquement les dates quand c'est **sans ambiguïté** (`10-09--2005` → `10-09-2005`, `19-009-2000` → `19-09-2000`, `3008-2004` → `30-08-2004`, `29 08 2016` → `29-08-2016`). Vérifier que la date est valide et plausible (âge entre 2 et 100 ans).
4. Chaque ligne obtient un statut :
   - ✅ **OK** : tout est reconnu ;
   - 🔧 **Corrigée automatiquement** : importée, mais la correction est affichée dans le rapport ;
   - ⚠️ **À vérifier** : champ facultatif manquant ou douteux (téléphone invalide, date absente). L'abonné est importé quand même, car le numéro et le nom suffisent pour l'accueil ;
   - ❌ **Rejetée** : pas de numéro d'abonné reconnaissable, ou numéro en conflit.
5. **Conflit de numéro** (même numéro, noms différents, dans le fichier ou par rapport à la base) : ne rien écraser, mettre la ligne en « à corriger ».

**Écran d'import :**
- Choix du fichier (`.xlsx` ou `.csv`), puis **aperçu** avant import : tableau avec le statut de chaque ligne, filtres par statut, compteurs.
- Détection du format : si le fichier a plusieurs colonnes avec des en-têtes (export structuré de Syracuse), proposer un **mappage des colonnes** ; si une seule colonne de texte, utiliser le parseur ci-dessus. Les deux modes doivent exister.
- Import en **upsert** sur `numero_abonne`, dans une **transaction** unique. Syracuse fait foi : les données importées écrasent les anciennes, sauf le **sexe** saisi localement si Syracuse ne le fournit pas.
- Rapport final : X créés, Y mis à jour, Z corrigés automatiquement, W à corriger. Bouton pour **exporter la liste des erreurs en Excel**, afin que la bibliothèque les corrige aussi dans Syracuse.
- Écran **« Lignes à corriger »** : correction manuelle ligne par ligne, puis import.

### 4.4 Paramètres (protégés par un code PIN admin)

Pas de système de comptes utilisateurs. La zone Paramètres est protégée par un **code PIN** (stocké haché, à définir au premier lancement).

- **Gestion des motifs** : ajouter, renommer, changer icône et couleur, réordonner (drag & drop), activer/désactiver.
- **Tranches d'âge** configurables. Par défaut : 0–12, 13–17, 18–25, 26–40, 41–60, 60+.
- Nom de la bibliothèque, délai anti-double-scan, délai de retour automatique.
- Import Syracuse et historique des imports.
- Changement du code PIN.

### 4.5 Tableau de bord (protégé par le code PIN)

Filtre de période en haut : aujourd'hui, cette semaine, ce mois, cette année, période personnalisée. Tous les indicateurs se mettent à jour selon le filtre.

**Indicateurs clés (cartes en haut)**
- Nombre de visites, nombre d'abonnés uniques venus, moyenne de visites par jour, comparaison en % avec la période précédente.

**Graphiques**
- Évolution des visites dans le temps (courbe, par jour / semaine / mois selon la période).
- Répartition des visites **par motif** (en nombre et en %).
- Répartition **par tranche d'âge** (en %). L'âge est calculé **à la date de la visite**, pas aujourd'hui.
- Répartition **par sexe**, avec une part « non renseigné » affichée honnêtement tant que le sexe n'est pas complété pour tout le monde.
- **Croisement motif × tranche d'âge** (barres empilées : quels motifs pour quels âges).
- **Heures d'affluence** : carte de chaleur jour de la semaine × heure.
- Top 10 des abonnés les plus assidus.

Les abonnés sans date de naissance vont dans une tranche « âge inconnu ».

Les calculs statistiques doivent être faits **en SQL côté main** (agrégations), pas en chargeant toutes les visites dans le renderer.

### 4.6 Export des statistiques

- **Excel** : un classeur avec une feuille par indicateur (résumé, par motif, par tranche d'âge, par sexe, évolution, etc.) pour la période filtrée.
- **PDF** : un rapport mis en page (en-tête avec nom de la bibliothèque et période, indicateurs clés, graphiques, tableaux). Utilise `webContents.printToPDF` d'Electron sur une page de rapport dédiée. Les noms en arabe doivent s'afficher correctement dans le PDF.
- Le nom du fichier inclut la période, par ex. `statistiques_2026-09.xlsx`.

## 5. Exigences de qualité

### 5.1 Noms en arabe

- Interface en français (LTR), mais chaque champ ou cellule qui contient un nom utilise `dir="auto"` pour que l'arabe s'affiche correctement de droite à gauche.
- Embarquer une police qui gère bien l'arabe **en local** (ex. Noto Sans Arabic ou Cairo, via fichiers de police, pas de CDN puisque l'app est hors ligne).
- **Recherche tolérante** : normaliser les noms avant comparaison (`أ إ آ` → `ا`, `ة` → `ه`, `ى` → `ي`, suppression des diacritiques/tachkil et du tatweel `ـ`, espaces multiples). Stocker la version normalisée dans `nom_normalise`.
- Les chiffres restent en chiffres occidentaux (0-9).

### 5.2 Général

- Interface pensée pour l'accueil : gros éléments, contrastes forts, lisible de loin, utilisable principalement au clavier et à la douchette.
- Messages d'erreur clairs et en français, jamais de message technique affiché à l'utilisateur.
- Journal d'erreurs dans un fichier log (dans `userData`) pour le débogage.
- Validation des données avec **zod** (formulaires et IPC).
- **Tests Vitest** : le parseur d'import (chaque cas d'erreur listé en 4.3 doit avoir son test, à partir du fichier d'exemple), la normalisation des noms arabes, le calcul d'âge et des tranches, les requêtes statistiques.
- Données de démonstration : un script de seed qui génère ~200 abonnés (noms arabes fictifs) et ~3 000 visites réparties sur 6 mois, pour tester le dashboard.
- Code organisé et commenté là où la logique n'est pas évidente. Un `README.md` qui explique comment lancer le projet en développement, comment générer l'installeur et comment faire l'import Syracuse.

## 6. Méthode de travail

Travaille **phase par phase**. À la fin de chaque phase, arrête-toi, résume ce qui a été fait, et dis-moi comment tester avant de passer à la suivante.

1. **Initialisation** : projet electron-vite, Tailwind, shadcn/ui, police arabe locale, SQLite + Drizzle, migrations, IPC typé, seed de démo.
2. **Import Syracuse** : parseur tolérant + tests sur le fichier d'exemple, écran d'aperçu, rapport, lignes à corriger.
3. **Écran d'accueil** : scan, fiche abonné, choix des motifs, recherche par nom, inscription rapide.
4. **Paramètres** : code PIN, gestion des motifs, tranches d'âge.
5. **Tableau de bord** et statistiques.
6. **Export** Excel et PDF.
7. **Packaging** : installeur Windows avec electron-builder, icône de l'application, test de l'installation sur une machine propre.

Crée aussi un fichier `CLAUDE.md` à la racine qui résume l'architecture, les commandes utiles et les conventions du projet, et tiens-le à jour.
