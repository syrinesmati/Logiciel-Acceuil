import { join } from 'node:path'
import { BrowserWindow, ipcMain } from 'electron'
import { is } from '@electron-toolkit/utils'
import { IPC } from '@shared/ipc'
import type { FiltrePeriode } from '@shared/stats'

const DELAI_MAX_MS = 15_000

function construireParametresUrl(filtre: FiltrePeriode): string {
  const params = new URLSearchParams({ type: filtre.type })
  if (filtre.dateDebut) params.set('dateDebut', filtre.dateDebut)
  if (filtre.dateFin) params.set('dateFin', filtre.dateFin)
  return params.toString()
}

/**
 * Genere le PDF du rapport de statistiques (voir 4.6) : charge la page de
 * rapport dediee dans une fenetre invisible, attend qu'elle signale qu'elle a
 * fini de charger ses donnees et de dessiner ses graphiques, puis imprime.
 */
export function genererPdfRapport(filtre: FiltrePeriode): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const fenetre = new BrowserWindow({
      show: false,
      width: 900,
      height: 1400,
      webPreferences: {
        preload: join(__dirname, '../preload/index.mjs'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false
      }
    })

    let termine = false
    const nettoyer = (): void => {
      if (termine) return
      termine = true
      clearTimeout(minuteur)
      ipcMain.removeListener(IPC.rapportSignalerPret, onPret)
      if (!fenetre.isDestroyed()) fenetre.destroy()
    }

    const minuteur = setTimeout(() => {
      nettoyer()
      reject(new Error('Le rapport a mis trop de temps a se generer.'))
    }, DELAI_MAX_MS)

    function onPret(event: Electron.IpcMainEvent): void {
      if (event.sender !== fenetre.webContents || termine) return
      fenetre.webContents
        .printToPDF({ printBackground: true, pageSize: 'A4', margins: { top: 0.4, bottom: 0.4, left: 0.4, right: 0.4 } })
        .then((buffer) => {
          nettoyer()
          resolve(buffer)
        })
        .catch((erreur) => {
          nettoyer()
          reject(erreur)
        })
    }
    ipcMain.on(IPC.rapportSignalerPret, onPret)

    fenetre.webContents.once('did-fail-load', (_e, _code, description) => {
      nettoyer()
      reject(new Error(`Echec du chargement du rapport : ${description}`))
    })

    const hash = `/rapport?${construireParametresUrl(filtre)}`
    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      fenetre.loadURL(`${process.env['ELECTRON_RENDERER_URL']}#${hash}`)
    } else {
      fenetre.loadFile(join(__dirname, '../renderer/index.html'), { hash })
    }
  })
}
