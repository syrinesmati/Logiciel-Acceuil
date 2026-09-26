import type { Abonne, CompteursDemarrage } from './types'

/** Noms de canaux IPC centralises pour eviter les fautes de frappe entre main/preload/renderer. */
export const IPC = {
  systemeCompteursDemarrage: 'systeme:compteurs-demarrage'
} as const

export interface ApiRenderer {
  systeme: {
    compteursDemarrage: () => Promise<CompteursDemarrage>
  }
}

export type { Abonne, CompteursDemarrage }
