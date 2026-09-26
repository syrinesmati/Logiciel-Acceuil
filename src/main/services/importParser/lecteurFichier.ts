import fs from 'node:fs'
import path from 'node:path'
import ExcelJS from 'exceljs'
import Papa from 'papaparse'

export interface FeuilleLue {
  /** Une ligne par ligne source, chaque cellule deja convertie en texte. */
  lignes: string[][]
}

interface CelluleRiche {
  richText?: { text: string }[]
  text?: string
  result?: unknown
}

function formatCellule(valeur: unknown): string {
  if (valeur === null || valeur === undefined) return ''
  if (valeur instanceof Date) {
    const jj = String(valeur.getDate()).padStart(2, '0')
    const mm = String(valeur.getMonth() + 1).padStart(2, '0')
    const aaaa = valeur.getFullYear()
    return `${jj}-${mm}-${aaaa}`
  }
  if (typeof valeur === 'object') {
    const riche = valeur as CelluleRiche
    if (Array.isArray(riche.richText)) return riche.richText.map((rt) => rt.text).join('')
    if ('result' in riche) return formatCellule(riche.result)
    if (typeof riche.text === 'string') return riche.text
  }
  return String(valeur).trim()
}

async function lireXlsx(cheminFichier: string): Promise<FeuilleLue> {
  const classeur = new ExcelJS.Workbook()
  await classeur.xlsx.readFile(cheminFichier)
  const feuille = classeur.worksheets[0]
  if (!feuille) return { lignes: [] }

  const lignes: string[][] = []
  feuille.eachRow({ includeEmpty: true }, (row) => {
    const valeursBrutes = row.values as unknown[]
    const valeurs: string[] = []
    // ExcelJS est indexe a partir de 1 ; l'element 0 est toujours vide.
    for (let i = 1; i < valeursBrutes.length; i++) {
      valeurs.push(formatCellule(valeursBrutes[i]))
    }
    lignes.push(valeurs)
  })
  return { lignes }
}

function lireCsv(cheminFichier: string): FeuilleLue {
  const contenu = fs.readFileSync(cheminFichier, 'utf8')
  const resultat = Papa.parse<string[]>(contenu.replace(/^﻿/, ''), {
    skipEmptyLines: false
  })
  return {
    lignes: resultat.data.map((ligne) => ligne.map((cellule) => String(cellule ?? '').trim()))
  }
}

/** Lit un fichier d'import (.xlsx ou .csv) et renvoie ses lignes brutes, cellule par cellule. */
export async function lireFichierImport(cheminFichier: string): Promise<FeuilleLue> {
  const extension = path.extname(cheminFichier).toLowerCase()
  if (extension === '.csv') return lireCsv(cheminFichier)
  if (extension === '.xlsx' || extension === '.xls') return lireXlsx(cheminFichier)
  throw new Error(`Format de fichier non supporte : "${extension}". Utilisez un fichier .xlsx ou .csv.`)
}
