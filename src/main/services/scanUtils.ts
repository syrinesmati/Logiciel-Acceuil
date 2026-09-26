/**
 * Nettoie la saisie de la douchette (voir 4.1) : la douchette se comporte comme
 * un clavier et peut ajouter des espaces, des zeros parasites ou des caracteres
 * de controle autour du numero. La saisie manuelle au clavier passe par la meme
 * fonction.
 */
export function nettoyerNumeroScanne(brut: string): string {
  const chiffresSeuls = brut.replace(/\D/g, '')
  return chiffresSeuls.replace(/^0+(?=\d)/, '')
}
