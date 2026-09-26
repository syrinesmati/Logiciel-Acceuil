import type { Abonne, CompteursDemarrage } from './types'
import type {
  ApercuImport,
  HistoriqueImport,
  LigneACorriger,
  MappageColonnes,
  RapportImport
} from './import'

/** Noms de canaux IPC centralises pour eviter les fautes de frappe entre main/preload/renderer. */
export const IPC = {
  systemeCompteursDemarrage: 'systeme:compteurs-demarrage',
  importChoisirFichier: 'import:choisir-fichier',
  importAnalyserFichier: 'import:analyser-fichier',
  importExecuterImport: 'import:executer-import',
  importExporterErreurs: 'import:exporter-erreurs',
  importListerHistorique: 'import:lister-historique',
  importListerLignesACorriger: 'import:lister-lignes-a-corriger',
  importCorrigerLigne: 'import:corriger-ligne',
  importIgnorerLigne: 'import:ignorer-ligne'
} as const

export interface ApiRenderer {
  systeme: {
    compteursDemarrage: () => Promise<CompteursDemarrage>
  }
  import: {
    choisirFichier: () => Promise<string | null>
    analyserFichier: (payload: {
      cheminFichier: string
      nomFichier: string
      mappage?: MappageColonnes
    }) => Promise<ApercuImport>
    executerImport: (payload: {
      nomFichier: string
      lignes: ApercuImport['lignes']
    }) => Promise<RapportImport>
    exporterErreurs: (payload: { lignes: ApercuImport['lignes'] }) => Promise<string | null>
    listerHistorique: () => Promise<HistoriqueImport[]>
    listerLignesACorriger: () => Promise<LigneACorriger[]>
    corrigerLigne: (payload: {
      id: number
      numeroAbonne: string
      nomComplet: string
      dateNaissance: string | null
      telephone: string | null
      email: string | null
    }) => Promise<{ succes: true } | { succes: false; erreur: string }>
    ignorerLigne: (id: number) => Promise<void>
  }
}

export type { Abonne, CompteursDemarrage }
