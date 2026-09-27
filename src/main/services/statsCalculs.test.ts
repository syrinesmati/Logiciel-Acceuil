import { describe, expect, it } from 'vitest'
import { TRANCHES_AGE_PAR_DEFAUT } from '@shared/parametres'
import { resoudrePeriode } from './periode'
import {
  calculerEvolution,
  calculerHeuresAffluence,
  calculerIndicateursCles,
  calculerMotifParTrancheAge,
  calculerRepartitionParMotif,
  calculerRepartitionParSexe,
  calculerRepartitionParTrancheAge,
  calculerRepartitionParTypeVisiteur,
  calculerTopAbonnes,
  choisirGranularite,
  type VisiteEnrichie
} from './statsCalculs'

const PRET = { motifId: 1, libelle: 'Pret', couleur: '#2563eb' }
const RETOUR = { motifId: 2, libelle: 'Retour', couleur: '#16a34a' }

function visite(partiel: Partial<VisiteEnrichie> & { visiteId: number; dateHeure: string }): VisiteEnrichie {
  return {
    abonneId: partiel.visiteId,
    numeroAbonne: `${10000 + partiel.visiteId}`,
    nomComplet: `Abonne ${partiel.visiteId}`,
    dateNaissance: null,
    sexe: null,
    source: 'import',
    motifs: [PRET],
    ...partiel
  }
}

describe('choisirGranularite', () => {
  it('heure pour une periode de 1 jour', () => {
    const p = resoudrePeriode({ type: 'aujourdhui' }, new Date(2026, 8, 27))
    expect(choisirGranularite(p)).toBe('heure')
  })
  it('jour pour une periode de 7 jours', () => {
    const p = resoudrePeriode({ type: 'semaine' }, new Date(2026, 8, 27))
    expect(choisirGranularite(p)).toBe('jour')
  })
  it('mois pour une periode de 1 an', () => {
    const p = resoudrePeriode({ type: 'annee' }, new Date(2026, 8, 27))
    expect(choisirGranularite(p)).toBe('mois')
  })
})

describe('calculerIndicateursCles', () => {
  it('calcule visites, abonnes uniques, moyenne/jour et variations vs periode precedente', () => {
    const periode = resoudrePeriode({ type: 'semaine' }, new Date(2026, 8, 27)) // 7 jours
    const actuelles = Array.from({ length: 10 }, (_, i) =>
      visite({ visiteId: i, abonneId: i % 4, dateHeure: '2026-09-22T10:00:00.000Z' })
    )
    const precedentes = Array.from({ length: 8 }, (_, i) =>
      visite({ visiteId: 100 + i, abonneId: i % 5, dateHeure: '2026-09-15T10:00:00.000Z' })
    )

    const indicateurs = calculerIndicateursCles(actuelles, precedentes, periode)

    expect(indicateurs.nbVisites).toBe(10)
    expect(indicateurs.nbAbonnesUniques).toBe(4)
    expect(indicateurs.moyenneVisitesParJour).toBeCloseTo(10 / 7, 1)
    expect(indicateurs.variationNbVisitesPct).toBe(25)
    expect(indicateurs.variationNbAbonnesPct).toBe(-20)
  })

  it('renvoie une variation nulle (pas de division par zero) si la periode precedente est vide', () => {
    const periode = resoudrePeriode({ type: 'semaine' }, new Date(2026, 8, 27))
    const indicateurs = calculerIndicateursCles([visite({ visiteId: 1, dateHeure: '2026-09-22T10:00:00.000Z' })], [], periode)
    expect(indicateurs.variationNbVisitesPct).toBeNull()
  })
})

describe('calculerEvolution', () => {
  it('produit un point par jour de la periode, meme sans visite (0)', () => {
    const periode = resoudrePeriode(
      { type: 'personnalisee', dateDebut: '2026-09-01', dateFin: '2026-09-03' },
      new Date(2026, 8, 27)
    )
    const visites = [
      visite({ visiteId: 1, dateHeure: '2026-09-01T10:00:00.000Z' }),
      visite({ visiteId: 2, dateHeure: '2026-09-01T15:00:00.000Z' }),
      visite({ visiteId: 3, dateHeure: '2026-09-03T09:00:00.000Z' })
    ]
    const points = calculerEvolution(visites, periode, 'jour')
    expect(points).toHaveLength(3)
    expect(points.map((p) => p.nbVisites)).toEqual([2, 0, 1])
  })
})

describe('calculerRepartitionParMotif', () => {
  it('compte chaque motif selectionne (une visite a 2 motifs compte pour les deux)', () => {
    const visites = [
      visite({ visiteId: 1, dateHeure: 'x', motifs: [PRET] }),
      visite({ visiteId: 2, dateHeure: 'x', motifs: [RETOUR] }),
      visite({ visiteId: 3, dateHeure: 'x', motifs: [PRET, RETOUR] })
    ]
    const repartition = calculerRepartitionParMotif(visites)
    const pret = repartition.find((r) => r.motifId === 1)!
    const retour = repartition.find((r) => r.motifId === 2)!
    expect(pret.nombre).toBe(2)
    expect(retour.nombre).toBe(2)
    expect(pret.pourcentage).toBe(50)
  })
})

