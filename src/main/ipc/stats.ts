import { ipcMain } from 'electron'
import { IPC } from '@shared/ipc'
import { filtrePeriodeSchema } from '@shared/schemas'
import type { AppDb } from '../db/client'
import { obtenirTableauDeBord } from '../services/statsService'

export function enregistrerIpcStats(db: AppDb): void {
  ipcMain.handle(IPC.statsObtenirTableauDeBord, (_event, payloadBrut) => {
    const filtre = filtrePeriodeSchema.parse(payloadBrut)
    return obtenirTableauDeBord(filtre, db)
  })
}
