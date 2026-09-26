/**
 * Normalisation tolerante des noms pour la recherche (voir cahier des charges 5.1).
 * Fonctionne aussi bien sur des noms arabes que latins puisque les donnees reelles
 * de Syracuse melangent les deux ecritures.
 */

const DIACRITIQUES = /[ؐ-ًؚ-ٰٟۖ-ۜ۟-۪ۤۧۨ-ۭࣔ-࣡]/g
const TATWEEL = /ـ/g
const ALEF_VARIANTES = /[آأإٱ]/g // آ أ إ ٱ -> ا
const TA_MARBOUTA = /ة/g // ة -> ه
const ALEF_MAQSOURA = /ى/g // ى -> ي
const ESPACES_MULTIPLES = /\s+/g

export function normaliserNom(nom: string): string {
  return nom
    .normalize('NFC')
    .replace(DIACRITIQUES, '')
    .replace(TATWEEL, '')
    .replace(ALEF_VARIANTES, 'ا')
    .replace(TA_MARBOUTA, 'ه')
    .replace(ALEF_MAQSOURA, 'ي')
    .toLocaleLowerCase()
    .replace(ESPACES_MULTIPLES, ' ')
    .trim()
}
