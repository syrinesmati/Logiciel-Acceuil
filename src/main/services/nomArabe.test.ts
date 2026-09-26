import { describe, expect, it } from 'vitest'
import { normaliserNom } from './nomArabe'

describe('normaliserNom', () => {
  it('unifie les variantes de alef (أ إ آ -> ا)', () => {
    expect(normaliserNom('أحمد')).toBe(normaliserNom('احمد'))
    expect(normaliserNom('إحمد')).toBe(normaliserNom('احمد'))
    expect(normaliserNom('آحمد')).toBe(normaliserNom('احمد'))
  })

  it('remplace la ta marbouta par un ha (ة -> ه)', () => {
    expect(normaliserNom('فاطمة')).toBe(normaliserNom('فاطمه'))
  })

  it('remplace le alef maqsoura par un ya (ى -> ي)', () => {
    expect(normaliserNom('مصطفى')).toBe(normaliserNom('مصطفي'))
  })

  it('supprime les diacritiques (tachkil)', () => {
    expect(normaliserNom('مُحَمَّد')).toBe(normaliserNom('محمد'))
  })

  it('supprime le tatweel', () => {
    expect(normaliserNom('محـــمد')).toBe(normaliserNom('محمد'))
  })

  it('normalise les espaces multiples et les bords', () => {
    expect(normaliserNom('  Mohamed   Ali  ')).toBe('mohamed ali')
  })

  it('met en minuscules les noms latins pour une comparaison insensible a la casse', () => {
    expect(normaliserNom('BEN SALAH')).toBe(normaliserNom('ben salah'))
  })
})
