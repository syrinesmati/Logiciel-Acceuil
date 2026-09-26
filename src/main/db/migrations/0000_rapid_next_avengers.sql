CREATE TABLE `abonnes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`numero_abonne` text NOT NULL,
	`nom_complet` text NOT NULL,
	`nom_normalise` text NOT NULL,
	`date_naissance` text,
	`sexe` text,
	`telephone` text,
	`email` text,
	`source` text DEFAULT 'inscription_rapide' NOT NULL,
	`date_premier_import` text DEFAULT (current_timestamp) NOT NULL,
	`date_derniere_maj` text DEFAULT (current_timestamp) NOT NULL,
	`actif` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `abonnes_numero_abonne_idx` ON `abonnes` (`numero_abonne`);--> statement-breakpoint
CREATE INDEX `abonnes_nom_normalise_idx` ON `abonnes` (`nom_normalise`);--> statement-breakpoint
CREATE TABLE `imports` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text DEFAULT (current_timestamp) NOT NULL,
	`nom_fichier` text NOT NULL,
	`nb_crees` integer DEFAULT 0 NOT NULL,
	`nb_mis_a_jour` integer DEFAULT 0 NOT NULL,
	`nb_corriges` integer DEFAULT 0 NOT NULL,
	`nb_rejetes` integer DEFAULT 0 NOT NULL,
	`rapport` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `lignes_a_corriger` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`import_id` integer,
	`ligne_brute` text NOT NULL,
	`motif_rejet` text NOT NULL,
	`statut` text DEFAULT 'en_attente' NOT NULL,
	`numero_abonne_detecte` text,
	`nom_detecte` text,
	`date_naissance_detectee` text,
	`telephone_detecte` text,
	`email_detecte` text,
	`date_creation` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`import_id`) REFERENCES `imports`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `motifs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`libelle` text NOT NULL,
	`icone` text NOT NULL,
	`couleur` text NOT NULL,
	`ordre` integer DEFAULT 0 NOT NULL,
	`actif` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE `parametres` (
	`cle` text PRIMARY KEY NOT NULL,
	`valeur` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `visite_motifs` (
	`visite_id` integer NOT NULL,
	`motif_id` integer NOT NULL,
	PRIMARY KEY(`visite_id`, `motif_id`),
	FOREIGN KEY (`visite_id`) REFERENCES `visites`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`motif_id`) REFERENCES `motifs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `visites` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`abonne_id` integer NOT NULL,
	`date_heure` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`abonne_id`) REFERENCES `abonnes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `visites_abonne_id_idx` ON `visites` (`abonne_id`);--> statement-breakpoint
CREATE INDEX `visites_date_heure_idx` ON `visites` (`date_heure`);