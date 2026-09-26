import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { eq } from 'drizzle-orm'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { getDb, closeDb, type AppDb } from '../db/client'
import { abonnes } from '../db/schema'
import { parserColonneUnique } from './importParser/parseurColonneUnique'
import { detecterConflitsAvecBase, detecterConflitsDansFichier } from './importParser/conflits'
import {
  corrigerLigneManuellement,
  executerImport,
  listerHistoriqueImports,
  listerLignesACorriger
} from './importService'

const migrationsFolder = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'db', 'migrations')

let dbPath: string
let db: AppDb

beforeEach(() => {
  dbPath = path.join(os.tmpdir(), `test-import-service-${Date.now()}-${Math.random().toString(36).slice(2)}.sqlite`)
  db = getDb(dbPath, migrationsFolder)
})

afterEach(() => {
  closeDb()
  fs.rmSync(dbPath, { force: true })
})

const AUJOURDHUI = new Date('2026-09-26')

describe('executerImport', () => {
  it('cree les abonnes valides, enregistre les rejets et l\'historique', () => {
    const lignes = detecterConflitsDansFichier(
      parserColonneUnique(
        [
          '10001 محمد التونسي 12-05-2008 23456789',
          '10002 كريم الشارني 3008-2004 34567890',
          'خالد بن علي 12-05-2008 23456789'
        ],
        AUJOURDHUI
      )
    )

    const rapport = executerImport(lignes, 'test.xlsx', db)

    expect(rapport).toEqual({
      nbCrees: 2,
      nbMisAJour: 0,
      nbCorriges: 1,
      nbRejetes: 1,
      nbTotalLignesValides: 2
    })

    const tousLesAbonnes = db.select().from(abonnes).all()
    expect(tousLesAbonnes).toHaveLength(2)

    const rejetes = listerLignesACorriger(db)
    expect(rejetes).toHaveLength(1)
    expect(rejetes[0]!.motifRejet).toContain('numero')

    const historique = listerHistoriqueImports(db)
    expect(historique).toHaveLength(1)
    expect(historique[0]!.nbCrees).toBe(2)
  })

  it('met a jour un abonne existant sans toucher au sexe saisi localement', () => {
    const maintenant = new Date().toISOString()
    db.insert(abonnes)
      .values({
        numeroAbonne: '10001',
        nomComplet: 'Ancien Nom',
        nomNormalise: 'ancien nom',
        sexe: 'F',
        source: 'inscription_rapide',
        datePremierImport: maintenant,
        dateDerniereMaj: maintenant
      })
      .run()

    const lignes = parserColonneUnique(['10001 محمد التونسي 12-05-2008 23456789'], AUJOURDHUI)
    const rapport = executerImport(lignes, 'test.xlsx', db)

    expect(rapport.nbMisAJour).toBe(1)
    expect(rapport.nbCrees).toBe(0)

    const abonne = db.select().from(abonnes).where(eq(abonnes.numeroAbonne, '10001')).get()
    expect(abonne!.nomComplet).toBe('محمد التونسي')
    expect(abonne!.sexe).toBe('F') // jamais ecrase par l'import : Syracuse ne fournit pas le sexe
    expect(abonne!.source).toBe('import')
  })

  it('n\'ecrase jamais silencieusement un abonne : les conflits vont dans lignes_a_corriger', () => {
    const maintenant = new Date().toISOString()
    db.insert(abonnes)
      .values({
        numeroAbonne: '10001',
        nomComplet: 'Quelqu\'un d\'autre',
        nomNormalise: 'quelquun dautre',
        source: 'import',
        datePremierImport: maintenant,
        dateDerniereMaj: maintenant
      })
      .run()

    const lignes = parserColonneUnique(['10001 محمد التونسي 12-05-2008 23456789'], AUJOURDHUI)
    // Le meme cross-check que analyserFichier ferait normalement :
    const verifiees = detecterConflitsAvecBase(lignes, (numero) => {
      const a = db.select({ nomComplet: abonnes.nomComplet }).from(abonnes).where(eq(abonnes.numeroAbonne, numero)).get()
      return a?.nomComplet ?? null
    })

    const rapport = executerImport(verifiees, 'test.xlsx', db)
    expect(rapport.nbCrees).toBe(0)
    expect(rapport.nbMisAJour).toBe(0)
    expect(rapport.nbRejetes).toBe(1)

    const abonne = db.select().from(abonnes).where(eq(abonnes.numeroAbonne, '10001')).get()
    expect(abonne!.nomComplet).toBe('Quelqu\'un d\'autre')
  })
})

describe('corrigerLigneManuellement', () => {
  it('cree l\'abonne et marque la ligne corrigee quand il n\'y a plus de conflit', () => {
    const lignes = parserColonneUnique(['خالد بن علي 12-05-2008 23456789'], AUJOURDHUI)
    executerImport(lignes, 'test.xlsx', db)

    const [ligne] = listerLignesACorriger(db)
    const resultat = corrigerLigneManuellement(
      ligne!.id,
      {
        numeroAbonne: '20001',
        nomComplet: 'خالد بن علي',
        dateNaissance: '2008-05-12',
        telephone: '23456789',
        email: null
      },
      db
    )

    expect(resultat.succes).toBe(true)
    expect(listerLignesACorriger(db)).toHaveLength(0)
    const abonne = db.select().from(abonnes).where(eq(abonnes.numeroAbonne, '20001')).get()
    expect(abonne).toBeDefined()
  })

  it('renvoie une erreur si le numero choisi est deja pris par quelqu\'un d\'autre', () => {
    const maintenant = new Date().toISOString()
    db.insert(abonnes)
      .values({
        numeroAbonne: '20002',
        nomComplet: 'Autre Personne',
        nomNormalise: 'autre personne',
        source: 'import',
        datePremierImport: maintenant,
        dateDerniereMaj: maintenant
      })
      .run()

    const lignes = parserColonneUnique(['خالد بن علي 12-05-2008 23456789'], AUJOURDHUI)
    executerImport(lignes, 'test.xlsx', db)
    const [ligne] = listerLignesACorriger(db)

    const resultat = corrigerLigneManuellement(
      ligne!.id,
      { numeroAbonne: '20002', nomComplet: 'خالد بن علي', dateNaissance: null, telephone: null, email: null },
      db
    )

    expect(resultat.succes).toBe(false)
    expect(listerLignesACorriger(db)).toHaveLength(1)
  })
})
