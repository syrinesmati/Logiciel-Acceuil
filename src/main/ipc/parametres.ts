import { app, dialog, ipcMain, BrowserWindow } from 'electron'
import { IPC } from '@shared/ipc'
import {
  activerMotifSchema,
  changerPinSchema,
  modifierMotifSchema,
  motifEntreeSchema,
  parametresGenerauxSchema,
  pinSchema,
  reordonnerMotifsSchema,
  restaurerSauvegardeSchema
} from '@shared/schemas'
import { closeDb, getCheminDb, getSqliteInstance, type AppDb } from '../db/client'
import { changerPin, definirPin, pinEstDefini, verifierPin } from '../services/pinService'
import { obtenirParametresGeneraux, enregistrerParametresGeneraux } from '../services/parametresService'
import {
  analyserFichierSauvegarde,
  nommerFichierSauvegardeManuelle,
  restaurerDepuis,
  sauvegarderVers
} from '../services/backupService'
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

  ipcMain.handle(IPC.parametresSauvegarderMaintenant, async (event) => {
    const fenetre = BrowserWindow.fromWebContents(event.sender)!
    const resultat = await dialog.showSaveDialog(fenetre, {
      title: 'Sauvegarder la base de donnees',
      defaultPath: nommerFichierSauvegardeManuelle(),
      filters: [{ name: 'Base de donnees SQLite', extensions: ['sqlite'] }]
    })
    if (resultat.canceled || !resultat.filePath) return null

    await sauvegarderVers(getSqliteInstance(), resultat.filePath)
    return resultat.filePath
  })

  ipcMain.handle(IPC.parametresChoisirFichierSauvegarde, async (event) => {
    const fenetre = BrowserWindow.fromWebContents(event.sender)!
    const resultat = await dialog.showOpenDialog(fenetre, {
      title: 'Choisir un fichier de sauvegarde',
      properties: ['openFile'],
      filters: [{ name: 'Base de donnees SQLite', extensions: ['sqlite'] }]
    })
    if (resultat.canceled || resultat.filePaths.length === 0) return null

    return analyserFichierSauvegarde(resultat.filePaths[0]!)
  })

  // Remplace la base par le fichier de sauvegarde choisi puis relance
  // immediatement l'app : ce n'est pas une operation a chaud, tout l'etat en
  // memoire (connexion SQLite, ecrans ouverts) doit repartir de zero.
  ipcMain.handle(IPC.parametresRestaurerSauvegarde, (_event, payloadBrut) => {
    const { chemin } = restaurerSauvegardeSchema.parse({ chemin: payloadBrut })
    const cheminDb = getCheminDb()
    closeDb()
    restaurerDepuis(chemin, cheminDb)
    app.relaunch()
    app.exit()
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
