import type { Abonne } from './types'

export interface Motif {
  id: number
  libelle: string
  icone: string
  couleur: string
  ordre: number
}

/** Abonne enrichi de l'age calcule (utilise pour l'affichage sur la fiche d'accueil). */
export interface AbonnePourFiche extends Abonne {
  age: number | null
}

export interface ResultatRecherche {
  trouve: boolean
  abonne?: AbonnePourFiche
  /** true si ce numero a deja ete scanne il y a moins du delai anti-double-scan. */
  avertissementDoubleScan?: boolean
  derniereVisite?: string | null
}

export interface InscriptionRapidePayload {
  numeroAbonne: string
  nomComplet: string
  dateNaissance: string | null
  sexe: 'H' | 'F' | null
  telephone: string | null
}

export type ResultatInscription =
  | { succes: true; abonne: AbonnePourFiche }
  | { succes: false; erreur: string }

export interface EnregistrerVisitePayload {
  abonneId: number
  motifIds: number[]
}

export interface ParametresAccueil {
  delaiAntiDoubleScanSecondes: number
  delaiRetourAutoSecondes: number
}
