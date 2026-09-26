import { describe, expect, it } from 'vitest'
import { detecterFormat } from './detectionFormat'

describe('detecterFormat', () => {
  it('detecte le mode "colonne unique" quand chaque ligne n\'a qu\'une seule cellule remplie', () => {
    const lignes = [['10001 محمد التونسي 12-05-2008 23456789'], ['10002 سارة العماري 12-05-2008 34567890']]
    const format = detecterFormat(lignes)
    expect(format.mode).toBe('colonne_unique')
  })

  it("detecte le mode mapping de colonnes et propose un mappage a partir des en-tetes reels de Syracuse", () => {
    const lignes = [
      ['Code-barres', 'Prenom', 'Nom', 'Date de naissance', 'Ville', 'Inscrit a', 'Email'],
      ['99000123', 'Karim', 'Chouikh', '12-05-2008', '', "Bibliotheque de l'Ariana", '']
    ]
    const format = detecterFormat(lignes)
    expect(format.mode).toBe('mapping_colonnes')
    expect(format.colonnes).toHaveLength(7)
    expect(format.mappageSuggere).toMatchObject({
      numeroAbonne: 'col_0',
      prenom: 'col_1',
      nom: 'col_2',
      dateNaissance: 'col_3',
      email: 'col_6'
    })
  })

  it('ignore les eventuelles lignes vides en tete de fichier avant de detecter le format', () => {
    const lignes = [
      [''],
      ['Code-barres', 'Nom complet', 'Date de naissance', 'Telephone'],
      ['10001', 'Mohamed Tounsi', '12-05-2008', '23456789']
    ]
    const format = detecterFormat(lignes)
    expect(format.mode).toBe('mapping_colonnes')
    expect(format.mappageSuggere).toMatchObject({
      numeroAbonne: 'col_0',
      nomComplet: 'col_1',
      dateNaissance: 'col_2',
      telephone: 'col_3'
    })
  })
})
