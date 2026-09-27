import fs from 'node:fs/promises'
import { dialog, ipcMain, BrowserWindow } from 'electron'
import { IPC } from '@shared/ipc'
import { filtrePeriodeSchema } from '@shared/schemas'
import type { AppDb } from '../db/client'
import { obtenirTableauDeBord } from '../services/statsService'
import { obtenirParametresGeneraux } from '../services/parametresService'
import { resoudrePeriode } from '../services/periode'
import { construireClasseurStatistiques, nommerFichierStatistiques } from '../services/exportStats'
import { genererPdfRapport } from '../services/exportPdf'

export function enregistrerIpcStats(db: AppDb): void {
  ipcMain.handle(IPC.statsObtenirTableauDeBord, (_event, payloadBrut) => {
    const filtre = filtrePeriodeSchema.parse(payloadBrut)
    return obtenirTableauDeBord(filtre, db)
  })

  ipcMain.handle(IPC.statsExporterExcel, async (event, payloadBrut) => {
    const filtre = filtrePeriodeSchema.parse(payloadBrut)
    const periode = resoudrePeriode(filtre, new Date())
    const { nomBibliotheque } = obtenirParametresGeneraux(db)
    const tableau = obtenirTableauDeBord(filtre, db)
    const buffer = await construireClasseurStatistiques(tableau, periode, nomBibliotheque)

    const fenetre = BrowserWindow.fromWebContents(event.sender)!
    // La boite de dialogue peut sinon s'ouvrir derriere la fenetre principale
    // (perceptible comme "le bouton ne fait rien") si celle-ci n'est plus au
    // premier plan au moment de l'appel.
    fenetre.focus()
    const resultat = await dialog.showSaveDialog(fenetre, {
      title: 'Exporter les statistiques en Excel',
      defaultPath: nommerFichierStatistiques(filtre, periode, 'xlsx'),
      filters: [{ name: 'Classeur Excel', extensions: ['xlsx'] }]
    })
    if (resultat.canceled || !resultat.filePath) return null

    await fs.writeFile(resultat.filePath, buffer)
    return resultat.filePath
  })

  ipcMain.handle(IPC.statsExporterPdf, async (event, payloadBrut) => {
    const filtre = filtrePeriodeSchema.parse(payloadBrut)
    const periode = resoudrePeriode(filtre, new Date())
    const buffer = await genererPdfRapport(filtre)

    const fenetre = BrowserWindow.fromWebContents(event.sender)!
    // Idem : la generation du PDF prend un instant, la fenetre principale a pu
    // perdre le focus entre-temps.
    fenetre.focus()
    const resultat = await dialog.showSaveDialog(fenetre, {
      title: 'Exporter le rapport en PDF',
      defaultPath: nommerFichierStatistiques(filtre, periode, 'pdf'),
      filters: [{ name: 'Document PDF', extensions: ['pdf'] }]
    })
    if (resultat.canceled || !resultat.filePath) return null

    await fs.writeFile(resultat.filePath, buffer)
    return resultat.filePath
  })
}
