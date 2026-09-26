export interface TrancheAge {
  id: string
  libelle: string
  min: number
  max: number | null // null = pas de borne haute (ex: "60+")
}

export const TRANCHES_AGE_PAR_DEFAUT: TrancheAge[] = [
  { id: '0-12', libelle: '0-12 ans', min: 0, max: 12 },
  { id: '13-17', libelle: '13-17 ans', min: 13, max: 17 },
  { id: '18-25', libelle: '18-25 ans', min: 18, max: 25 },
  { id: '26-40', libelle: '26-40 ans', min: 26, max: 40 },
  { id: '41-60', libelle: '41-60 ans', min: 41, max: 60 },
  { id: '60+', libelle: '60 ans et plus', min: 61, max: null }
]

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
