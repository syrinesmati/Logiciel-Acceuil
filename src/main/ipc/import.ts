import fs from 'node:fs/promises'
import { dialog, ipcMain, BrowserWindow } from 'electron'
import { IPC } from '@shared/ipc'
import {
  analyserFichierSchema,
  correctionManuelleSchema,
  executerImportSchema,
  exporterErreursSchema
} from '@shared/schemas'
import type { AppDb } from '../db/client'
import {
  analyserFichier,
  corrigerLigneManuellement,
  executerImport,
  ignorerLigneACorriger,
  listerHistoriqueImports,
  listerLignesACorriger
} from '../services/importService'
import { construireClasseurErreurs } from '../services/importParser/exportErreurs'

export function enregistrerIpcImport(db: AppDb): void {
  ipcMain.handle(IPC.importChoisirFichier, async (event) => {
    // App mono-fenetre : l'appel IPC vient toujours de la fenetre principale.
    const fenetre = BrowserWindow.fromWebContents(event.sender)!
    const resultat = await dialog.showOpenDialog(fenetre, {
      title: "Choisir un fichier d'import Syracuse",
      properties: ['openFile'],
      filters: [
        { name: 'Fichiers Excel ou CSV', extensions: ['xlsx', 'xls', 'csv'] },
        { name: 'Tous les fichiers', extensions: ['*'] }
      ]
    })
    if (resultat.canceled || resultat.filePaths.length === 0) return null
    return resultat.filePaths[0]!
  })

  ipcMain.handle(IPC.importAnalyserFichier, async (_event, payloadBrut) => {
    const payload = analyserFichierSchema.parse(payloadBrut)
    return analyserFichier(payload.cheminFichier, payload.nomFichier, db, payload.mappage)
  })

  ipcMain.handle(IPC.importExecuterImport, (_event, payloadBrut) => {
    const payload = executerImportSchema.parse(payloadBrut)
    return executerImport(payload.lignes, payload.nomFichier, db)
  })

  ipcMain.handle(IPC.importExporterErreurs, async (event, payloadBrut) => {
    const payload = exporterErreursSchema.parse(payloadBrut)
    const buffer = await construireClasseurErreurs(payload.lignes)

    const fenetre = BrowserWindow.fromWebContents(event.sender)!
    const resultat = await dialog.showSaveDialog(fenetre, {
      title: "Exporter les erreurs d'import",
      defaultPath: `erreurs_import_${new Date().toISOString().slice(0, 10)}.xlsx`,
      filters: [{ name: 'Classeur Excel', extensions: ['xlsx'] }]
    })
    if (resultat.canceled || !resultat.filePath) return null

    await fs.writeFile(resultat.filePath, buffer)
    return resultat.filePath
  })

  ipcMain.handle(IPC.importListerHistorique, () => listerHistoriqueImports(db))

  ipcMain.handle(IPC.importListerLignesACorriger, () => listerLignesACorriger(db))

  ipcMain.handle(IPC.importCorrigerLigne, (_event, payloadBrut) => {
    const payload = correctionManuelleSchema.parse(payloadBrut)
    return corrigerLigneManuellement(
      payload.id,
      {
        numeroAbonne: payload.numeroAbonne,
        nomComplet: payload.nomComplet,
        dateNaissance: payload.dateNaissance,
        telephone: payload.telephone,
        email: payload.email
      },
      db
    )
  })

  ipcMain.handle(IPC.importIgnorerLigne, (_event, id: number) => {
    ignorerLigneACorriger(id, db)
  })
}
