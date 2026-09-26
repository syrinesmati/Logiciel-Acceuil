export interface TrancheAge {
  id: string
  libelle: string
  min: number
  max: number | null // null = pas de borne haute (ex: "60+")
}

/** Tranches d'age par defaut (voir cahier des charges 4.4), modifiables depuis Parametres. */
export const TRANCHES_AGE_PAR_DEFAUT: TrancheAge[] = [
  { id: '0-12', libelle: '0-12 ans', min: 0, max: 12 },
  { id: '13-17', libelle: '13-17 ans', min: 13, max: 17 },
  { id: '18-25', libelle: '18-25 ans', min: 18, max: 25 },
  { id: '26-40', libelle: '26-40 ans', min: 26, max: 40 },
  { id: '41-60', libelle: '41-60 ans', min: 41, max: 60 },
  { id: '60+', libelle: '60 ans et plus', min: 61, max: null }
]

export interface ParametresGeneraux {
  nomBibliotheque: string
  delaiAntiDoubleScanSecondes: number
  delaiRetourAutoSecondes: number
  tranchesAge: TrancheAge[]
}

export interface MotifAdmin {
  id: number
  libelle: string
  icone: string
  couleur: string
  ordre: number
  actif: boolean
}

export type ResultatChangementPin = { succes: true } | { succes: false; erreur: string }
