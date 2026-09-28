import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { getDb, closeDb, type AppDb } from '../db/client'
import { abonnes, motifs } from '../db/schema'
import {
  compterVisitesAujourdhui,
  completerSexe,
  enregistrerVisite,
  inscrireNonAbonne,
  rechercherAbonnePourVisite,
  rechercherAbonnesParNom
} from './accueilService'

const migrationsFolder = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'db', 'migrations')

let dbPath: string
let db: AppDb

beforeEach(() => {
  dbPath = path.join(os.tmpdir(), `test-accueil-${Date.now()}-${Math.random().toString(36).slice(2)}.sqlite`)
  db = getDb(dbPath, migrationsFolder)
})

afterEach(() => {
  closeDb()
  fs.rmSync(dbPath, { force: true })
})

const AUJOURDHUI = new Date('2026-09-26T14:00:00.000Z')

function creerAbonneDeTest(numero: string, nom: string, dateNaissance: string | null = '2000-01-01'): number {
  const maintenant = new Date().toISOString()
  const ligne = db
    .insert(abonnes)
    .values({
      numeroAbonne: numero,
      nomComplet: nom,
      nomNormalise: nom.toLowerCase(),
      dateNaissance,
      source: 'import',
      datePremierImport: maintenant,
      dateDerniereMaj: maintenant
    })
    .returning({ id: abonnes.id })
    .get()
  return ligne.id
}

describe('rechercherAbonnePourVisite', () => {
  it('nettoie le numero scanne avant de chercher (zeros/espaces parasites)', () => {
    creerAbonneDeTest('10001', 'Mohamed Tounsi')
    const r = rechercherAbonnePourVisite('  0010001 ', db, 300, AUJOURDHUI)
    expect(r.trouve).toBe(true)
    expect(r.abonne?.numeroAbonne).toBe('10001')
  })

  it("renvoie trouve=false si l'abonne n'existe pas", () => {
    const r = rechercherAbonnePourVisite('99999', db, 300, AUJOURDHUI)
    expect(r.trouve).toBe(false)
  })

  it("calcule l'age a partir de la date de naissance", () => {
    creerAbonneDeTest('10002', 'Karim', '2000-05-10')
    const r = rechercherAbonnePourVisite('10002', db, 300, AUJOURDHUI)
    expect(r.abonne?.age).toBe(26)
  })

  it("ne signale pas de double-scan si l'abonne n'a jamais visite", () => {
    creerAbonneDeTest('10003', 'Sami')
    const r = rechercherAbonnePourVisite('10003', db, 300, AUJOURDHUI)
    expect(r.avertissementDoubleScan).toBe(false)
  })

  it('signale un double-scan si la derniere visite est plus recente que le delai configure', () => {
    const id = creerAbonneDeTest('10004', 'Nour')
    enregistrerVisite({ abonneId: id, motifIds: [creerMotif()] }, db, new Date('2026-09-26T13:58:00.000Z'))
    const r = rechercherAbonnePourVisite('10004', db, 300, AUJOURDHUI) // 2 min plus tard, delai = 5 min
    expect(r.avertissementDoubleScan).toBe(true)
  })

  it("ne signale pas de double-scan si le delai configure est depasse", () => {
    const id = creerAbonneDeTest('10005', 'Wael')
    enregistrerVisite({ abonneId: id, motifIds: [creerMotif()] }, db, new Date('2026-09-26T13:00:00.000Z'))
    const r = rechercherAbonnePourVisite('10005', db, 300, AUJOURDHUI) // 1h plus tard
    expect(r.avertissementDoubleScan).toBe(false)
  })
})

function creerMotif(): number {
  const existant = db.select({ id: motifs.id }).from(motifs).all()[0]
  if (existant) return existant.id
  return db
    .insert(motifs)
    .values({ libelle: 'Pret', icone: 'book-up', couleur: '#2563eb', ordre: 1 })
    .returning({ id: motifs.id })
    .get().id
}

describe('inscrireNonAbonne', () => {
  it('cree un abonne leger avec source non_abonne, sans telephone', () => {
    const r = inscrireNonAbonne(
      { cin: '40001', nomComplet: 'Zied Chaabane', dateNaissance: '1995-03-10', sexe: 'H' },
      db,
      AUJOURDHUI
    )
    expect(r.succes).toBe(true)
    if (r.succes) {
      expect(r.abonne.source).toBe('non_abonne')
      expect(r.abonne.numeroAbonne).toBe('40001')
      expect(r.abonne.telephone).toBeNull()
      expect(r.abonne.age).toBe(31)
    }
  })

  it('refuse une CIN deja utilisee par un abonne existant', () => {
    creerAbonneDeTest('40002', 'Quelqu\'un')
    const r = inscrireNonAbonne({ cin: '40002', nomComplet: 'Un autre', dateNaissance: null, sexe: null }, db, AUJOURDHUI)
    expect(r.succes).toBe(false)
  })

  it('retrouve la meme fiche si la meme CIN revient (via rechercherAbonnePourVisite)', () => {
    inscrireNonAbonne({ cin: '40003', nomComplet: 'Amine', dateNaissance: null, sexe: null }, db, AUJOURDHUI)
    const r = rechercherAbonnePourVisite('40003', db, 300, AUJOURDHUI)
    expect(r.trouve).toBe(true)
    expect(r.abonne?.source).toBe('non_abonne')
  })
})

describe('completerSexe', () => {
  it('met a jour le sexe d\'un abonne', () => {
    const id = creerAbonneDeTest('20003', 'Amel')
    const r = completerSexe(id, 'F', db, AUJOURDHUI)
    expect(r.sexe).toBe('F')
  })
})

describe('enregistrerVisite et compterVisitesAujourdhui', () => {
  it('enregistre une visite et incremente le compteur du jour', () => {
    const id = creerAbonneDeTest('20004', 'Rania')
    const motifId = creerMotif()
    expect(compterVisitesAujourdhui(db, AUJOURDHUI)).toBe(0)
    const r = enregistrerVisite({ abonneId: id, motifIds: [motifId] }, db, AUJOURDHUI)
    expect(r.compteurAujourdhui).toBe(1)
    expect(compterVisitesAujourdhui(db, AUJOURDHUI)).toBe(1)
  })

  it("ne compte pas les visites d'un autre jour", () => {
    const id = creerAbonneDeTest('20005', 'Sarra')
    const motifId = creerMotif()
    enregistrerVisite({ abonneId: id, motifIds: [motifId] }, db, new Date('2026-09-25T10:00:00.000Z'))
    expect(compterVisitesAujourdhui(db, AUJOURDHUI)).toBe(0)
  })
})

describe('rechercherAbonnesParNom', () => {
  it('trouve un abonne par une partie de son nom normalise', () => {
    creerAbonneDeTest('30001', 'Mohamed Tounsi')
    creerAbonneDeTest('30002', 'Karim Gharbi')
    const resultats = rechercherAbonnesParNom('tounsi', db, AUJOURDHUI)
    expect(resultats).toHaveLength(1)
    expect(resultats[0]!.numeroAbonne).toBe('30001')
  })
})
