/** Noms des mois en arabe (transliteration tunisienne) utilises comme lignes d'en-tete dans l'export. */
export const MOIS_ARABES = [
  'جانفي', // janvier
  'فيفري', // fevrier
  'مارس', // mars
  'أفريل', // avril
  'ماي', // mai
  'جوان', // juin
  'جويلية', // juillet
  'أوت', // aout
  'سبتمبر', // septembre
  'أكتوبر', // octobre
  'نوفمبر', // novembre
  'ديسمبر' // decembre
]

/** Ligne vide, ou ligne d'en-tete de mois (ex: "جانفي" ou "جانفي 2024") a ignorer avant le parsing. */
export function estLigneAIgnorer(ligne: string): boolean {
  const texte = ligne.trim()
  if (!texte) return true

  const tokens = texte.split(/\s+/)
  const contientUnMois = tokens.some((tok) => MOIS_ARABES.includes(tok))
  if (!contientUnMois) return false

  const autresTokens = tokens.filter((tok) => !MOIS_ARABES.includes(tok))
  return autresTokens.every((tok) => /^\d+$/.test(tok))
}
