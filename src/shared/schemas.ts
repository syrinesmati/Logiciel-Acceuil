import { z } from 'zod'

export const statutLigneImportSchema = z.enum(['ok', 'corrigee', 'a_verifier', 'rejetee'])

export const ligneImportParseeSchema = z.object({
  index: z.number(),
  ligneBrute: z.union([z.string(), z.record(z.string(), z.string())]),
  statut: statutLigneImportSchema,
  numeroAbonne: z.string().nullable(),
  nomComplet: z.string().nullable(),
  dateNaissance: z.string().nullable(),
  telephone: z.string().nullable(),
  email: z.string().nullable(),
  corrections: z.array(z.string()),
  avertissements: z.array(z.string()),
  erreur: z.string().nullable()
})

export const mappageColonnesSchema = z.object({
  numeroAbonne: z.string(),
  nomComplet: z.string().optional(),
  prenom: z.string().optional(),
  nom: z.string().optional(),
  dateNaissance: z.string().optional(),
  telephone: z.string().optional(),
  email: z.string().optional()
})

export const executerImportSchema = z.object({
  nomFichier: z.string().min(1),
  lignes: z.array(ligneImportParseeSchema)
})

export const exporterErreursSchema = z.object({
  lignes: z.array(ligneImportParseeSchema)
})

export const analyserFichierSchema = z.object({
  cheminFichier: z.string().min(1),
  nomFichier: z.string().min(1),
  mappage: mappageColonnesSchema.optional()
})

export const rechercherNumeroSchema = z.object({
  numero: z.string().min(1)
})

export const inscriptionRapideSchema = z.object({
  numeroAbonne: z.string().min(1, "Le numero d'abonne est obligatoire"),
  nomComplet: z.string().min(1, 'Le nom est obligatoire'),
  dateNaissance: z.string().nullable(),
  sexe: z.enum(['H', 'F']).nullable(),
  telephone: z.string().nullable()
})

export const inscriptionNonAbonneSchema = z.object({
  cin: z.string().min(1, 'Le numero de CIN est obligatoire'),
  nomComplet: z.string().min(1, 'Le nom est obligatoire'),
  dateNaissance: z.string().nullable(),
  sexe: z.enum(['H', 'F']).nullable()
})

export const completerSexeSchema = z.object({
  abonneId: z.number(),
  sexe: z.enum(['H', 'F'])
})

export const enregistrerVisiteSchema = z.object({
  abonneId: z.number(),
  motifIds: z.array(z.number()).min(1, 'Selectionnez au moins un motif')
})

export const rechercherParNomSchema = z.object({
  requete: z.string().min(1)
})

export const correctionManuelleSchema = z.object({
  id: z.number(),
  numeroAbonne: z.string().min(1, "Le numero d'abonne est obligatoire"),
  nomComplet: z.string().min(1, 'Le nom est obligatoire'),
  dateNaissance: z.string().nullable(),
  telephone: z.string().nullable(),
  email: z.string().nullable()
})

const PIN_REGEX = /^\d{4,6}$/

export const pinSchema = z.object({
  pin: z.string().regex(PIN_REGEX, 'Le code PIN doit comporter 4 a 6 chiffres')
})

export const changerPinSchema = z.object({
  ancienPin: z.string().min(1),
  nouveauPin: z.string().regex(PIN_REGEX, 'Le code PIN doit comporter 4 a 6 chiffres')
})

export const trancheAgeSchema = z.object({
  id: z.string().min(1),
  libelle: z.string().min(1),
  min: z.number().int().min(0),
  max: z.number().int().nullable()
})

export const parametresGenerauxSchema = z.object({
  nomBibliotheque: z.string().min(1, 'Le nom de la bibliotheque est obligatoire'),
  delaiAntiDoubleScanSecondes: z.number().int().min(1),
  delaiRetourAutoSecondes: z.number().int().min(5),
  tranchesAge: z.array(trancheAgeSchema)
})

export const motifEntreeSchema = z.object({
  libelle: z.string().min(1, 'Le libelle est obligatoire'),
  icone: z.string().min(1),
  couleur: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Couleur invalide (format hexadecimal attendu)')
})

export const modifierMotifSchema = motifEntreeSchema.extend({
  id: z.number()
})

export const activerMotifSchema = z.object({
  id: z.number(),
  actif: z.boolean()
})

export const reordonnerMotifsSchema = z.object({
  ordreIds: z.array(z.number()).min(1)
})

export const filtrePeriodeSchema = z.object({
  type: z.enum(['aujourdhui', 'semaine', 'mois', 'annee', 'personnalisee']),
  dateDebut: z.string().optional(),
  dateFin: z.string().optional()
})
