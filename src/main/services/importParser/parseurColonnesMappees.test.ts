import { describe, expect, it } from 'vitest'
import type { EnteteColonne, MappageColonnes } from '@shared/import'
import { parserColonnesMappees } from './parseurColonnesMappees'

const AUJOURDHUI = new Date('2026-09-26')

const COLONNES: EnteteColonne[] = [
  { cle: 'col_0', libelle: 'Code-barres', exemple: '99000123' },
  { cle: 'col_1', libelle: 'Prenom', exemple: 'Karim' },
  { cle: 'col_2', libelle: 'Nom', exemple: 'Chouikh' },
  { cle: 'col_3', libelle: 'Date de naissance', exemple: '12-05-2008' },
  { cle: 'col_4', libelle: 'Ville', exemple: '' },
  { cle: 'col_5', libelle: 'Inscrit a', exemple: "Bibliotheque de l'Ariana" },
  { cle: 'col_6', libelle: 'Email', exemple: '' }
]

const MAPPAGE: MappageColonnes = {
  numeroAbonne: 'col_0',
  prenom: 'col_1',
  nom: 'col_2',
  dateNaissance: 'col_3',
  email: 'col_6'
}

describe('parserColonnesMappees', () => {
  it('importe une ligne complete et coherente en statut "ok"', () => {
    const lignes = [['99000123', 'Karim', 'Chouikh', '12-05-2008', '', "Bibliotheque de l'Ariana", '']]
    const r = parserColonnesMappees(lignes, COLONNES, MAPPAGE, AUJOURDHUI)
    expect(r).toHaveLength(1)
    expect(r[0]!.statut).toBe('ok')
    expect(r[0]!.numeroAbonne).toBe('99000123')
    expect(r[0]!.nomComplet).toBe('Karim Chouikh')
    expect(r[0]!.dateNaissance).toBe('2008-05-12')
  })

  it('rejette une ligne sans code-barres (valeur "-")', () => {
    const lignes = [['-', 'Karim', 'Chouikh', '12-05-2008', '', "Bibliotheque de l'Ariana", 'k@example.com']]
    const r = parserColonnesMappees(lignes, COLONNES, MAPPAGE, AUJOURDHUI)
    expect(r[0]!.statut).toBe('rejetee')
    expect(r[0]!.numeroAbonne).toBeNull()
  })

  it('signale un prenom manquant sans rejeter la ligne', () => {
    const lignes = [['99000124', '', 'Chouikh', '12-05-2008', '', "Bibliotheque de l'Ariana", '']]
    const r = parserColonnesMappees(lignes, COLONNES, MAPPAGE, AUJOURDHUI)
    expect(r[0]!.statut).toBe('a_verifier')
    expect(r[0]!.nomComplet).toBe('Chouikh')
    expect(r[0]!.avertissements.some((a) => a.includes('prenom manquant'))).toBe(true)
  })

  it('signale une date de naissance donnant un age peu plausible', () => {
    const lignes = [['99000125', 'Bebe', 'Chouikh', '28-06-2026', '', "Bibliotheque de l'Ariana", '']]
    const r = parserColonnesMappees(lignes, COLONNES, MAPPAGE, AUJOURDHUI)
    expect(r[0]!.statut).toBe('a_verifier')
    expect(r[0]!.dateNaissance).toBe('2026-06-28')
  })

  it('ignore les lignes entierement vides', () => {
    const lignes = [
      ['99000123', 'Karim', 'Chouikh', '12-05-2008', '', "Bibliotheque de l'Ariana", ''],
      ['', '', '', '', '', '', '']
    ]
    const r = parserColonnesMappees(lignes, COLONNES, MAPPAGE, AUJOURDHUI)
    expect(r).toHaveLength(1)
  })

  it('corrige une date mal formee dans une cellule (mode mapping)', () => {
    const lignes = [['99000126', 'Nour', 'Ferchichi', '29 08 2016', '', "Bibliotheque de l'Ariana", '']]
    const r = parserColonnesMappees(lignes, COLONNES, MAPPAGE, AUJOURDHUI)
    expect(r[0]!.statut).toBe('corrigee')
    expect(r[0]!.dateNaissance).toBe('2016-08-29')
  })

  it('accepte un telephone quand la colonne est mappee et signale une longueur inhabituelle', () => {
    const colonnesAvecTel: EnteteColonne[] = [
      ...COLONNES.slice(0, 4),
      { cle: 'col_tel', libelle: 'Telephone', exemple: '23456789' }
    ]
    const mappageAvecTel: MappageColonnes = { ...MAPPAGE, telephone: 'col_tel' }
    const lignes = [['99000127', 'Sami', 'Gharbi', '12-05-2008', '3456789']]
    const r = parserColonnesMappees(lignes, colonnesAvecTel, mappageAvecTel, AUJOURDHUI)
    expect(r[0]!.telephone).toBe('3456789')
    expect(r[0]!.avertissements.some((a) => a.includes('longueur inhabituelle'))).toBe(true)
  })
})
