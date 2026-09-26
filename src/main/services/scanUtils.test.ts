import { describe, expect, it } from 'vitest'
import { nettoyerNumeroScanne } from './scanUtils'

describe('nettoyerNumeroScanne', () => {
  it('retire les espaces autour du numero', () => {
    expect(nettoyerNumeroScanne('  10001  ')).toBe('10001')
  })

  it('retire les zeros parasites en tete', () => {
    expect(nettoyerNumeroScanne('0010001')).toBe('10001')
  })

  it('retire les caracteres non numeriques eventuels du scanner', () => {
    expect(nettoyerNumeroScanne('\t10001\r\n')).toBe('10001')
    expect(nettoyerNumeroScanne('ABC10001')).toBe('10001')
  })

  it('ne renvoie pas une chaine vide pour un numero compose uniquement de zeros', () => {
    expect(nettoyerNumeroScanne('0000')).toBe('0')
  })

  it('laisse un numero deja propre inchange', () => {
    expect(nettoyerNumeroScanne('99000123')).toBe('99000123')
  })
})
