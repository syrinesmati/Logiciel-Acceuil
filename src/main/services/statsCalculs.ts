import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import type {
  AbonneAssidu,
  CelluleAffluence,
  IndicateursCles,
  MotifParTrancheAge,
  PointEvolution,
  RepartitionMotif,
  RepartitionSexe,
  RepartitionTrancheAge,
  Sexe
} from '@shared/stats'
import type { TrancheAge } from '@shared/parametres'
import { calculerAge, trouverTrancheAge, TRANCHE_AGE_INCONNU } from './age'
import type { PeriodeResolue } from './periode'
import { nombreDeJours } from './periode'

export interface MotifDeVisite {
  motifId: number
  libelle: string
  couleur: string
}

/** Une visite enrichie des infos abonne necessaires aux stats (chargee une seule fois, cf. chargeurStats.ts). */
export interface VisiteEnrichie {
  visiteId: number
  dateHeure: string
  abonneId: number
  numeroAbonne: string
  nomComplet: string
  dateNaissance: string | null
  sexe: 'H' | 'F' | null
  motifs: MotifDeVisite[]
}

export type Granularite = 'heure' | 'jour' | 'mois' | 'annee'

/** Choisit une granularite d'affichage raisonnable selon l'etendue de la periode (voir 4.5). */
export function choisirGranularite(periode: PeriodeResolue): Granularite {
  const jours = nombreDeJours(periode)
  if (jours <= 1) return 'heure'
  if (jours <= 62) return 'jour'
  if (jours <= 730) return 'mois'
  return 'annee'
}

function ageALaVisite(dateNaissance: string | null, dateHeureVisite: string): number | null {
  if (!dateNaissance) return null
  return calculerAge(new Date(dateNaissance), new Date(dateHeureVisite))
}

export function calculerIndicateursCles(
  visitesActuelles: VisiteEnrichie[],
  visitesPrecedentes: VisiteEnrichie[],
  periode: PeriodeResolue
): IndicateursCles {
  const nbVisites = visitesActuelles.length
  const nbAbonnesUniques = new Set(visitesActuelles.map((v) => v.abonneId)).size
  const nbVisitesPrecedent = visitesPrecedentes.length
  const nbAbonnesPrecedent = new Set(visitesPrecedentes.map((v) => v.abonneId)).size

  function variation(actuel: number, precedent: number): number | null {
    if (precedent === 0) return null
    return Math.round(((actuel - precedent) / precedent) * 1000) / 10
  }

  return {
    nbVisites,
    nbAbonnesUniques,
    moyenneVisitesParJour: Math.round((nbVisites / nombreDeJours(periode)) * 10) / 10,
    variationNbVisitesPct: variation(nbVisites, nbVisitesPrecedent),
    variationNbAbonnesPct: variation(nbAbonnesUniques, nbAbonnesPrecedent)
  }
}

function debutBucket(date: Date, granularite: Granularite): Date {
  switch (granularite) {
    case 'heure':
      return new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours())
    case 'jour':
      return new Date(date.getFullYear(), date.getMonth(), date.getDate())
    case 'mois':
      return new Date(date.getFullYear(), date.getMonth(), 1)
    case 'annee':
      return new Date(date.getFullYear(), 0, 1)
  }
}

function avancerBucket(date: Date, granularite: Granularite): Date {
  const suivant = new Date(date)
  if (granularite === 'heure') suivant.setHours(suivant.getHours() + 1)
  else if (granularite === 'jour') suivant.setDate(suivant.getDate() + 1)
  else if (granularite === 'mois') suivant.setMonth(suivant.getMonth() + 1)
  else suivant.setFullYear(suivant.getFullYear() + 1)
  return suivant
}

function cleBucket(date: Date, granularite: Granularite): string {
  if (granularite === 'heure') return format(date, 'yyyy-MM-dd HH')
  if (granularite === 'jour') return format(date, 'yyyy-MM-dd')
  if (granularite === 'mois') return format(date, 'yyyy-MM')
  return format(date, 'yyyy')
}

function libelleBucket(date: Date, granularite: Granularite): string {
  if (granularite === 'heure') return format(date, 'HH:00', { locale: fr })
  if (granularite === 'jour') return format(date, 'dd/MM', { locale: fr })
  if (granularite === 'mois') return format(date, 'MMM yyyy', { locale: fr })
  return format(date, 'yyyy')
}

/** Evolution des visites dans le temps, avec un point pour chaque intervalle de la periode (meme a 0). */
export function calculerEvolution(
  visites: VisiteEnrichie[],
  periode: PeriodeResolue,
  granularite: Granularite
): PointEvolution[] {
  const compteurs = new Map<string, number>()
  const points: PointEvolution[] = []

  let curseur = debutBucket(periode.debut, granularite)
  while (curseur < periode.fin) {
    const cle = cleBucket(curseur, granularite)
    points.push({ cle, libelle: libelleBucket(curseur, granularite), nbVisites: 0 })
    compteurs.set(cle, points.length - 1)
    curseur = avancerBucket(curseur, granularite)
  }

  for (const visite of visites) {
    const cle = cleBucket(new Date(visite.dateHeure), granularite)
    const index = compteurs.get(cle)
    if (index !== undefined) points[index]!.nbVisites++
  }

  return points
}

