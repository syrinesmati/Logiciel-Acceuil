import { describe, expect, it } from 'vitest'
import { ageEstPlausible, calculerAge, trouverTrancheAge, TRANCHE_AGE_INCONNU } from './age'

describe('calculerAge', () => {
  it("calcule l'age en annees revolues", () => {
    expect(calculerAge(new Date('2000-05-10'), new Date('2026-05-10'))).toBe(26)
    expect(calculerAge(new Date('2000-05-10'), new Date('2026-05-09'))).toBe(25)
    expect(calculerAge(new Date('2000-05-10'), new Date('2026-05-11'))).toBe(26)
  })

  it("calcule l'age a la date de la visite, pas a aujourd'hui", () => {
    expect(calculerAge(new Date('2010-01-01'), new Date('2020-06-15'))).toBe(10)
  })
})

describe('trouverTrancheAge', () => {
  it('classe correctement dans chaque tranche par defaut', () => {
    expect(trouverTrancheAge(5)).toBe('0-12')
    expect(trouverTrancheAge(15)).toBe('13-17')
    expect(trouverTrancheAge(20)).toBe('18-25')
    expect(trouverTrancheAge(30)).toBe('26-40')
    expect(trouverTrancheAge(50)).toBe('41-60')
    expect(trouverTrancheAge(70)).toBe('60+')
  })

  it('retourne "age_inconnu" quand la date de naissance est absente', () => {
    expect(trouverTrancheAge(null)).toBe(TRANCHE_AGE_INCONNU)
  })
})

describe('ageEstPlausible', () => {
  it('rejette les ages hors de la plage 2-100 ans', () => {
    expect(ageEstPlausible(1)).toBe(false)
    expect(ageEstPlausible(2)).toBe(true)
    expect(ageEstPlausible(100)).toBe(true)
    expect(ageEstPlausible(101)).toBe(false)
  })
})
