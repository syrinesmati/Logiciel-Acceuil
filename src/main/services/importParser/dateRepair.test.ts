import { describe, expect, it } from 'vitest'
import { analyserDateNaissance } from './dateRepair'

const AUJOURDHUI = new Date('2026-09-26')

describe('analyserDateNaissance', () => {
  it('accepte directement une date bien formee jj-mm-aaaa', () => {
    const r = analyserDateNaissance('12-05-2008', AUJOURDHUI)
    expect(r.iso).toBe('2008-05-12')
    expect(r.correction).toBeNull()
    expect(r.avertissement).toBeNull()
  })

  it('repare "3008-2004" (tiret manquant jour/mois) -> 30-08-2004', () => {
    const r = analyserDateNaissance('3008-2004', AUJOURDHUI)
    expect(r.iso).toBe('2004-08-30')
    expect(r.correction).toContain('3008-2004')
  })

  it('repare "10-09--2005" (double tiret) -> 10-09-2005', () => {
    const r = analyserDateNaissance('10-09--2005', AUJOURDHUI)
    expect(r.iso).toBe('2005-09-10')
    expect(r.correction).not.toBeNull()
  })

  it('repare "18-092012" (tiret manquant mois/annee) -> 18-09-2012', () => {
    const r = analyserDateNaissance('18-092012', AUJOURDHUI)
    expect(r.iso).toBe('2012-09-18')
    expect(r.correction).not.toBeNull()
  })

  it('repare "19-009-2000" (chiffre en trop dans le mois) -> 19-09-2000', () => {
    const r = analyserDateNaissance('19-009-2000', AUJOURDHUI)
    expect(r.iso).toBe('2000-09-19')
    expect(r.correction).not.toBeNull()
  })

  it('repare "29 08 2016" (espaces au lieu de tirets) -> 29-08-2016', () => {
    const r = analyserDateNaissance('29 08 2016', AUJOURDHUI)
    expect(r.iso).toBe('2016-08-29')
    expect(r.correction).not.toBeNull()
  })

  it('ne peut pas reparer "17-09-" (annee manquante)', () => {
    const r = analyserDateNaissance('17-09-', AUJOURDHUI)
    expect(r.iso).toBeNull()
    expect(r.correction).toBeNull()
    expect(r.avertissement).not.toBeNull()
  })

  it('ne peut pas reparer une annee seule "2011"', () => {
    const r = analyserDateNaissance('2011', AUJOURDHUI)
    expect(r.iso).toBeNull()
    expect(r.avertissement).toContain('2011')
  })

  it('signale une date absente', () => {
    const r = analyserDateNaissance('', AUJOURDHUI)
    expect(r.iso).toBeNull()
    expect(r.avertissement).toContain('absente')
  })

  it('signale un age peu plausible mais garde la date reconnue', () => {
    // 1 an en 2026 : trop jeune pour un abonne de bibliotheque (limite basse = 2 ans)
    const r = analyserDateNaissance('01-06-2025', AUJOURDHUI)
    expect(r.iso).toBe('2025-06-01')
    expect(r.avertissement).toContain('plausible')
  })

  it('rejette un jour ou un mois hors calendrier meme apres reparation', () => {
    const r = analyserDateNaissance('35-13-2000', AUJOURDHUI)
    expect(r.iso).toBeNull()
    expect(r.avertissement).not.toBeNull()
  })
})
