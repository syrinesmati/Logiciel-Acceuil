import { describe, expect, it } from 'vitest'
import { nombreDeJours, periodePrecedente, resoudrePeriode } from './periode'

// Dimanche 27 septembre 2026
const REFERENCE = new Date(2026, 8, 27, 14, 30)

function fmt(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

describe('resoudrePeriode', () => {
  it('aujourdhui : minuit a minuit le lendemain', () => {
    const p = resoudrePeriode({ type: 'aujourdhui' }, REFERENCE)
    expect(fmt(p.debut)).toBe('2026-09-27')
    expect(fmt(p.fin)).toBe('2026-09-28')
  })

  it('semaine : du lundi au lundi suivant (semaine ISO)', () => {
    const p = resoudrePeriode({ type: 'semaine' }, REFERENCE)
    expect(fmt(p.debut)).toBe('2026-09-21') // lundi
    expect(fmt(p.fin)).toBe('2026-09-28') // lundi suivant
  })

  it('mois : du 1er du mois au 1er du mois suivant', () => {
    const p = resoudrePeriode({ type: 'mois' }, REFERENCE)
    expect(fmt(p.debut)).toBe('2026-09-01')
    expect(fmt(p.fin)).toBe('2026-10-01')
  })

  it("annee : du 1er janvier au 1er janvier de l'annee suivante", () => {
    const p = resoudrePeriode({ type: 'annee' }, REFERENCE)
    expect(fmt(p.debut)).toBe('2026-01-01')
    expect(fmt(p.fin)).toBe('2027-01-01')
  })

  it('personnalisee : date de fin incluse (borne exclusive = fin + 1 jour)', () => {
    const p = resoudrePeriode({ type: 'personnalisee', dateDebut: '2026-01-10', dateFin: '2026-01-15' }, REFERENCE)
    expect(fmt(p.debut)).toBe('2026-01-10')
    expect(fmt(p.fin)).toBe('2026-01-16')
  })

  it('personnalisee : leve une erreur si les dates sont manquantes', () => {
    expect(() => resoudrePeriode({ type: 'personnalisee' }, REFERENCE)).toThrow()
  })

  it('personnalisee : leve une erreur si la date de fin precede la date de debut', () => {
    expect(() =>
      resoudrePeriode({ type: 'personnalisee', dateDebut: '2026-01-15', dateFin: '2026-01-10' }, REFERENCE)
    ).toThrow()
  })
})

describe('periodePrecedente', () => {
  it('renvoie une periode de meme duree (en jours) immediatement avant', () => {
    const p = resoudrePeriode({ type: 'semaine' }, REFERENCE) // 7 jours, du 21 au 28 septembre
    const precedente = periodePrecedente(p)
    expect(fmt(precedente.debut)).toBe('2026-09-14')
    expect(fmt(precedente.fin)).toBe('2026-09-21')
  })

  it("accole exactement la periode precedente a la periode actuelle (pas de trou ni de chevauchement)", () => {
    const p = resoudrePeriode({ type: 'mois' }, REFERENCE)
    const precedente = periodePrecedente(p)
    expect(precedente.fin.getTime()).toBe(p.debut.getTime())
  })
})

describe('nombreDeJours', () => {
  it('compte les jours entiers de la periode', () => {
    const p = resoudrePeriode({ type: 'semaine' }, REFERENCE)
    expect(nombreDeJours(p)).toBe(7)
  })
})
