import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import ExcelJS from 'exceljs'
import { afterEach, describe, expect, it } from 'vitest'
import { lireFichierImport } from './lecteurFichier'

const fichiersTemporaires: string[] = []

function cheminTemporaire(nom: string): string {
  const p = path.join(os.tmpdir(), `test-import-${Date.now()}-${nom}`)
  fichiersTemporaires.push(p)
  return p
}

afterEach(() => {
  for (const p of fichiersTemporaires.splice(0)) {
    fs.rmSync(p, { force: true })
  }
})

describe('lireFichierImport', () => {
  it('lit un classeur xlsx a une seule colonne', async () => {
    const classeur = new ExcelJS.Workbook()
    const feuille = classeur.addWorksheet('Abonnes')
    feuille.addRow(['10001 محمد التونسي 12-05-2008 23456789'])
    feuille.addRow(['10002 سارة العماري 10-03-2010 34567890'])
    const p = cheminTemporaire('colonne-unique.xlsx')
    await classeur.xlsx.writeFile(p)

    const { lignes } = await lireFichierImport(p)
    expect(lignes).toHaveLength(2)
    expect(lignes[0]![0]).toContain('10001')
  })

  it('lit un classeur xlsx structure avec plusieurs colonnes et convertit les dates Excel', async () => {
    const classeur = new ExcelJS.Workbook()
    const feuille = classeur.addWorksheet('Abonnes')
    feuille.addRow(['Code-barres', 'Prenom', 'Nom', 'Date de naissance'])
    feuille.addRow(['99000123', 'Karim', 'Chouikh', new Date(2008, 4, 12)])
    const p = cheminTemporaire('mapping.xlsx')
    await classeur.xlsx.writeFile(p)

    const { lignes } = await lireFichierImport(p)
    expect(lignes[0]).toEqual(['Code-barres', 'Prenom', 'Nom', 'Date de naissance'])
    expect(lignes[1]![3]).toBe('12-05-2008')
  })

  it('lit un fichier csv', async () => {
    const p = cheminTemporaire('abonnes.csv')
    fs.writeFileSync(p, 'Code-barres,Prenom,Nom\n99000123,Karim,Chouikh\n', 'utf8')
    const { lignes } = await lireFichierImport(p)
    expect(lignes[0]).toEqual(['Code-barres', 'Prenom', 'Nom'])
    expect(lignes[1]).toEqual(['99000123', 'Karim', 'Chouikh'])
  })

  it('rejette une extension non supportee', async () => {
    const p = cheminTemporaire('abonnes.txt')
    fs.writeFileSync(p, 'peu importe', 'utf8')
    await expect(lireFichierImport(p)).rejects.toThrow(/non supporte/)
  })
})
