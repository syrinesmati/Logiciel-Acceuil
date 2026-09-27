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
    inscrireNonAbonne: (payload) => ipcRenderer.invoke(IPC.accueilInscrireNonAbonne, payload),
    completerSexe: (payload) => ipcRenderer.invoke(IPC.accueilCompleterSexe, payload),
    enregistrerVisite: (payload) => ipcRenderer.invoke(IPC.accueilEnregistrerVisite, payload),
    compteurAujourdhui: () => ipcRenderer.invoke(IPC.accueilCompteurAujourdhui),
    rechercherParNom: (requete) => ipcRenderer.invoke(IPC.accueilRechercherParNom, requete),
    obtenirParametres: () => ipcRenderer.invoke(IPC.accueilObtenirParametres)
  },
  parametres: {
    pinEstDefini: () => ipcRenderer.invoke(IPC.parametresPinEstDefini),
    definirPin: (pin) => ipcRenderer.invoke(IPC.parametresDefinirPin, pin),
    verifierPin: (pin) => ipcRenderer.invoke(IPC.parametresVerifierPin, pin),
    changerPin: (payload) => ipcRenderer.invoke(IPC.parametresChangerPin, payload),
    sauvegarderMaintenant: () => ipcRenderer.invoke(IPC.parametresSauvegarderMaintenant),
    choisirFichierSauvegarde: () => ipcRenderer.invoke(IPC.parametresChoisirFichierSauvegarde),
    restaurerSauvegarde: (chemin) => ipcRenderer.invoke(IPC.parametresRestaurerSauvegarde, chemin),
    obtenirGeneraux: () => ipcRenderer.invoke(IPC.parametresObtenirGeneraux),
    enregistrerGeneraux: (payload) => ipcRenderer.invoke(IPC.parametresEnregistrerGeneraux, payload),
    listerMotifs: () => ipcRenderer.invoke(IPC.parametresListerMotifs),
    creerMotif: (payload) => ipcRenderer.invoke(IPC.parametresCreerMotif, payload),
    modifierMotif: (payload) => ipcRenderer.invoke(IPC.parametresModifierMotif, payload),
    activerMotif: (payload) => ipcRenderer.invoke(IPC.parametresActiverMotif, payload),
    reordonnerMotifs: (ordreIds) => ipcRenderer.invoke(IPC.parametresReordonnerMotifs, ordreIds)
  },
  stats: {
    obtenirTableauDeBord: (filtre) => ipcRenderer.invoke(IPC.statsObtenirTableauDeBord, filtre),
    exporterExcel: (filtre) => ipcRenderer.invoke(IPC.statsExporterExcel, filtre),
    exporterPdf: (filtre) => ipcRenderer.invoke(IPC.statsExporterPdf, filtre)
  },
  rapport: {
    signalerPret: () => ipcRenderer.send(IPC.rapportSignalerPret)
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
