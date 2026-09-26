import type { EnteteColonne, FormatDetecte, MappageColonnes } from '@shared/import'

function simplifier(texte: string): string {
  return texte
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

interface RegleMappage {
  champ: keyof MappageColonnes
  motif: RegExp
}

// Ordre important : les motifs les plus specifiques d'abord (ex: "nom complet" avant "nom").
const REGLES_MAPPAGE: RegleMappage[] = [
  { champ: 'numeroAbonne', motif: /code.?barre|numero.*abonn|num.*abonn|^id$/ },
  { champ: 'nomComplet', motif: /nom complet|nom et prenom|nom & prenom/ },
  { champ: 'prenom', motif: /pr[ée]nom/ },
  { champ: 'nom', motif: /^nom$|nom de famille|^nom[- ]?patronymique$/ },
  { champ: 'dateNaissance', motif: /naissance/ },
  { champ: 'telephone', motif: /t[ée]l|gsm|mobile|portable/ },
  { champ: 'email', motif: /e-?mail|courriel/ }
]

/** Propose un mappage automatique en comparant les libelles d'en-tete a des synonymes usuels. */
export function suggererMappage(colonnes: EnteteColonne[]): Partial<MappageColonnes> {
  const mappage: Partial<MappageColonnes> = {}
  for (const colonne of colonnes) {
    const simplifie = simplifier(colonne.libelle)
    for (const regle of REGLES_MAPPAGE) {
      if (mappage[regle.champ]) continue
      if (regle.motif.test(simplifie)) {
        mappage[regle.champ] = colonne.cle
        break
      }
    }
  }
  return mappage
}

/**
 * Determine si le fichier est au format "une seule colonne de texte libre" (4.3)
 * ou un export structure avec plusieurs colonnes et en-tetes.
 */
export function detecterFormat(lignes: string[][]): FormatDetecte {
  const premiereLigneNonVide = lignes.find((ligne) => ligne.some((cellule) => cellule.trim() !== ''))

  const nbColonnesUtilisees = premiereLigneNonVide
    ? premiereLigneNonVide.filter((cellule) => cellule.trim() !== '').length
    : 0

  if (nbColonnesUtilisees <= 1) {
    return { mode: 'colonne_unique' }
  }

  const indexPremiereLigne = lignes.indexOf(premiereLigneNonVide!)
  const ligneExemple = lignes
    .slice(indexPremiereLigne + 1)
    .find((ligne) => ligne.some((cellule) => cellule.trim() !== ''))

  const colonnes: EnteteColonne[] = premiereLigneNonVide!.map((libelle, i) => ({
    cle: `col_${i}`,
    libelle: libelle.trim() || `Colonne ${i + 1}`,
    exemple: ligneExemple?.[i]?.trim() ?? ''
  }))

  const mappageSuggere = suggererMappage(colonnes)

  return {
    mode: 'mapping_colonnes',
    colonnes,
    mappageSuggere: mappageSuggere.numeroAbonne ? (mappageSuggere as MappageColonnes) : undefined
  }
}
