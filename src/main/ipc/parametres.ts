import { ipcMain } from 'electron'
import { IPC } from '@shared/ipc'
import {
  activerMotifSchema,
  changerPinSchema,
  modifierMotifSchema,
  motifEntreeSchema,
  parametresGenerauxSchema,
  pinSchema,
  reordonnerMotifsSchema
} from '@shared/schemas'
import type { AppDb } from '../db/client'
import { changerPin, definirPin, pinEstDefini, verifierPin } from '../services/pinService'
import { obtenirParametresGeneraux, enregistrerParametresGeneraux } from '../services/parametresService'
import {
  activerDesactiverMotif,
  creerMotif,
  listerTousLesMotifs,
  modifierMotif,
  reordonnerMotifs
} from '../services/motifsService'

export function enregistrerIpcParametres(db: AppDb): void {
  ipcMain.handle(IPC.parametresPinEstDefini, () => pinEstDefini(db))

  ipcMain.handle(IPC.parametresDefinirPin, (_event, payloadBrut) => {
    const { pin } = pinSchema.parse({ pin: payloadBrut })
    definirPin(pin, db)
  })

  ipcMain.handle(IPC.parametresVerifierPin, (_event, payloadBrut) => {
    const { pin } = pinSchema.parse({ pin: payloadBrut })
    return verifierPin(pin, db)
  })

  ipcMain.handle(IPC.parametresChangerPin, (_event, payloadBrut) => {
    const payload = changerPinSchema.parse(payloadBrut)
    return changerPin(payload.ancienPin, payload.nouveauPin, db)
  })

  ipcMain.handle(IPC.parametresObtenirGeneraux, () => obtenirParametresGeneraux(db))

  ipcMain.handle(IPC.parametresEnregistrerGeneraux, (_event, payloadBrut) => {
    const payload = parametresGenerauxSchema.parse(payloadBrut)
    enregistrerParametresGeneraux(payload, db)
  })

  ipcMain.handle(IPC.parametresListerMotifs, () => listerTousLesMotifs(db))

  ipcMain.handle(IPC.parametresCreerMotif, (_event, payloadBrut) => {
    const payload = motifEntreeSchema.parse(payloadBrut)
    return creerMotif(payload, db)
  })

  ipcMain.handle(IPC.parametresModifierMotif, (_event, payloadBrut) => {
    const payload = modifierMotifSchema.parse(payloadBrut)
    return modifierMotif(payload.id, payload, db)
  })

  ipcMain.handle(IPC.parametresActiverMotif, (_event, payloadBrut) => {
    const payload = activerMotifSchema.parse(payloadBrut)
    return activerDesactiverMotif(payload.id, payload.actif, db)
  })

  ipcMain.handle(IPC.parametresReordonnerMotifs, (_event, payloadBrut) => {
    const { ordreIds } = reordonnerMotifsSchema.parse({ ordreIds: payloadBrut })
    reordonnerMotifs(ordreIds, db)
  })
}
