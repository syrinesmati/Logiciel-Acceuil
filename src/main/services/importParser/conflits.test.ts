import { describe, expect, it } from 'vitest'
import { parserColonneUnique } from './parseurColonneUnique'
import { detecterConflitsAvecBase, detecterConflitsDansFichier } from './conflits'

const AUJOURDHUI = new Date('2026-09-26')

describe('detecterConflitsDansFichier', () => {
  it('rejette les lignes qui partagent un numero mais des noms differents', () => {
    const lignes = parserColonneUnique(
      [
        '10001 محمد التونسي 12-05-2008 23456789',
        '10001 كريم الشارني 10-03-2010 34567890',
        '10002 سارة العماري 12-05-2008 23456789'
      ],
      AUJOURDHUI
    )
    const resultat = detecterConflitsDansFichier(lignes)
    expect(resultat[0]!.statut).toBe('rejetee')
    expect(resultat[1]!.statut).toBe('rejetee')
    expect(resultat[2]!.statut).toBe('ok')
    expect(resultat[0]!.erreur).toContain('10001')
  })

  it('ne signale pas de conflit si le meme numero correspond au meme nom (variantes orthographiques incluses)', () => {
    const lignes = parserColonneUnique(
      ['10001 محمد التونسي 12-05-2008 23456789', '10001 محمّد التونسي 12-05-2008 23456789'],
      AUJOURDHUI
    )
    const resultat = detecterConflitsDansFichier(lignes)
    expect(resultat.every((l) => l.statut !== 'rejetee')).toBe(true)
  })

  it('ne modifie rien en l\'absence de conflit', () => {
    const lignes = parserColonneUnique(
      ['10001 محمد التونسي 12-05-2008 23456789', '10002 سارة العماري 12-05-2008 23456789'],
      AUJOURDHUI
    )
    expect(detecterConflitsDansFichier(lignes)).toEqual(lignes)
  })
})

describe('detecterConflitsAvecBase', () => {
  it('rejette une ligne dont le numero existe deja en base avec un nom different', () => {
    const lignes = parserColonneUnique(['10001 محمد التونسي 12-05-2008 23456789'], AUJOURDHUI)
    const resultat = detecterConflitsAvecBase(lignes, (numero) =>
      numero === '10001' ? 'Quelqu\'un d\'autre' : null
    )
    expect(resultat[0]!.statut).toBe('rejetee')
    expect(resultat[0]!.erreur).toContain('10001')
  })

  it('accepte une mise a jour normale (meme numero, meme nom en base)', () => {
    const lignes = parserColonneUnique(['10001 محمد التونسي 12-05-2008 23456789'], AUJOURDHUI)
    const resultat = detecterConflitsAvecBase(lignes, (numero) =>
      numero === '10001' ? 'محمد التونسي' : null
    )
    expect(resultat[0]!.statut).toBe('ok')
  })
})
