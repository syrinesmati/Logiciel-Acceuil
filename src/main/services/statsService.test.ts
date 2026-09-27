import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { getDb, closeDb, type AppDb } from '../db/client'
import { abonnes, motifs, visiteMotifs, visites } from '../db/schema'
import { assurerParametresParDefaut } from './parametresService'
import { obtenirTableauDeBord } from './statsService'

const migrationsFolder = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'db', 'migrations')

let dbPath: string
let db: AppDb

beforeEach(() => {
  dbPath = path.join(os.tmpdir(), `test-stats-${Date.now()}-${Math.random().toString(36).slice(2)}.sqlite`)
  db = getDb(dbPath, migrationsFolder)
  assurerParametresParDefaut(db)
})

afterEach(() => {
  closeDb()
  fs.rmSync(dbPath, { force: true })
})

// Reference : lundi 21 septembre 2026 (debut de la semaine du 21 au 27).
const REFERENCE = new Date(2026, 8, 27, 18, 0)

function creerMotif(libelle: string): number {
  return db.insert(motifs).values({ libelle, icone: 'book-up', couleur: '#2563eb', ordre: 1 }).returning({ id: motifs.id }).get().id
}

function creerAbonne(numero: string, nom: string, dateNaissance: string | null, sexe: 'H' | 'F' | null = null): number {
  const maintenant = new Date().toISOString()
  return db
    .insert(abonnes)
    .values({
      numeroAbonne: numero,
      nomComplet: nom,
      nomNormalise: nom.toLowerCase(),
      dateNaissance,
      sexe,
      source: 'import',
      datePremierImport: maintenant,
      dateDerniereMaj: maintenant
    })
    .returning({ id: abonnes.id })
    .get().id
}

function creerVisite(abonneId: number, dateHeure: string, motifIds: number[]): void {
  const visiteId = db.insert(visites).values({ abonneId, dateHeure }).returning({ id: visites.id }).get().id
  db.insert(visiteMotifs).values(motifIds.map((motifId) => ({ visiteId, motifId }))).run()
}

describe('obtenirTableauDeBord', () => {
  it('calcule des indicateurs coherents avec des donnees connues sur la semaine en cours', () => {
    const motifPret = creerMotif('Pret')
    const abonne1 = creerAbonne('10001', 'Mohamed Tounsi', '2000-01-01', 'H')
    const abonne2 = creerAbonne('10002', 'Sara Gharbi', '2015-01-01', 'F')

    // Semaine du 21 au 27/09/2026 (periode "semaine" a la reference)
    creerVisite(abonne1, '2026-09-22T10:00:00.000Z', [motifPret])
    creerVisite(abonne1, '2026-09-23T10:00:00.000Z', [motifPret])
    creerVisite(abonne2, '2026-09-24T10:00:00.000Z', [motifPret])
    // Hors periode (semaine precedente)
    creerVisite(abonne1, '2026-09-14T10:00:00.000Z', [motifPret])

    const tableau = obtenirTableauDeBord({ type: 'semaine' }, db, REFERENCE)

    // Verification croisee avec une requete SQL manuelle directe.
    const compteAttendu = db.$client
      .prepare("SELECT COUNT(*) n FROM visites WHERE date_heure >= '2026-09-21T00:00:00.000Z' AND date_heure < '2026-09-28T00:00:00.000Z'")
      .get() as { n: number }

    expect(tableau.indicateurs.nbVisites).toBe(compteAttendu.n)
    expect(tableau.indicateurs.nbVisites).toBe(3)
    expect(tableau.indicateurs.nbAbonnesUniques).toBe(2)
    expect(tableau.topAbonnes[0]!.numeroAbonne).toBe('10001')
    expect(tableau.topAbonnes[0]!.nbVisites).toBe(2)
    expect(tableau.parMotif[0]!.nombre).toBe(3)
  })

  it("ignore les visites en dehors de la periode filtree", () => {
    const motifId = creerMotif('Pret')
    const abonneId = creerAbonne('20001', 'Karim', null)
    creerVisite(abonneId, '2020-01-01T10:00:00.000Z', [motifId])

    const tableau = obtenirTableauDeBord({ type: 'semaine' }, db, REFERENCE)
    expect(tableau.indicateurs.nbVisites).toBe(0)
  })

  it("place les abonnes sans date de naissance dans la tranche 'age inconnu'", () => {
    const motifId = creerMotif('Pret')
    const abonneId = creerAbonne('30001', 'Sans date', null)
    creerVisite(abonneId, '2026-09-22T10:00:00.000Z', [motifId])

    const tableau = obtenirTableauDeBord({ type: 'semaine' }, db, REFERENCE)
    const inconnu = tableau.parTrancheAge.find((t) => t.trancheId === 'age_inconnu')!
    expect(inconnu.nombre).toBe(1)
  })

  it("renvoie une repartition par sexe honnete quand le sexe n'est pas renseigne", () => {
    const motifId = creerMotif('Pret')
    const abonneId = creerAbonne('40001', 'Sans sexe', null, null)
    creerVisite(abonneId, '2026-09-22T10:00:00.000Z', [motifId])

    const tableau = obtenirTableauDeBord({ type: 'semaine' }, db, REFERENCE)
    const nonRenseigne = tableau.parSexe.find((s) => s.sexe === 'non_renseigne')!
    expect(nonRenseigne.nombre).toBe(1)
    expect(nonRenseigne.pourcentage).toBe(100)
  })
})
