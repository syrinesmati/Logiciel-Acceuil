import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { getDb, closeDb, type AppDb } from '../db/client'
import { changerPin, definirPin, pinEstDefini, verifierPin } from './pinService'

const migrationsFolder = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'db', 'migrations')

let dbPath: string
let db: AppDb

beforeEach(() => {
  dbPath = path.join(os.tmpdir(), `test-pin-${Date.now()}-${Math.random().toString(36).slice(2)}.sqlite`)
  db = getDb(dbPath, migrationsFolder)
})

afterEach(() => {
  closeDb()
  fs.rmSync(dbPath, { force: true })
})

describe('pinEstDefini', () => {
  it("renvoie false tant qu'aucun PIN n'a ete defini", () => {
    expect(pinEstDefini(db)).toBe(false)
  })

  it('renvoie true une fois un PIN defini', () => {
    definirPin('1234', db)
    expect(pinEstDefini(db)).toBe(true)
  })
})

describe('verifierPin', () => {
  it('accepte le bon PIN', () => {
    definirPin('4321', db)
    expect(verifierPin('4321', db)).toBe(true)
  })

  it('refuse un mauvais PIN', () => {
    definirPin('4321', db)
    expect(verifierPin('0000', db)).toBe(false)
  })

  it("refuse tant qu'aucun PIN n'est defini", () => {
    expect(verifierPin('1234', db)).toBe(false)
  })

  it('ne stocke jamais le PIN en clair', () => {
    definirPin('4321', db)
    const brut = db.$client
      .prepare("SELECT valeur FROM parametres WHERE cle = 'pin_hash'")
      .get() as { valeur: string } | undefined
    expect(brut?.valeur).toBeDefined()
    expect(brut!.valeur).not.toContain('4321')
    expect(brut!.valeur).toMatch(/^[0-9a-f]+:[0-9a-f]+$/)
  })
})

describe('changerPin', () => {
  it("change le PIN si l'ancien est correct", () => {
    definirPin('1111', db)
    const r = changerPin('1111', '2222', db)
    expect(r.succes).toBe(true)
    expect(verifierPin('2222', db)).toBe(true)
    expect(verifierPin('1111', db)).toBe(false)
  })

  it("refuse si l'ancien PIN est incorrect et ne change rien", () => {
    definirPin('1111', db)
    const r = changerPin('9999', '2222', db)
    expect(r.succes).toBe(false)
    expect(verifierPin('1111', db)).toBe(true)
  })
})
