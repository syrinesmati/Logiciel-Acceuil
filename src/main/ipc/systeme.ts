import { ipcMain } from 'electron'
import { IPC } from '@shared/ipc'
import type { AppDb } from '../db/client'
import { visites } from '../db/schema'
import { LocalAbonneSource } from '../services/abonneSource'

export function enregistrerIpcSysteme(db: AppDb): void {
  const abonneSource = new LocalAbonneSource(db)

  ipcMain.handle(IPC.systemeCompteursDemarrage, () => {
    return {
      nbAbonnes: abonneSource.countActifs(),
      nbVisites: db.select({ id: visites.id }).from(visites).all().length
    }
  })
}
