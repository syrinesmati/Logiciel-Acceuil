import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { IPC, type ApiRenderer } from '@shared/ipc'

const api: ApiRenderer = {
  systeme: {
    compteursDemarrage: () => ipcRenderer.invoke(IPC.systemeCompteursDemarrage)
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
