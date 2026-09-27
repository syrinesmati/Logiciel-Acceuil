import { and, eq, gte, lt } from 'drizzle-orm'
import type { AppDb } from '../db/client'
import { abonnes, motifs, visiteMotifs, visites } from '../db/schema'
import type { PeriodeResolue } from './periode'
import type { MotifDeVisite, VisiteEnrichie } from './statsCalculs'

/**
 * Charge les visites d'une periode avec juste ce qu'il faut (abonne, motifs) pour
 * calculer toutes les statistiques du tableau de bord. L'agregation elle-meme se
 * fait ensuite en JS pur (statsCalculs.ts, facilement testable sans DB) : l'age a
 * la date de la visite et les jours locaux sont plus surs a calculer ainsi
 * qu'avec les fonctions de date de SQLite (qui operent sur les timestamps UTC
 * stockes). Seules les lignes de la periode filtree sont chargees (jamais
 * "toutes les visites"), et seul le resultat agrege est renvoye au renderer.
 */
export function chargerVisitesPeriode(periode: PeriodeResolue, db: AppDb): VisiteEnrichie[] {
  const debut = periode.debut.toISOString()
  const fin = periode.fin.toISOString()
  const dansLaPeriode = and(gte(visites.dateHeure, debut), lt(visites.dateHeure, fin))

  const lignesVisites = db
    .select({
      visiteId: visites.id,
      dateHeure: visites.dateHeure,
      abonneId: abonnes.id,
      numeroAbonne: abonnes.numeroAbonne,
      nomComplet: abonnes.nomComplet,
      dateNaissance: abonnes.dateNaissance,
      sexe: abonnes.sexe
    })
    .from(visites)
    .innerJoin(abonnes, eq(abonnes.id, visites.abonneId))
    .where(dansLaPeriode)
    .all()

  const lignesMotifs = db
    .select({
      visiteId: visiteMotifs.visiteId,
      motifId: motifs.id,
      libelle: motifs.libelle,
      couleur: motifs.couleur
    })
    .from(visiteMotifs)
    .innerJoin(motifs, eq(motifs.id, visiteMotifs.motifId))
    .innerJoin(visites, eq(visites.id, visiteMotifs.visiteId))
    .where(dansLaPeriode)
    .all()

  const motifsParVisite = new Map<number, MotifDeVisite[]>()
  for (const ligne of lignesMotifs) {
    const liste = motifsParVisite.get(ligne.visiteId) ?? []
    liste.push({ motifId: ligne.motifId, libelle: ligne.libelle, couleur: ligne.couleur })
    motifsParVisite.set(ligne.visiteId, liste)
  }

  return lignesVisites.map((ligne) => ({
    ...ligne,
    motifs: motifsParVisite.get(ligne.visiteId) ?? []
  }))
}
