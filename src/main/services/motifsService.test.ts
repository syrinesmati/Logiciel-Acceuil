import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { getDb, closeDb, type AppDb } from '../db/client'
import {
  activerDesactiverMotif,
  assurerMotifsParDefaut,
  creerMotif,
  listerMotifsActifs,
  listerTousLesMotifs,
  modifierMotif,
  reordonnerMotifs
} from './motifsService'

const migrationsFolder = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'db', 'migrations')

let dbPath: string
let db: AppDb

beforeEach(() => {
  dbPath = path.join(os.tmpdir(), `test-motifs-${Date.now()}-${Math.random().toString(36).slice(2)}.sqlite`)
  db = getDb(dbPath, migrationsFolder)
  assurerMotifsParDefaut(db)
})

afterEach(() => {
  closeDb()
  fs.rmSync(dbPath, { force: true })
})

describe('creerMotif', () => {
  it('ajoute un motif a la fin de la liste (ordre croissant)', () => {
    const motif = creerMotif({ libelle: 'Animation', icone: 'search', couleur: '#000000' }, db)
    expect(motif.ordre).toBe(6)
    expect(motif.actif).toBe(true)
    expect(listerTousLesMotifs(db)).toHaveLength(6)
  })
})

describe('modifierMotif', () => {
  it('renomme un motif existant sans toucher son ordre', () => {
    const [premier] = listerTousLesMotifs(db)
    const modifie = modifierMotif(premier!.id, { libelle: 'Emprunt', icone: 'book-up', couleur: '#111111' }, db)
    expect(modifie.libelle).toBe('Emprunt')
    expect(modifie.ordre).toBe(premier!.ordre)
  })
})

describe('activerDesactiverMotif', () => {
  it("desactive un motif : il disparait de listerMotifsActifs mais reste dans listerTousLesMotifs", () => {
    const [premier] = listerTousLesMotifs(db)
    activerDesactiverMotif(premier!.id, false, db)
    expect(listerMotifsActifs(db).some((m) => m.id === premier!.id)).toBe(false)
    expect(listerTousLesMotifs(db).some((m) => m.id === premier!.id)).toBe(true)
  })
})

describe('reordonnerMotifs', () => {
  it("applique le nouvel ordre selon la liste d'id fournie", () => {
    const tous = listerTousLesMotifs(db)
    const idsInverses = [...tous].reverse().map((m) => m.id)
    reordonnerMotifs(idsInverses, db)
    const apres = listerMotifsActifs(db)
    expect(apres.map((m) => m.id)).toEqual(idsInverses)
    expect(apres.map((m) => m.ordre)).toEqual([1, 2, 3, 4, 5])
  })
})
