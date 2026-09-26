import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { getDb, closeDb, type AppDb } from '../db/client'
import {
  assurerParametresParDefaut,
  enregistrerParametresGeneraux,
  obtenirParametresGeneraux
} from './parametresService'

const migrationsFolder = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'db', 'migrations')

let dbPath: string
let db: AppDb

beforeEach(() => {
  dbPath = path.join(os.tmpdir(), `test-parametres-${Date.now()}-${Math.random().toString(36).slice(2)}.sqlite`)
  db = getDb(dbPath, migrationsFolder)
})

afterEach(() => {
  closeDb()
  fs.rmSync(dbPath, { force: true })
})

describe('assurerParametresParDefaut', () => {
  it('pose des valeurs par defaut raisonnables', () => {
    assurerParametresParDefaut(db)
    const p = obtenirParametresGeneraux(db)
    expect(p.delaiAntiDoubleScanSecondes).toBe(300)
    expect(p.delaiRetourAutoSecondes).toBe(30)
    expect(p.tranchesAge.length).toBeGreaterThan(0)
    expect(p.nomBibliotheque).toContain('Ariana')
  })

  it("n'ecrase pas des valeurs deja personnalisees", () => {
    assurerParametresParDefaut(db)
    enregistrerParametresGeneraux(
      {
        nomBibliotheque: 'Ma bibliotheque',
        delaiAntiDoubleScanSecondes: 600,
        delaiRetourAutoSecondes: 45,
        tranchesAge: obtenirParametresGeneraux(db).tranchesAge
      },
      db
    )
    assurerParametresParDefaut(db)
    const p = obtenirParametresGeneraux(db)
    expect(p.nomBibliotheque).toBe('Ma bibliotheque')
    expect(p.delaiAntiDoubleScanSecondes).toBe(600)
  })
})

describe('enregistrerParametresGeneraux / obtenirParametresGeneraux', () => {
  it('fait un aller-retour fidele', () => {
    const valeurs = {
      nomBibliotheque: 'Mediatheque Test',
      delaiAntiDoubleScanSecondes: 120,
      delaiRetourAutoSecondes: 20,
      tranchesAge: [
        { id: '0-17', libelle: '0-17 ans', min: 0, max: 17 },
        { id: '18+', libelle: '18 ans et plus', min: 18, max: null }
      ]
    }
    enregistrerParametresGeneraux(valeurs, db)
    expect(obtenirParametresGeneraux(db)).toEqual(valeurs)
  })

  it('impose des bornes minimales sur les delais', () => {
    enregistrerParametresGeneraux(
      { nomBibliotheque: 'x', delaiAntiDoubleScanSecondes: 0, delaiRetourAutoSecondes: 0, tranchesAge: [] },
      db
    )
    const p = obtenirParametresGeneraux(db)
    expect(p.delaiAntiDoubleScanSecondes).toBeGreaterThanOrEqual(1)
    expect(p.delaiRetourAutoSecondes).toBeGreaterThanOrEqual(5)
  })
})
