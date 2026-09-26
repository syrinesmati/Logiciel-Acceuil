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

export const correctionManuelleSchema = z.object({
  id: z.number(),
  numeroAbonne: z.string().min(1, "Le numero d'abonne est obligatoire"),
  nomComplet: z.string().min(1, 'Le nom est obligatoire'),
  dateNaissance: z.string().nullable(),
  telephone: z.string().nullable(),
  email: z.string().nullable()
})
