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

/**
 * Visiteur non-abonne (identifie par sa CIN plutot qu'un numero d'abonne
 * Syracuse) : fiche minimale, jamais destinee a etre remplacee par un import.
 */
export interface InscriptionNonAbonnePayload {
  cin: string
  nomComplet: string
  dateNaissance: string | null
  sexe: 'H' | 'F' | null
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