export function calculerRepartitionParMotif(visites: VisiteEnrichie[]): RepartitionMotif[] {
  const total = visites.reduce((acc, v) => acc + v.motifs.length, 0)
  const parId = new Map<number, RepartitionMotif>()

  for (const visite of visites) {
    for (const motif of visite.motifs) {
      const existant = parId.get(motif.motifId)
      if (existant) existant.nombre++
      else parId.set(motif.motifId, { motifId: motif.motifId, libelle: motif.libelle, couleur: motif.couleur, nombre: 1, pourcentage: 0 })
    }
  }

  return [...parId.values()]
    .map((r) => ({ ...r, pourcentage: total > 0 ? Math.round((r.nombre / total) * 1000) / 10 : 0 }))
    .sort((a, b) => b.nombre - a.nombre)
}

export function calculerRepartitionParTrancheAge(
  visites: VisiteEnrichie[],
  tranches: TrancheAge[]
): RepartitionTrancheAge[] {
  const compteurs = new Map<string, number>()
  for (const tranche of tranches) compteurs.set(tranche.id, 0)
  compteurs.set(TRANCHE_AGE_INCONNU, 0)

  for (const visite of visites) {
    const age = ageALaVisite(visite.dateNaissance, visite.dateHeure)
    const trancheId = trouverTrancheAge(age, tranches)
    compteurs.set(trancheId, (compteurs.get(trancheId) ?? 0) + 1)
  }

  const total = visites.length
  const libelles = new Map(tranches.map((t) => [t.id, t.libelle]))
  libelles.set(TRANCHE_AGE_INCONNU, 'Age inconnu')

  return [...compteurs.entries()].map(([trancheId, nombre]) => ({
    trancheId,
    libelle: libelles.get(trancheId) ?? trancheId,
    nombre,
    pourcentage: total > 0 ? Math.round((nombre / total) * 1000) / 10 : 0
  }))
}

export function calculerRepartitionParSexe(visites: VisiteEnrichie[]): RepartitionSexe[] {
  const compteurs: Record<Sexe, number> = { H: 0, F: 0, non_renseigne: 0 }
  for (const visite of visites) {
    const cle: Sexe = visite.sexe ?? 'non_renseigne'
    compteurs[cle]++
  }
  const total = visites.length
  return (['H', 'F', 'non_renseigne'] as Sexe[]).map((sexe) => ({
    sexe,
    nombre: compteurs[sexe],
    pourcentage: total > 0 ? Math.round((compteurs[sexe] / total) * 1000) / 10 : 0
  }))
}

export function calculerMotifParTrancheAge(visites: VisiteEnrichie[], tranches: TrancheAge[]): MotifParTrancheAge[] {
  const trancheIds = [...tranches.map((t) => t.id), TRANCHE_AGE_INCONNU]
  const libelles = new Map(tranches.map((t) => [t.id, t.libelle]))
  libelles.set(TRANCHE_AGE_INCONNU, 'Age inconnu')

  const structure = new Map<string, Map<number, { motifId: number; libelle: string; couleur: string; nombre: number }>>()
  for (const id of trancheIds) structure.set(id, new Map())

  for (const visite of visites) {
    const age = ageALaVisite(visite.dateNaissance, visite.dateHeure)
    const trancheId = trouverTrancheAge(age, tranches)
    const parMotif = structure.get(trancheId)!
    for (const motif of visite.motifs) {
      const existant = parMotif.get(motif.motifId)
      if (existant) existant.nombre++
      else parMotif.set(motif.motifId, { motifId: motif.motifId, libelle: motif.libelle, couleur: motif.couleur, nombre: 1 })
    }
  }

  return trancheIds.map((trancheId) => ({
    trancheId,
    trancheLibelle: libelles.get(trancheId) ?? trancheId,
    parMotif: [...structure.get(trancheId)!.values()].sort((a, b) => b.nombre - a.nombre)
  }))
}

/** Carte de chaleur jour de semaine x heure (toujours 7x24 = 168 cellules, meme a 0). */
export function calculerHeuresAffluence(visites: VisiteEnrichie[]): CelluleAffluence[] {
  const compteurs = new Map<string, number>()
  for (const visite of visites) {
    const d = new Date(visite.dateHeure)
    const cle = `${d.getDay()}-${d.getHours()}`
    compteurs.set(cle, (compteurs.get(cle) ?? 0) + 1)
  }

  const cellules: CelluleAffluence[] = []
  for (let jourSemaine = 0; jourSemaine < 7; jourSemaine++) {
    for (let heure = 0; heure < 24; heure++) {
      cellules.push({ jourSemaine, heure, nombre: compteurs.get(`${jourSemaine}-${heure}`) ?? 0 })
    }
  }
  return cellules
}

export function calculerTopAbonnes(visites: VisiteEnrichie[], limite = 10): AbonneAssidu[] {
  const parAbonne = new Map<number, AbonneAssidu>()
  for (const visite of visites) {
    const existant = parAbonne.get(visite.abonneId)
    if (existant) existant.nbVisites++
    else
      parAbonne.set(visite.abonneId, {
        abonneId: visite.abonneId,
        numeroAbonne: visite.numeroAbonne,
        nomComplet: visite.nomComplet,
        nbVisites: 1
      })
  }
  return [...parAbonne.values()].sort((a, b) => b.nbVisites - a.nbVisites).slice(0, limite)
}
