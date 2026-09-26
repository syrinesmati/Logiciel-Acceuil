import ExcelJS from 'exceljs'
import { describe, expect, it } from 'vitest'
import { parserColonneUnique } from './parseurColonneUnique'
import { detecterConflitsDansFichier } from './conflits'
import { construireClasseurErreurs } from './exportErreurs'

const AUJOURDHUI = new Date('2026-09-26')

describe('construireClasseurErreurs', () => {
  it("n'exporte que les lignes rejetees et a verifier, pas les OK/corrigees", async () => {
    const lignes = detecterConflitsDansFichier(
      parserColonneUnique(
        [
          '10001 محمد التونسي 12-05-2008 23456789', // ok
          '10002 كريم الشارني 3008-2004 34567890', // corrigee
          '10003 نور الفرشيشي 12-05-2008', // a_verifier (telephone manquant)
          'خالد بن علي 12-05-2008 23456789' // rejetee
        ],
        AUJOURDHUI
      )
    )

    const buffer = await construireClasseurErreurs(lignes)
    const classeur = new ExcelJS.Workbook()
    // exceljs embarque sa propre version (plus ancienne) des types Buffer de @types/node,
    // structurellement incompatible avec la notre : le contenu est correct a l'execution.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await classeur.xlsx.load(buffer as any)
    const feuille = classeur.worksheets[0]!

    expect(feuille.rowCount).toBe(3) // en-tete + 2 lignes (a_verifier + rejetee)
    expect(feuille.getRow(2).getCell(1).value).toBe('A verifier')
    expect(feuille.getRow(3).getCell(1).value).toBe('Rejetee')
    expect(feuille.getRow(3).getCell(7).value).toContain("numero d'abonne introuvable")
  })
})
