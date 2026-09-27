import { relations, sql } from 'drizzle-orm'
import { sqliteTable, text, integer, primaryKey, index, uniqueIndex } from 'drizzle-orm/sqlite-core'

export const abonnes = sqliteTable(
  'abonnes',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    numeroAbonne: text('numero_abonne').notNull(),
    nomComplet: text('nom_complet').notNull(),
    nomNormalise: text('nom_normalise').notNull(),
    dateNaissance: text('date_naissance'),
    sexe: text('sexe', { enum: ['H', 'F'] }),
    telephone: text('telephone'),
    email: text('email'),
    source: text('source', { enum: ['import', 'inscription_rapide', 'non_abonne'] })
      .notNull()
      .default('inscription_rapide'),
    datePremierImport: text('date_premier_import')
      .notNull()
      .default(sql`(current_timestamp)`),
    dateDerniereMaj: text('date_derniere_maj')
      .notNull()
      .default(sql`(current_timestamp)`),
    actif: integer('actif', { mode: 'boolean' }).notNull().default(true)
  },
  (table) => [
    uniqueIndex('abonnes_numero_abonne_idx').on(table.numeroAbonne),
    index('abonnes_nom_normalise_idx').on(table.nomNormalise)
  ]
)

export const motifs = sqliteTable('motifs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  libelle: text('libelle').notNull(),
  icone: text('icone').notNull(),
  couleur: text('couleur').notNull(),
  ordre: integer('ordre').notNull().default(0),
  actif: integer('actif', { mode: 'boolean' }).notNull().default(true)
})

export const visites = sqliteTable(
  'visites',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    abonneId: integer('abonne_id')
      .notNull()
      .references(() => abonnes.id),
    dateHeure: text('date_heure')
      .notNull()
      .default(sql`(current_timestamp)`)
  },
  (table) => [index('visites_abonne_id_idx').on(table.abonneId), index('visites_date_heure_idx').on(table.dateHeure)]
)

export const visiteMotifs = sqliteTable(
  'visite_motifs',
  {
    visiteId: integer('visite_id')
      .notNull()
      .references(() => visites.id),
    motifId: integer('motif_id')
      .notNull()
      .references(() => motifs.id)
  },
  (table) => [primaryKey({ columns: [table.visiteId, table.motifId] })]
)

export const imports = sqliteTable('imports', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  date: text('date')
    .notNull()
    .default(sql`(current_timestamp)`),
  nomFichier: text('nom_fichier').notNull(),
  nbCrees: integer('nb_crees').notNull().default(0),
  nbMisAJour: integer('nb_mis_a_jour').notNull().default(0),
  nbCorriges: integer('nb_corriges').notNull().default(0),
  nbRejetes: integer('nb_rejetes').notNull().default(0),
  rapport: text('rapport', { mode: 'json' }).notNull()
})

export const lignesACorriger = sqliteTable('lignes_a_corriger', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  importId: integer('import_id').references(() => imports.id),
  ligneBrute: text('ligne_brute', { mode: 'json' }).notNull(),
  motifRejet: text('motif_rejet').notNull(),
  statut: text('statut', { enum: ['en_attente', 'corrigee', 'ignoree'] })
    .notNull()
    .default('en_attente'),
  numeroAbonneDetecte: text('numero_abonne_detecte'),
  nomDetecte: text('nom_detecte'),
  dateNaissanceDetectee: text('date_naissance_detectee'),
  telephoneDetecte: text('telephone_detecte'),
  emailDetecte: text('email_detecte'),
  dateCreation: text('date_creation')
    .notNull()
    .default(sql`(current_timestamp)`)
})

export const parametres = sqliteTable('parametres', {
  cle: text('cle').primaryKey(),
  valeur: text('valeur').notNull()
})

export const abonnesRelations = relations(abonnes, ({ many }) => ({
  visites: many(visites)
}))

export const visitesRelations = relations(visites, ({ one, many }) => ({
  abonne: one(abonnes, { fields: [visites.abonneId], references: [abonnes.id] }),
  visiteMotifs: many(visiteMotifs)
}))

export const motifsRelations = relations(motifs, ({ many }) => ({
  visiteMotifs: many(visiteMotifs)
}))

export const visiteMotifsRelations = relations(visiteMotifs, ({ one }) => ({
  visite: one(visites, { fields: [visiteMotifs.visiteId], references: [visites.id] }),
  motif: one(motifs, { fields: [visiteMotifs.motifId], references: [motifs.id] })
}))
