import ExcelJS from 'exceljs'
import { describe, expect, it } from 'vitest'
import type { TableauDeBord } from '@shared/stats'
import type { PeriodeResolue } from './periode'
import { construireClasseurStatistiques, formaterPeriodeLisible, nommerFichierStatistiques } from './exportStats'

const PERIODE_MOIS: PeriodeResolue = { debut: new Date(2026, 8, 1), fin: new Date(2026, 9, 1) }
const PERIODE_ANNEE: PeriodeResolue = { debut: new Date(2026, 0, 1), fin: new Date(2027, 0, 1) }
const PERIODE_PERSONNALISEE: PeriodeResolue = { debut: new Date(2026, 8, 1), fin: new Date(2026, 8, 16) }

describe('nommerFichierStatistiques', () => {
  it('nomme un fichier mensuel "statistiques_2026-09.xlsx"', () => {
    expect(nommerFichierStatistiques({ type: 'mois' }, PERIODE_MOIS, 'xlsx')).toBe('statistiques_2026-09.xlsx')
  })

  it('nomme un fichier annuel "statistiques_2026.pdf"', () => {
    expect(nommerFichierStatistiques({ type: 'annee' }, PERIODE_ANNEE, 'pdf')).toBe('statistiques_2026.pdf')
  })

  it('nomme un fichier personnalise avec les deux dates', () => {
    expect(nommerFichierStatistiques({ type: 'personnalisee' }, PERIODE_PERSONNALISEE, 'xlsx')).toBe(
      'statistiques_2026-09-01_2026-09-15.xlsx'
    )
  })
})

describe('formaterPeriodeLisible', () => {
  it('affiche la date de fin incluse (pas la borne exclusive)', () => {
    expect(formaterPeriodeLisible(PERIODE_MOIS)).toBe('01/09/2026 au 30/09/2026')
  })
})

function tableauDeTest(): TableauDeBord {
  return {
    periode: { debut: PERIODE_MOIS.debut.toISOString(), fin: PERIODE_MOIS.fin.toISOString() },
    indicateurs: {
      nbVisites: 10,
      nbAbonnesUniques: 5,
      moyenneVisitesParJour: 0.3,
      variationNbVisitesPct: 25,
      variationNbAbonnesPct: null
    },
    evolution: [{ cle: '2026-09-01', libelle: '01/09', nbVisites: 3 }],
    parMotif: [{ motifId: 1, libelle: 'Pret', couleur: '#2563eb', nombre: 6, pourcentage: 60 }],
    parTrancheAge: [{ trancheId: '0-12', libelle: '0-12 ans', nombre: 4, pourcentage: 40 }],
    parSexe: [
      { sexe: 'H', nombre: 6, pourcentage: 60 },
      { sexe: 'F', nombre: 3, pourcentage: 30 },
      { sexe: 'non_renseigne', nombre: 1, pourcentage: 10 }
    ],
    parTypeVisiteur: [
      { type: 'abonne', nombre: 9, pourcentage: 90 },
      { type: 'non_abonne', nombre: 1, pourcentage: 10 }
    ],
    motifParTrancheAge: [
      { trancheId: '0-12', trancheLibelle: '0-12 ans', parMotif: [{ motifId: 1, libelle: 'Pret', couleur: '#2563eb', nombre: 4 }] }
    ],
    heuresAffluence: [{ jourSemaine: 1, heure: 10, nombre: 2 }],
    topAbonnes: [{ abonneId: 1, numeroAbonne: '10001', nomComplet: 'محمد التونسي', nbVisites: 4 }]
  }
}

describe('construireClasseurStatistiques', () => {
  it('cree une feuille par indicateur avec les bonnes valeurs', async () => {
    const buffer = await construireClasseurStatistiques(tableauDeTest(), PERIODE_MOIS, "Mediatheque de l'Ariana")
    const classeur = new ExcelJS.Workbook()
    await classeur.xlsx.load(new Uint8Array(buffer) as unknown as ArrayBuffer)

    const noms = classeur.worksheets.map((f) => f.name)
    expect(noms).toEqual([
      'Resume',
      'Evolution',
      'Par motif',
      'Par tranche age',
      'Par sexe',
      'Type de visiteur',
      'Motif x tranche age',
      'Heures affluence',
      'Top 10 abonnes'
    ])

    const resume = classeur.getWorksheet('Resume')!
    expect(resume.getCell('B3').value).toBe('01/09/2026 au 30/09/2026') // periode
    expect(resume.getCell('B4').value).toBe(10) // nombre de visites
    expect(resume.getCell('B5').value).toBe(5) // abonnes uniques

    const topAbonnes = classeur.getWorksheet('Top 10 abonnes')!
    expect(topAbonnes.getCell('C2').value).toBe('محمد التونسي')

    const motifParAge = classeur.getWorksheet('Motif x tranche age')!
    expect(motifParAge.getRow(1).getCell(2).value).toBe('Pret')
    expect(motifParAge.getRow(2).getCell(2).value).toBe(4)

    const heures = classeur.getWorksheet('Heures affluence')!
    // colonne 1 = Jour, colonne 2 = 0h, ... colonne 12 = 10h (index 1-based : 1 jour + 11 heures avant 10h = colonne 12)
    expect(heures.getRow(2).getCell(1).value).toBe('Lundi')
    expect(heures.getRow(2).getCell(12).value).toBe(2)
  })
})
