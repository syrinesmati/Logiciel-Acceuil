import type { TrancheAge } from '@shared/parametres'
import { TRANCHES_AGE_PAR_DEFAUT } from '@shared/parametres'

export type { TrancheAge }
export { TRANCHES_AGE_PAR_DEFAUT }

export const TRANCHE_AGE_INCONNU = 'age_inconnu'

/**
 * Age exprime en annees revolues a une date de reference donnee
 * (utilise pour les statistiques : age a la date de la visite, pas aujourd'hui).
 */
export function calculerAge(dateNaissance: Date, dateReference: Date): number {
  let age = dateReference.getFullYear() - dateNaissance.getFullYear()
  const anniversaireDepasse =
    dateReference.getMonth() > dateNaissance.getMonth() ||
    (dateReference.getMonth() === dateNaissance.getMonth() &&
      dateReference.getDate() >= dateNaissance.getDate())
  if (!anniversaireDepasse) age -= 1
  return age
}

export function trouverTrancheAge(
  age: number | null,
  tranches: TrancheAge[] = TRANCHES_AGE_PAR_DEFAUT
): string {
  if (age === null) return TRANCHE_AGE_INCONNU
  const tranche = tranches.find((t) => age >= t.min && (t.max === null || age <= t.max))
  return tranche?.id ?? TRANCHE_AGE_INCONNU
}

/** Age plausible pour un abonne de bibliotheque (utilise par le parseur d'import, 4.3). */
export function ageEstPlausible(age: number): boolean {
  return age >= 2 && age <= 100
}