describe('calculerRepartitionParTrancheAge', () => {
  it("classe chaque visite selon l'age a la date de la visite (pas aujourd'hui)", () => {
    const visites = [
      // ne du 2020-01-01, visite le 2026-09-27 -> 6 ans -> tranche 0-12
      visite({ visiteId: 1, dateHeure: '2026-09-27T10:00:00.000Z', dateNaissance: '2020-01-01' }),
      // ne du 2000-01-01, visite en 2010 (age 10 a l'epoque) -> tranche 0-12, PAS 26-40 (age aujourd'hui)
      visite({ visiteId: 2, dateHeure: '2010-06-01T10:00:00.000Z', dateNaissance: '2000-01-01' }),
      // sans date de naissance -> age inconnu
      visite({ visiteId: 3, dateHeure: '2026-09-27T10:00:00.000Z', dateNaissance: null })
    ]
    const repartition = calculerRepartitionParTrancheAge(visites, TRANCHES_AGE_PAR_DEFAUT)
    const tranche0_12 = repartition.find((r) => r.trancheId === '0-12')!
    const inconnu = repartition.find((r) => r.trancheId === 'age_inconnu')!
    expect(tranche0_12.nombre).toBe(2)
    expect(inconnu.nombre).toBe(1)
  })
})

describe('calculerRepartitionParSexe', () => {
  it('distingue H / F / non_renseigne honnetement', () => {
    const visites = [
      visite({ visiteId: 1, dateHeure: 'x', sexe: 'H' }),
      visite({ visiteId: 2, dateHeure: 'x', sexe: 'H' }),
      visite({ visiteId: 3, dateHeure: 'x', sexe: 'F' }),
      visite({ visiteId: 4, dateHeure: 'x', sexe: null })
    ]
    const repartition = calculerRepartitionParSexe(visites)
    expect(repartition.find((r) => r.sexe === 'H')!.nombre).toBe(2)
    expect(repartition.find((r) => r.sexe === 'F')!.nombre).toBe(1)
    expect(repartition.find((r) => r.sexe === 'non_renseigne')!.nombre).toBe(1)
  })
})

describe('calculerRepartitionParTypeVisiteur', () => {
  it('distingue les visites abonne (import/inscription rapide) des visites non-abonne (CIN)', () => {
    const visites = [
      visite({ visiteId: 1, dateHeure: 'x', source: 'import' }),
      visite({ visiteId: 2, dateHeure: 'x', source: 'inscription_rapide' }),
      visite({ visiteId: 3, dateHeure: 'x', source: 'non_abonne' })
    ]
    const repartition = calculerRepartitionParTypeVisiteur(visites)
    expect(repartition.find((r) => r.type === 'abonne')!.nombre).toBe(2)
    expect(repartition.find((r) => r.type === 'non_abonne')!.nombre).toBe(1)
  })
})

describe('calculerMotifParTrancheAge', () => {
  it('croise motif et tranche age pour chaque visite', () => {
    const visites = [
      visite({ visiteId: 1, dateHeure: '2026-09-27T10:00:00.000Z', dateNaissance: '2020-01-01', motifs: [PRET] }),
      visite({ visiteId: 2, dateHeure: '2026-09-27T10:00:00.000Z', dateNaissance: '2020-01-01', motifs: [PRET] }),
      visite({ visiteId: 3, dateHeure: '2026-09-27T10:00:00.000Z', dateNaissance: '1990-01-01', motifs: [RETOUR] })
    ]
    const croise = calculerMotifParTrancheAge(visites, TRANCHES_AGE_PAR_DEFAUT)
    const tranche0_12 = croise.find((c) => c.trancheId === '0-12')!
    expect(tranche0_12.parMotif.find((m) => m.motifId === 1)!.nombre).toBe(2)
  })
})

describe('calculerHeuresAffluence', () => {
  it('renvoie toujours 168 cellules (7 jours x 24 heures)', () => {
    const cellules = calculerHeuresAffluence([])
    expect(cellules).toHaveLength(168)
    expect(cellules.every((c) => c.nombre === 0)).toBe(true)
  })

  it('incremente la bonne cellule jour/heure', () => {
    // Dimanche 27/09/2026 a 14h locale
    const d = new Date(2026, 8, 27, 14, 0, 0)
    const cellules = calculerHeuresAffluence([visite({ visiteId: 1, dateHeure: d.toISOString() })])
    const cellule = cellules.find((c) => c.jourSemaine === d.getDay() && c.heure === 14)!
    expect(cellule.nombre).toBe(1)
  })
})

describe('calculerTopAbonnes', () => {
  it('classe les abonnes par nombre de visites decroissant, limite a N', () => {
    const visites = [
      ...Array.from({ length: 5 }, (_, i) => visite({ visiteId: 100 + i, abonneId: 1, dateHeure: 'x' })),
      ...Array.from({ length: 2 }, (_, i) => visite({ visiteId: 200 + i, abonneId: 2, dateHeure: 'x' })),
      visite({ visiteId: 300, abonneId: 3, dateHeure: 'x' })
    ]
    const top = calculerTopAbonnes(visites, 2)
    expect(top).toHaveLength(2)
    expect(top[0]!.abonneId).toBe(1)
    expect(top[0]!.nbVisites).toBe(5)
    expect(top[1]!.abonneId).toBe(2)
  })
})
