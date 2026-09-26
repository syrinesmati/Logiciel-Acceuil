import { describe, expect, it } from 'vitest'
import { parseLigneColonneUnique, parserColonneUnique } from './parseurColonneUnique'

const AUJOURDHUI = new Date('2026-09-26')

describe('parseLigneColonneUnique', () => {
  it("reconnait une ligne bien formee (l'exemple du cahier des charges)", () => {
    const r = parseLigneColonneUnique('10001 محمد التونسي 12-05-2008 23456789', 0, AUJOURDHUI)
    expect(r.statut).toBe('ok')
    expect(r.numeroAbonne).toBe('10001')
    expect(r.nomComplet).toBe('محمد التونسي')
    expect(r.dateNaissance).toBe('2008-05-12')
    expect(r.telephone).toBe('23456789')
    expect(r.erreur).toBeNull()
  })

  it('corrige automatiquement une date mal formee et passe en statut "corrigee"', () => {
    const r = parseLigneColonneUnique('10002 كريم الشارني 3008-2004 34567890', 1, AUJOURDHUI)
    expect(r.statut).toBe('corrigee')
    expect(r.dateNaissance).toBe('2004-08-30')
    expect(r.corrections.length).toBeGreaterThan(0)
  })

  it('tolere le telephone avant la date (ordre des champs inverse)', () => {
    const r = parseLigneColonneUnique('10003 سامي الغربي 34567890 12-05-2008', 2, AUJOURDHUI)
    expect(r.statut).toBe('ok')
    expect(r.numeroAbonne).toBe('10003')
    expect(r.telephone).toBe('34567890')
    expect(r.dateNaissance).toBe('2008-05-12')
  })

  it("tolere le numero d'abonne en fin de ligne", () => {
    const r = parseLigneColonneUnique('وليد بوزيد 12-05-2008 34567890 10004', 3, AUJOURDHUI)
    expect(r.statut).toBe('ok')
    expect(r.numeroAbonne).toBe('10004')
    expect(r.nomComplet).toBe('وليد بوزيد')
  })

  it('signale un telephone manquant sans rejeter la ligne', () => {
    const r = parseLigneColonneUnique('10005 نور الفرشيشي 12-05-2008', 4, AUJOURDHUI)
    expect(r.statut).toBe('a_verifier')
    expect(r.telephone).toBeNull()
    expect(r.avertissements.some((a) => a.includes('telephone manquant'))).toBe(true)
    expect(r.numeroAbonne).toBe('10005')
  })

  it('signale un telephone trop court (7 chiffres)', () => {
    const r = parseLigneColonneUnique('10006 ليلى الماجري 12-05-2008 3456789', 5, AUJOURDHUI)
    expect(r.statut).toBe('a_verifier')
    expect(r.telephone).toBe('3456789')
    expect(r.avertissements.some((a) => a.includes('longueur inhabituelle'))).toBe(true)
  })

  it('signale un telephone trop long (9 chiffres)', () => {
    const r = parseLigneColonneUnique('10007 عمر الحمروني 12-05-2008 345678901', 6, AUJOURDHUI)
    expect(r.statut).toBe('a_verifier')
    expect(r.telephone).toBe('345678901')
    expect(r.avertissements.some((a) => a.includes('longueur inhabituelle'))).toBe(true)
  })

  it('signale un email trouve a la place du telephone', () => {
    const r = parseLigneColonneUnique('10008 خالد الجريدي 12-05-2008 khaled@example.com', 7, AUJOURDHUI)
    expect(r.statut).toBe('a_verifier')
    expect(r.email).toBe('khaled@example.com')
    expect(r.telephone).toBeNull()
    expect(r.avertissements.some((a) => a.includes('email'))).toBe(true)
  })

  it('separe un nom colle a la date et signale la correction', () => {
    const r = parseLigneColonneUnique('10009 كريم الزغلامي07-10-2013 34567890', 8, AUJOURDHUI)
    expect(r.statut).toBe('corrigee')
    expect(r.nomComplet).toBe('كريم الزغلامي')
    expect(r.dateNaissance).toBe('2013-10-07')
    expect(r.corrections.some((c) => c.includes('separe de la date'))).toBe(true)
  })

  it("tolere un numero d'abonne avec un chiffre en trop (6 chiffres)", () => {
    const r = parseLigneColonneUnique('100010 سارة العماري 12-05-2008 23456789', 9, AUJOURDHUI)
    expect(r.numeroAbonne).toBe('100010')
    expect(r.statut).toBe('ok')
  })

  it('rejette une ligne sans numero d\'abonne reconnaissable', () => {
    const r = parseLigneColonneUnique('محمد بن سالم 12-05-2008 23456789', 10, AUJOURDHUI)
    expect(r.statut).toBe('rejetee')
    expect(r.numeroAbonne).toBeNull()
    expect(r.erreur).not.toBeNull()
  })

  it('tolere une date separee par des espaces plutot que des tirets', () => {
    const r = parseLigneColonneUnique('10011 إيمان الفرشيشي 29 08 2016 23456789', 11, AUJOURDHUI)
    expect(r.statut).toBe('corrigee')
    expect(r.dateNaissance).toBe('2016-08-29')
  })
})

describe('parserColonneUnique', () => {
  it('ignore les lignes vides et les en-tetes de mois arabe', () => {
    const lignes = [
      'جانفي',
      '',
      '10001 محمد التونسي 12-05-2008 23456789',
      '   ',
      'أوت 2024',
      '10002 فاطمة الزغلامي 10-03-2010 34567890'
    ]
    const resultats = parserColonneUnique(lignes, AUJOURDHUI)
    expect(resultats).toHaveLength(2)
    expect(resultats.map((r) => r.numeroAbonne)).toEqual(['10001', '10002'])
  })

  it('conserve l\'index de ligne original pour retrouver la ligne dans le fichier', () => {
    const lignes = ['جانفي', '10001 محمد التونسي 12-05-2008 23456789']
    const resultats = parserColonneUnique(lignes, AUJOURDHUI)
    expect(resultats[0]!.index).toBe(1)
  })
})
