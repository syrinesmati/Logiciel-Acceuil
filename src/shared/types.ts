export interface Abonne {
  id: number
  numeroAbonne: string
  nomComplet: string
  dateNaissance: string | null
  sexe: 'H' | 'F' | null
  telephone: string | null
  email: string | null
  source: 'import' | 'inscription_rapide'
  actif: boolean
}

export interface CompteursDemarrage {
  nbAbonnes: number
  nbVisites: number
}
