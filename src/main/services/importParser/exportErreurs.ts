import ExcelJS from 'exceljs'
import type { LigneImportParsee } from '@shared/import'

/**
 * Construit un classeur Excel listant les lignes rejetees ou a verifier, pour
 * que la bibliotheque puisse corriger ces fiches directement dans Syracuse.
 */
export async function construireClasseurErreurs(lignes: LigneImportParsee[]): Promise<Buffer> {
  const classeur = new ExcelJS.Workbook()
  const feuille = classeur.addWorksheet('Lignes a corriger')

  feuille.columns = [
    { header: 'Statut', key: 'statut', width: 14 },
    { header: 'Numero abonne', key: 'numero', width: 18 },
    { header: 'Nom complet', key: 'nom', width: 30 },
    { header: 'Date de naissance', key: 'date', width: 18 },
    { header: 'Telephone', key: 'telephone', width: 14 },
    { header: 'Email', key: 'email', width: 26 },
    { header: 'Details', key: 'details', width: 60 },
    { header: 'Ligne source', key: 'source', width: 60 }
  ]
  feuille.getRow(1).font = { bold: true }

  const lignesAExporter = lignes.filter((l) => l.statut === 'rejetee' || l.statut === 'a_verifier')

  for (const ligne of lignesAExporter) {
    const details = [ligne.erreur, ...ligne.avertissements].filter(Boolean).join(' | ')
    const source =
      typeof ligne.ligneBrute === 'string' ? ligne.ligneBrute : JSON.stringify(ligne.ligneBrute)

    feuille.addRow({
      statut: ligne.statut === 'rejetee' ? 'Rejetee' : 'A verifier',
      numero: ligne.numeroAbonne ?? '',
      nom: ligne.nomComplet ?? '',
      date: ligne.dateNaissance ?? '',
      telephone: ligne.telephone ?? '',
      email: ligne.email ?? '',
      details,
      source
    })
  }

  const buffer = await classeur.xlsx.writeBuffer()
  return Buffer.from(buffer)
}
