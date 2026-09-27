import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Database from 'better-sqlite3'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { getDb, closeDb, getSqliteInstance, type AppDb } from '../db/client'
import { abonnes } from '../db/schema'
import {
  analyserFichierSauvegarde,
  effectuerSauvegardeAutomatiqueSiNecessaire,
  nommerFichierSauvegardeManuelle,
  restaurerDepuis,
  sauvegarderVers
} from './backupService'

const migrationsFolder = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'db', 'migrations')

let dbPath: string
let db: AppDb
let dossierTest: string

beforeEach(() => {
  dossierTest = path.join(os.tmpdir(), `test-backup-${Date.now()}-${Math.random().toString(36).slice(2)}`)
  fs.mkdirSync(dossierTest, { recursive: true })
  dbPath = path.join(dossierTest, 'accueil.sqlite')
  db = getDb(dbPath, migrationsFolder)
})

afterEach(() => {
  closeDb()
  fs.rmSync(dossierTest, { recursive: true, force: true })
})

function insererUnAbonne(numero: string): void {
  const maintenant = new Date().toISOString()
  db.insert(abonnes)
    .values({
      numeroAbonne: numero,
      nomComplet: 'Test',
      nomNormalise: 'test',
      source: 'import',
      datePremierImport: maintenant,
      dateDerniereMaj: maintenant
    })
    .run()
}

describe('nommerFichierSauvegardeManuelle', () => {
  it('inclut la date du jour dans le nom de fichier', () => {
    expect(nommerFichierSauvegardeManuelle(new Date(2026, 8, 27))).toBe('sauvegarde_bibliotheque_2026-09-27.sqlite')
  })
})

describe('sauvegarderVers', () => {
  it('produit une copie utilisable contenant les memes donnees', async () => {
    insererUnAbonne('10001')
    const cheminSauvegarde = path.join(dossierTest, 'sous-dossier', 'copie.sqlite')

    await sauvegarderVers(getSqliteInstance(), cheminSauvegarde)

    expect(fs.existsSync(cheminSauvegarde)).toBe(true)
    const copie = new Database(cheminSauvegarde, { readonly: true })
    const lignes = copie.prepare('SELECT numero_abonne FROM abonnes').all() as { numero_abonne: string }[]
    expect(lignes.map((l) => l.numero_abonne)).toEqual(['10001'])
    copie.close()
  })
})

describe('effectuerSauvegardeAutomatiqueSiNecessaire', () => {
  it('cree une sauvegarde du jour dans le dossier userData', async () => {
    insererUnAbonne('20001')
    const reference = new Date(2026, 8, 27)

    await effectuerSauvegardeAutomatiqueSiNecessaire(getSqliteInstance(), dossierTest, reference)

    const cheminAttendu = path.join(dossierTest, 'sauvegardes-automatiques', 'accueil-2026-09-27.sqlite')
    expect(fs.existsSync(cheminAttendu)).toBe(true)
  })

  it("ne refait pas de sauvegarde si celle du jour existe deja (evite l'overhead a chaque demarrage)", async () => {
    const reference = new Date(2026, 8, 27)
    await effectuerSauvegardeAutomatiqueSiNecessaire(getSqliteInstance(), dossierTest, reference)
    const cheminDuJour = path.join(dossierTest, 'sauvegardes-automatiques', 'accueil-2026-09-27.sqlite')
    const premiereDate = fs.statSync(cheminDuJour).mtimeMs

    insererUnAbonne('30001') // change la base sans que la sauvegarde du jour ne soit mise a jour
    await effectuerSauvegardeAutomatiqueSiNecessaire(getSqliteInstance(), dossierTest, reference)

    expect(fs.statSync(cheminDuJour).mtimeMs).toBe(premiereDate)
  })

  it('purge les sauvegardes automatiques au-dela de la retention', async () => {
    const dossierAuto = path.join(dossierTest, 'sauvegardes-automatiques')
    fs.mkdirSync(dossierAuto, { recursive: true })
    for (let jour = 1; jour <= 16; jour++) {
      fs.writeFileSync(path.join(dossierAuto, `accueil-2026-08-${String(jour).padStart(2, '0')}.sqlite`), '')
    }

    await effectuerSauvegardeAutomatiqueSiNecessaire(getSqliteInstance(), dossierTest, new Date(2026, 8, 1))

    const fichiersRestants = fs.readdirSync(dossierAuto).filter((f) => f.endsWith('.sqlite'))
    expect(fichiersRestants.length).toBe(14)
    // Les plus anciens sont purges en premier (ordre alphabetique = ordre chronologique ici).
    expect(fichiersRestants).not.toContain('accueil-2026-08-01.sqlite')
    expect(fichiersRestants).not.toContain('accueil-2026-08-02.sqlite')
  })
})

describe('analyserFichierSauvegarde', () => {
  it('reconnait une sauvegarde valide et compte ses lignes', async () => {
    insererUnAbonne('40001')
    insererUnAbonne('40002')
    const cheminSauvegarde = path.join(dossierTest, 'copie.sqlite')
    await sauvegarderVers(getSqliteInstance(), cheminSauvegarde)

    const apercu = analyserFichierSauvegarde(cheminSauvegarde)

    expect(apercu).toEqual({ valide: true, chemin: cheminSauvegarde, nbAbonnes: 2, nbVisites: 0 })
  })

  it("rejette un fichier qui n'est pas une sauvegarde de cette application", () => {
    const cheminInvalide = path.join(dossierTest, 'pas-une-base.sqlite')
    fs.writeFileSync(cheminInvalide, 'ceci nest pas du sqlite')

    expect(analyserFichierSauvegarde(cheminInvalide)).toEqual({ valide: false })
  })

  it('rejette un chemin inexistant', () => {
    expect(analyserFichierSauvegarde(path.join(dossierTest, 'absent.sqlite'))).toEqual({ valide: false })
  })
})

describe('restaurerDepuis', () => {
  it('remplace le fichier de la base actuelle par le contenu de la sauvegarde', async () => {
    insererUnAbonne('50001')
    const cheminSauvegarde = path.join(dossierTest, 'sauvegarde-a-restaurer.sqlite')
    await sauvegarderVers(getSqliteInstance(), cheminSauvegarde)
    closeDb()

    restaurerDepuis(cheminSauvegarde, dbPath)

    const restauree = new Database(dbPath, { readonly: true })
    const lignes = restauree.prepare('SELECT numero_abonne FROM abonnes').all() as { numero_abonne: string }[]
    expect(lignes.map((l) => l.numero_abonne)).toEqual(['50001'])
    restauree.close()
  })

  it('supprime les fichiers -wal/-shm residuels de l ancienne base', async () => {
    const cheminSauvegarde = path.join(dossierTest, 'sauvegarde-a-restaurer.sqlite')
    await sauvegarderVers(getSqliteInstance(), cheminSauvegarde)
    closeDb()
    fs.writeFileSync(dbPath + '-wal', 'ancien wal')
    fs.writeFileSync(dbPath + '-shm', 'ancien shm')

    restaurerDepuis(cheminSauvegarde, dbPath)

    expect(fs.existsSync(dbPath + '-wal')).toBe(false)
    expect(fs.existsSync(dbPath + '-shm')).toBe(false)
  })
})
