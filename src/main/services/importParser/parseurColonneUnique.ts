import type { LigneImportParsee } from '@shared/import'
import { analyserDateNaissance } from './dateRepair'
import { estLigneAIgnorer } from './moisArabes'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const NOM_COLLE_A_LA_DATE_RE = /^([؀-ۿ]+)(\d{2}-\d{2}-\d{4})$/
const PUR_CHIFFRES_RE = /^\d+$/
const ANNEE_PLAUSIBLE_MIN = 1900

function anneeCourante(dateReference: Date): number {
  return dateReference.getFullYear()
}

interface EclatementTokensColles {
  tokens: string[]
  /** Tokens dates issus d'un nom colle a la date (pour signaler la correction). */
  tokensDatesEclatees: string[]
}

/** Separe un token "nom colle a une date" (ex: "الزغلامي07-10-2013") en deux tokens. */
function eclaterTokensColles(tokens: string[]): EclatementTokensColles {
  const resultat: string[] = []
  const tokensDatesEclatees: string[] = []
  for (const tok of tokens) {
    const m = NOM_COLLE_A_LA_DATE_RE.exec(tok)
    if (m) {
      resultat.push(m[1]!, m[2]!)
      tokensDatesEclatees.push(m[2]!)
    } else {
      resultat.push(tok)
    }
  }
  return { tokens: resultat, tokensDatesEclatees }
}

interface FusionDateEspacee {
  tokens: string[]
  /** Tokens dates fusionnes a partir de 3 tokens espaces (pour signaler la correction). */
  fusions: string[]
}

/** Fusionne 3 tokens numeriques consecutifs "jj mm aaaa" separes par des espaces en un seul token date. */
function fusionnerDatesEspacees(tokens: string[]): FusionDateEspacee {
  const resultat: string[] = []
  const fusions: string[] = []
  let i = 0
  while (i < tokens.length) {
    const [a, b, c] = [tokens[i], tokens[i + 1], tokens[i + 2]]
    if (
      a &&
      b &&
      c &&
      PUR_CHIFFRES_RE.test(a) &&
      PUR_CHIFFRES_RE.test(b) &&
      PUR_CHIFFRES_RE.test(c) &&
      a.length <= 2 &&
      b.length <= 2 &&
      c.length === 4
    ) {
      const fusionne = `${a}-${b}-${c}`
      resultat.push(fusionne)
      fusions.push(fusionne)
      i += 3
    } else {
      resultat.push(tokens[i]!)
      i += 1
    }
  }
  return { tokens: resultat, fusions }
}

/** Analyse une ligne de texte libre (mode "une seule colonne", voir 4.3). */
export function parseLigneColonneUnique(
  ligne: string,
  index: number,
  dateReference: Date = new Date()
): LigneImportParsee {
  const corrections: string[] = []
  const avertissements: string[] = []

  let tokens = ligne.trim().split(/\s+/)
  const { tokens: tokensEclates, tokensDatesEclatees } = eclaterTokensColles(tokens)
  tokens = tokensEclates
  const { tokens: tokensFusionnes, fusions: datesEspaceesFusionnees } = fusionnerDatesEspacees(tokens)
  tokens = tokensFusionnes

  // 1. email (remplace parfois le telephone par erreur de saisie)
  let email: string | null = null
  tokens = tokens.filter((tok) => {
    if (EMAIL_RE.test(tok)) {
      email = tok
      return false
    }
    return true
  })

  // 2. date : token contenant un tiret, sinon repli sur une annee seule plausible
  let tokenDate: string | null = null
  const indexDateAvecTiret = tokens.findIndex((tok) => tok.includes('-') && /\d/.test(tok))
  if (indexDateAvecTiret !== -1) {
    tokenDate = tokens[indexDateAvecTiret]!
    tokens.splice(indexDateAvecTiret, 1)
  } else {
    const indexAnnee = tokens.findIndex(
      (tok) =>
        /^\d{4}$/.test(tok) &&
        Number(tok) >= ANNEE_PLAUSIBLE_MIN &&
        Number(tok) <= anneeCourante(dateReference)
    )
    if (indexAnnee !== -1) {
      tokenDate = tokens[indexAnnee]!
      tokens.splice(indexAnnee, 1)
    }
  }

  const resultatDate = analyserDateNaissance(tokenDate ?? '', dateReference)
  if (tokenDate && datesEspaceesFusionnees.includes(tokenDate)) {
    corrections.push(`separateurs espaces remplaces par des tirets dans la date ("${tokenDate}")`)
  }
  if (tokenDate && tokensDatesEclatees.includes(tokenDate)) {
    corrections.push(`nom separe de la date collee ("${tokenDate}")`)
  }
  if (resultatDate.correction) corrections.push(resultatDate.correction)
  if (resultatDate.avertissement) avertissements.push(resultatDate.avertissement)

  // 3. numero d'abonne (<=6 chiffres) et telephone (>=7 chiffres) parmi les tokens purement numeriques
  const numeros: string[] = []
  const telephones: string[] = []
  const motsDuNom: string[] = []
  for (const tok of tokens) {
    if (PUR_CHIFFRES_RE.test(tok)) {
      if (tok.length <= 6) numeros.push(tok)
      else telephones.push(tok)
    } else if (tok.length > 0) {
      motsDuNom.push(tok)
    }
  }

  const numeroAbonne = numeros[0] ?? null
  const telephone = telephones[0] ?? null
  const nomComplet = motsDuNom.join(' ').trim() || null

  if (telephone && telephone.length !== 8) {
    avertissements.push(`telephone de longueur inhabituelle (${telephone.length} chiffres) : "${telephone}"`)
  } else if (!telephone) {
    avertissements.push(
      email ? 'telephone absent (une adresse email a ete trouvee a sa place)' : 'telephone manquant'
    )
  }

  if (!nomComplet) {
    avertissements.push('nom manquant')
  }

  let erreur: string | null = null
  if (!numeroAbonne) {
    erreur = 'numero d\'abonne introuvable sur cette ligne'
  }

  const statut = erreur
    ? 'rejetee'
    : avertissements.length > 0
      ? 'a_verifier'
      : corrections.length > 0
        ? 'corrigee'
        : 'ok'

  return {
    index,
    ligneBrute: ligne,
    statut,
    numeroAbonne,
    nomComplet,
    dateNaissance: resultatDate.iso,
    telephone,
    email,
    corrections,
    avertissements,
    erreur
  }
}

/** Analyse un fichier complet au format "une seule colonne" (une ligne de texte par abonne). */
export function parserColonneUnique(
  lignesBrutes: string[],
  dateReference: Date = new Date()
): LigneImportParsee[] {
  const resultats: LigneImportParsee[] = []
  lignesBrutes.forEach((ligne, i) => {
    if (estLigneAIgnorer(ligne)) return
    resultats.push(parseLigneColonneUnique(ligne, i, dateReference))
  })
  return resultats
}
