import type { AppDb } from '../db/client'
import type { FiltrePeriode, TableauDeBord } from '@shared/stats'
import { chargerVisitesPeriode } from './chargeurStats'
import { periodePrecedente, resoudrePeriode } from './periode'
import { obtenirParametresGeneraux } from './parametresService'
import {
  calculerEvolution,
  calculerHeuresAffluence,
  calculerIndicateursCles,
  calculerMotifParTrancheAge,
  calculerRepartitionParMotif,
  calculerRepartitionParSexe,
  calculerRepartitionParTrancheAge,
  calculerRepartitionParTypeVisiteur,
  calculerTopAbonnes,
  choisirGranularite
} from './statsCalculs'

export function obtenirTableauDeBord(
  filtre: FiltrePeriode,
  db: AppDb,
  dateReference: Date = new Date()
): TableauDeBord {
  const periode = resoudrePeriode(filtre, dateReference)
  const precedente = periodePrecedente(periode)
  const { tranchesAge } = obtenirParametresGeneraux(db)

  const visitesActuelles = chargerVisitesPeriode(periode, db)
  const visitesPrecedentes = chargerVisitesPeriode(precedente, db)
  const granularite = choisirGranularite(periode)

  return {
    periode: { debut: periode.debut.toISOString(), fin: periode.fin.toISOString() },
    indicateurs: calculerIndicateursCles(visitesActuelles, visitesPrecedentes, periode),
    evolution: calculerEvolution(visitesActuelles, periode, granularite),
    parMotif: calculerRepartitionParMotif(visitesActuelles),
    parTrancheAge: calculerRepartitionParTrancheAge(visitesActuelles, tranchesAge),
    parSexe: calculerRepartitionParSexe(visitesActuelles),
    parTypeVisiteur: calculerRepartitionParTypeVisiteur(visitesActuelles),
    motifParTrancheAge: calculerMotifParTrancheAge(visitesActuelles, tranchesAge),
    heuresAffluence: calculerHeuresAffluence(visitesActuelles),
    topAbonnes: calculerTopAbonnes(visitesActuelles, 10)
  }
}
