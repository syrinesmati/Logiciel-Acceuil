/**
 * Palette de graphiques (voir skill dataviz) : ordre categoriel valide (ecarts
 * CVD/vision normale suffisants entre couleurs adjacentes), plus une couleur
 * "muette" reservee aux etats honnetement inconnus (sexe non renseigne, age
 * inconnu) — jamais traitee comme une categorie a part entiere.
 */
export const PALETTE_CATEGORIELLE = [
  '#2a78d6', // bleu
  '#eb6834', // orange
  '#1baf7a', // aqua
  '#eda100', // jaune
  '#e87ba4', // magenta
  '#008300', // vert
  '#4a3aa7', // violet
  '#e34948' // rouge
] as const

export const COULEUR_MUTEE = '#898781'

export const COULEUR_SEXE: Record<'H' | 'F' | 'non_renseigne', string> = {
  H: PALETTE_CATEGORIELLE[0],
  F: PALETTE_CATEGORIELLE[1],
  non_renseigne: COULEUR_MUTEE
}

export const COULEUR_TYPE_VISITEUR: Record<'abonne' | 'non_abonne', string> = {
  abonne: PALETTE_CATEGORIELLE[0],
  non_abonne: PALETTE_CATEGORIELLE[2]
}

export function couleurCategorielle(index: number): string {
  return PALETTE_CATEGORIELLE[index % PALETTE_CATEGORIELLE.length]!
}

// Rampe sequentielle bleue (un seul ton, clair -> fonce) pour la carte de
// chaleur des heures d'affluence : encodage continu d'une magnitude, pas une
// liste de categories a distinguer entre elles.
const RAMPE_SEQUENTIELLE: [number, number, number][] = [
  [205, 226, 251], // #cde2fb (proche de zero)
  [61, 135, 229], // #3987e5
  [13, 54, 107] // #0d366b (maximum)
]

function mixRgb(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
}

/** Couleur sequentielle pour une valeur normalisee entre 0 (vide) et 1 (maximum). */
export function couleurSequentielle(valeurNormalisee: number): string {
  const t = Math.max(0, Math.min(1, valeurNormalisee))
  const segments = RAMPE_SEQUENTIELLE.length - 1
  const position = t * segments
  const index = Math.min(Math.floor(position), segments - 1)
  const local = position - index
  const [r, g, b] = mixRgb(RAMPE_SEQUENTIELLE[index]!, RAMPE_SEQUENTIELLE[index + 1]!, local)
  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`
}
