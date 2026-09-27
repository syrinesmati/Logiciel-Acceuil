export type TypePeriode = 'aujourdhui' | 'semaine' | 'mois' | 'annee' | 'personnalisee'

export interface FiltrePeriode {
  type: TypePeriode
  /** ISO yyyy-mm-dd, requis si type === 'personnalisee'. */
  dateDebut?: string
  dateFin?: string
}

export interface IndicateursCles {
  nbVisites: number
  nbAbonnesUniques: number
  moyenneVisitesParJour: number
  /** Variation en % vs la periode precedente de meme duree (null si periode precedente = 0). */
  variationNbVisitesPct: number | null
  variationNbAbonnesPct: number | null
}

export interface PointEvolution {
  cle: string
  libelle: string
  nbVisites: number
}

export interface RepartitionMotif {
  motifId: number
  libelle: string
  couleur: string
  nombre: number
  pourcentage: number
}

export interface RepartitionTrancheAge {
  trancheId: string
  libelle: string
  nombre: number
  pourcentage: number
}

export type Sexe = 'H' | 'F' | 'non_renseigne'

export interface RepartitionSexe {
  sexe: Sexe
  nombre: number
  pourcentage: number
}

export type TypeVisiteur = 'abonne' | 'non_abonne'

export interface RepartitionTypeVisiteur {
  type: TypeVisiteur
  nombre: number
  pourcentage: number
}

export interface MotifParTrancheAge {
  trancheId: string
  trancheLibelle: string
  parMotif: { motifId: number; libelle: string; couleur: string; nombre: number }[]
}

export interface CelluleAffluence {
  /** 0 = dimanche ... 6 = samedi (convention JS Date.getDay()). */
  jourSemaine: number
  heure: number
  nombre: number
}

export interface AbonneAssidu {
  abonneId: number
  numeroAbonne: string
  nomComplet: string
  nbVisites: number
}

export interface TableauDeBord {
  periode: { debut: string; fin: string }
  indicateurs: IndicateursCles
  evolution: PointEvolution[]
  parMotif: RepartitionMotif[]
  parTrancheAge: RepartitionTrancheAge[]
  parSexe: RepartitionSexe[]
  parTypeVisiteur: RepartitionTypeVisiteur[]
  motifParTrancheAge: MotifParTrancheAge[]
  heuresAffluence: CelluleAffluence[]
  topAbonnes: AbonneAssidu[]
}
