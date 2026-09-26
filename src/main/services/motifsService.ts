import { eq } from 'drizzle-orm'
import type { AppDb } from '../db/client'
import { motifs } from '../db/schema'
import type { Motif } from '@shared/accueil'

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
