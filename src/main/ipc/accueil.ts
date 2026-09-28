import { ipcMain } from 'electron'
import { IPC } from '@shared/ipc'
import {
  completerSexeSchema,
  enregistrerVisiteSchema,
  inscriptionNonAbonneSchema,
  rechercherNumeroSchema,
  rechercherParNomSchema
} from '@shared/schemas'
import type { AppDb } from '../db/client'
import { listerMotifsActifs } from '../services/motifsService'
import { obtenirParametresAccueil } from '../services/parametresService'
import {
  completerSexe,
  compterVisitesAujourdhui,
  enregistrerVisite,
  inscrireNonAbonne,
  rechercherAbonnePourVisite,
  rechercherAbonnesParNom
} from '../services/accueilService'

export function enregistrerIpcAccueil(db: AppDb): void {
  ipcMain.handle(IPC.accueilListerMotifs, () => listerMotifsActifs(db))

  ipcMain.handle(IPC.accueilRechercherNumero, (_event, payloadBrut) => {
    const { numero } = rechercherNumeroSchema.parse({ numero: payloadBrut })
    const { delaiAntiDoubleScanSecondes } = obtenirParametresAccueil(db)
    return rechercherAbonnePourVisite(numero, db, delaiAntiDoubleScanSecondes)
  })

  ipcMain.handle(IPC.accueilInscrireNonAbonne, (_event, payloadBrut) => {
    const payload = inscriptionNonAbonneSchema.parse(payloadBrut)
    return inscrireNonAbonne(payload, db)
  })

  ipcMain.handle(IPC.accueilCompleterSexe, (_event, payloadBrut) => {
    const payload = completerSexeSchema.parse(payloadBrut)
    return completerSexe(payload.abonneId, payload.sexe, db)
  })

  ipcMain.handle(IPC.accueilEnregistrerVisite, (_event, payloadBrut) => {
    const payload = enregistrerVisiteSchema.parse(payloadBrut)
    return enregistrerVisite(payload, db)
  })

  ipcMain.handle(IPC.accueilCompteurAujourdhui, () => compterVisitesAujourdhui(db))

  ipcMain.handle(IPC.accueilRechercherParNom, (_event, payloadBrut) => {
    const { requete } = rechercherParNomSchema.parse({ requete: payloadBrut })
    return rechercherAbonnesParNom(requete, db)
  })

  ipcMain.handle(IPC.accueilObtenirParametres, () => obtenirParametresAccueil(db))
}
