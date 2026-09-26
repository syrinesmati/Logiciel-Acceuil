import { desc, eq } from 'drizzle-orm'
import type { AppDb } from '../db/client'
import { motifs } from '../db/schema'
import type { Motif } from '@shared/accueil'
import type { MotifAdmin } from '@shared/parametres'

/** Valeurs initiales des motifs de visite (voir cahier des charges, section 3). */
const MOTIFS_PAR_DEFAUT = [
  { libelle: 'Pret', icone: 'book-up', couleur: '#2563eb', ordre: 1 },
  { libelle: 'Retour', icone: 'book-down', couleur: '#16a34a', ordre: 2 },
  { libelle: 'Lecture sur place', icone: 'book-open', couleur: '#d97706', ordre: 3 },
  { libelle: 'Recherche', icone: 'search', couleur: '#7c3aed', ordre: 4 },
  { libelle: 'Internet', icone: 'wifi', couleur: '#0891b2', ordre: 5 }
]

export function assurerMotifsParDefaut(db: AppDb): void {
  const total = db.select({ id: motifs.id }).from(motifs).all().length
  if (total === 0) db.insert(motifs).values(MOTIFS_PAR_DEFAUT).run()
}

export function listerMotifsActifs(db: AppDb): Motif[] {
  return db
    .select({
      id: motifs.id,
      libelle: motifs.libelle,
      icone: motifs.icone,
      couleur: motifs.couleur,
      ordre: motifs.ordre
    })
    .from(motifs)
    .where(eq(motifs.actif, true))
    .orderBy(motifs.ordre)
    .all()
}

/** Vue complete pour l'ecran Parametres : inclut les motifs desactives. */
export function listerTousLesMotifs(db: AppDb): MotifAdmin[] {
  return db.select().from(motifs).orderBy(motifs.ordre).all()
}

export interface MotifEntree {
  libelle: string
  icone: string
  couleur: string
}

export function creerMotif(entree: MotifEntree, db: AppDb): MotifAdmin {
  const dernier = db.select({ ordre: motifs.ordre }).from(motifs).orderBy(desc(motifs.ordre)).limit(1).get()
  return db
    .insert(motifs)
    .values({ ...entree, ordre: (dernier?.ordre ?? 0) + 1, actif: true })
    .returning()
    .get()
}

export function modifierMotif(
  id: number,
  entree: MotifEntree,
  db: AppDb
): MotifAdmin {
  const ligne = db.update(motifs).set(entree).where(eq(motifs.id, id)).returning().get()
  if (!ligne) throw new Error(`Motif introuvable (id ${id})`)
  return ligne
}

export function activerDesactiverMotif(id: number, actif: boolean, db: AppDb): MotifAdmin {
  const ligne = db.update(motifs).set({ actif }).where(eq(motifs.id, id)).returning().get()
  if (!ligne) throw new Error(`Motif introuvable (id ${id})`)
  return ligne
}

/** Reordonne les motifs selon l'ordre des id fournis (voir 4.4, drag & drop). */
export function reordonnerMotifs(ordreIds: number[], db: AppDb): void {
  db.transaction((tx) => {
    ordreIds.forEach((id, index) => {
      tx.update(motifs).set({ ordre: index + 1 }).where(eq(motifs.id, id)).run()
    })
  })
}
