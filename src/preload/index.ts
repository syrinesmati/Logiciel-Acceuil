import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { IPC, type ApiRenderer } from '@shared/ipc'

const api: ApiRenderer = {
  systeme: {
    compteursDemarrage: () => ipcRenderer.invoke(IPC.systemeCompteursDemarrage)
  },
  import: {
    choisirFichier: () => ipcRenderer.invoke(IPC.importChoisirFichier),
    analyserFichier: (payload) => ipcRenderer.invoke(IPC.importAnalyserFichier, payload),
    executerImport: (payload) => ipcRenderer.invoke(IPC.importExecuterImport, payload),
    exporterErreurs: (payload) => ipcRenderer.invoke(IPC.importExporterErreurs, payload),
    listerHistorique: () => ipcRenderer.invoke(IPC.importListerHistorique),
    listerLignesACorriger: () => ipcRenderer.invoke(IPC.importListerLignesACorriger),
    corrigerLigne: (payload) => ipcRenderer.invoke(IPC.importCorrigerLigne, payload),
    ignorerLigne: (id) => ipcRenderer.invoke(IPC.importIgnorerLigne, id)
  },
  accueil: {
    listerMotifs: () => ipcRenderer.invoke(IPC.accueilListerMotifs),
    rechercherNumero: (numero) => ipcRenderer.invoke(IPC.accueilRechercherNumero, numero),
    inscrireRapide: (payload) => ipcRenderer.invoke(IPC.accueilInscrireRapide, payload),
    completerSexe: (payload) => ipcRenderer.invoke(IPC.accueilCompleterSexe, payload),
    enregistrerVisite: (payload) => ipcRenderer.invoke(IPC.accueilEnregistrerVisite, payload),
    compteurAujourdhui: () => ipcRenderer.invoke(IPC.accueilCompteurAujourdhui),
    rechercherParNom: (requete) => ipcRenderer.invoke(IPC.accueilRechercherParNom, requete),
    obtenirParametres: () => ipcRenderer.invoke(IPC.accueilObtenirParametres)
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (erreur) {
    console.error(erreur)
  }
} else {
  // @ts-expect-error (defini uniquement si contextIsolation est desactive, cas non supporte ici)
  window.electron = electronAPI
  // @ts-expect-error idem
  window.api = api
}
