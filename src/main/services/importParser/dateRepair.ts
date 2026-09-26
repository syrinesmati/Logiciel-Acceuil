import { ageEstPlausible, calculerAge } from '../age'

export interface ResultatDate {
  /** Date de naissance au format ISO (yyyy-mm-dd), ou null si non reconnaissable. */
  iso: string | null
  /** Description de la correction automatique appliquee, si le format brut etait fautif. */
  correction: string | null
  /** Raison pour laquelle la ligne doit etre verifiee manuellement (champ absent/douteux). */
  avertissement: string | null
}

interface DateValide {
  jour: number
  mois: number
  annee: number
}

function validerCalendrier(jour: number, mois: number, annee: number): DateValide | null {
  if (mois < 1 || mois > 12 || jour < 1 || jour > 31) return null
  const date = new Date(annee, mois - 1, jour)
  if (date.getFullYear() !== annee || date.getMonth() !== mois - 1 || date.getDate() !== jour) {
    return null
  }
  return { jour, mois, annee }
}

function versIso(d: DateValide): string {
  return `${String(d.annee).padStart(4, '0')}-${String(d.mois).padStart(2, '0')}-${String(d.jour).padStart(2, '0')}`
}

/** Tente un parse strict jj-mm-aaaa (le seul format correct attendu par Syracuse). */
function parseStrict(valeur: string): DateValide | null {
  const m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(valeur)
  if (!m) return null
  return validerCalendrier(Number(m[1]), Number(m[2]), Number(m[3]))
}

interface TentativeReparation {
  description: string
  transformer: (brut: string) => string | null
}

const TENTATIVES_REPARATION: TentativeReparation[] = [
  {
    // "10-09--2005" -> "10-09-2005"
    description: 'double tiret corrige',
    transformer: (brut) => (brut.includes('--') ? brut.replace(/-{2,}/g, '-') : null)
  },
  {
    // "29 08 2016" -> "29-08-2016"
    description: 'separateurs espaces remplaces par des tirets',
    transformer: (brut) => (/^\d{2} \d{2} \d{4}$/.test(brut) ? brut.replace(/ /g, '-') : null)
  },
  {
    // "12/05/2008" -> "12-05-2008" (export structure avec un autre separateur)
    description: 'separateurs "/" remplaces par des tirets',
    transformer: (brut) => (/^\d{2}\/\d{2}\/\d{4}$/.test(brut) ? brut.replace(/\//g, '-') : null)
  },
  {
    // "3008-2004" -> "30-08-2004" (jour+mois colles, tiret manquant)
    description: 'tiret manquant entre le jour et le mois',
    transformer: (brut) => {
      const m = /^(\d{4})-(\d{4})$/.exec(brut)
      if (!m) return null
      const [, jourMois, annee] = m as unknown as [string, string, string]
      return `${jourMois.slice(0, 2)}-${jourMois.slice(2, 4)}-${annee}`
    }
  },
  {
    // "18-092012" -> "18-09-2012" (mois+annee colles, tiret manquant)
    description: 'tiret manquant entre le mois et l\'annee',
    transformer: (brut) => {
      const m = /^(\d{2})-(\d{6})$/.exec(brut)
      if (!m) return null
      const [, jour, moisAnnee] = m as unknown as [string, string, string]
      return `${jour}-${moisAnnee.slice(0, 2)}-${moisAnnee.slice(2, 6)}`
    }
  },
  {
    // "19-009-2000" -> "19-09-2000" (zero de trop dans le mois)
    description: 'chiffre en trop dans le mois',
    transformer: (brut) => {
      const m = /^(\d{2})-(\d{3})-(\d{4})$/.exec(brut)
      if (!m) return null
      const [, jour, mois3, annee] = m as unknown as [string, string, string, string]
      if (mois3[0] !== '0') return null
      return `${jour}-${mois3.slice(1)}-${annee}`
    }
  }
]

/**
 * Analyse une date de naissance brute issue de l'export Syracuse (voir 4.3).
 * Repare automatiquement les cas sans ambiguite, sinon renvoie un avertissement
 * (la ligne reste importable : le numero et le nom suffisent pour l'accueil).
 */
export function analyserDateNaissance(
  brut: string,
  dateReference: Date = new Date()
): ResultatDate {
  const valeur = brut.trim()

  if (!valeur) {
    return { iso: null, correction: null, avertissement: 'date de naissance absente' }
  }

  if (/^\d{4}$/.test(valeur)) {
    return {
      iso: null,
      correction: null,
      avertissement: `annee seule, jour et mois inconnus (${valeur})`
    }
  }

  const direct = parseStrict(valeur)
  if (direct) {
    return finaliser(direct, null, dateReference)
  }

  for (const tentative of TENTATIVES_REPARATION) {
    const transforme = tentative.transformer(valeur)
    if (transforme === null) continue
    const reparee = parseStrict(transforme)
    if (reparee) {
      return finaliser(reparee, `${tentative.description} : "${valeur}" -> "${transforme}"`, dateReference)
    }
  }

  return {
    iso: null,
    correction: null,
    avertissement: `date de naissance illisible ou incomplete : "${valeur}"`
  }
}

function finaliser(date: DateValide, correction: string | null, dateReference: Date): ResultatDate {
  const iso = versIso(date)
  const age = calculerAge(new Date(date.annee, date.mois - 1, date.jour), dateReference)
  const avertissement = ageEstPlausible(age)
    ? null
    : `age peu plausible (${age} ans) pour la date de naissance ${iso}`
  return { iso, correction, avertissement }
}
