import type { Abonne, CompteursDemarrage } from './types'
import type {
  ApercuImport,
  HistoriqueImport,
  LigneACorriger,
  MappageColonnes,
  RapportImport
} from './import'
import type {
  AbonnePourFiche,
  EnregistrerVisitePayload,
  InscriptionRapidePayload,
  Motif,
  ParametresAccueil,
  ResultatInscription,
  ResultatRecherche
} from './accueil'
import type { MotifAdmin, ParametresGeneraux, ResultatChangementPin } from './parametres'

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
  importIgnorerLigne: 'import:ignorer-ligne',
  accueilListerMotifs: 'accueil:lister-motifs',
  accueilRechercherNumero: 'accueil:rechercher-numero',
  accueilInscrireRapide: 'accueil:inscrire-rapide',
  accueilCompleterSexe: 'accueil:completer-sexe',
  accueilEnregistrerVisite: 'accueil:enregistrer-visite',
  accueilCompteurAujourdhui: 'accueil:compteur-aujourdhui',
  accueilRechercherParNom: 'accueil:rechercher-par-nom',
  accueilObtenirParametres: 'accueil:obtenir-parametres',
  parametresPinEstDefini: 'parametres:pin-est-defini',
  parametresDefinirPin: 'parametres:definir-pin',
  parametresVerifierPin: 'parametres:verifier-pin',
  parametresChangerPin: 'parametres:changer-pin',
  parametresObtenirGeneraux: 'parametres:obtenir-generaux',
  parametresEnregistrerGeneraux: 'parametres:enregistrer-generaux',
  parametresListerMotifs: 'parametres:lister-motifs',
  parametresCreerMotif: 'parametres:creer-motif',
  parametresModifierMotif: 'parametres:modifier-motif',
  parametresActiverMotif: 'parametres:activer-motif',
  parametresReordonnerMotifs: 'parametres:reordonner-motifs'
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
  accueil: {
    listerMotifs: () => Promise<Motif[]>
    rechercherNumero: (numero: string) => Promise<ResultatRecherche>
    inscrireRapide: (payload: InscriptionRapidePayload) => Promise<ResultatInscription>
    completerSexe: (payload: { abonneId: number; sexe: 'H' | 'F' }) => Promise<AbonnePourFiche>
    enregistrerVisite: (payload: EnregistrerVisitePayload) => Promise<{ compteurAujourdhui: number }>
    compteurAujourdhui: () => Promise<number>
    rechercherParNom: (requete: string) => Promise<AbonnePourFiche[]>
    obtenirParametres: () => Promise<ParametresAccueil>
  }
  parametres: {
    pinEstDefini: () => Promise<boolean>
    definirPin: (pin: string) => Promise<void>
    verifierPin: (pin: string) => Promise<boolean>
    changerPin: (payload: { ancienPin: string; nouveauPin: string }) => Promise<ResultatChangementPin>
    obtenirGeneraux: () => Promise<ParametresGeneraux>
    enregistrerGeneraux: (payload: ParametresGeneraux) => Promise<void>
    listerMotifs: () => Promise<MotifAdmin[]>
    creerMotif: (payload: { libelle: string; icone: string; couleur: string }) => Promise<MotifAdmin>
    modifierMotif: (payload: {
      id: number
      libelle: string
      icone: string
      couleur: string
    }) => Promise<MotifAdmin>
    activerMotif: (payload: { id: number; actif: boolean }) => Promise<MotifAdmin>
    reordonnerMotifs: (ordreIds: number[]) => Promise<void>
  }
}

export type { Abonne, CompteursDemarrage }
