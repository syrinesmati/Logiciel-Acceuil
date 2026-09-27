import type { FiltrePeriode } from '@shared/stats'

/** Bornes resolues d'une periode : `debut` inclus, `fin` exclue. */
export interface PeriodeResolue {
  debut: Date
  fin: Date
}

function minuit(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

/** Parse "aaaa-mm-jj" en minuit local (evite le piege du parsing UTC de `new Date(string)`). */
function parseDateLocale(iso: string): Date {
  const [annee, mois, jour] = iso.split('-').map(Number)
  return new Date(annee!, mois! - 1, jour!)
}

function debutSemaine(date: Date): Date {
  const jour = date.getDay() // 0 = dimanche ... 6 = samedi
  const decalage = jour === 0 ? 6 : jour - 1 // semaine commence le lundi
  const d = minuit(date)
  d.setDate(d.getDate() - decalage)
  return d
}

/** Resout un filtre de periode (4.5) en bornes de dates concretes, relatives a `reference` (= "maintenant"). */
export function resoudrePeriode(filtre: FiltrePeriode, reference: Date): PeriodeResolue {
  switch (filtre.type) {
    case 'aujourdhui': {
      const debut = minuit(reference)
      const fin = new Date(debut)
      fin.setDate(fin.getDate() + 1)
      return { debut, fin }
    }
    case 'semaine': {
      const debut = debutSemaine(reference)
      const fin = new Date(debut)
      fin.setDate(fin.getDate() + 7)
      return { debut, fin }
    }
    case 'mois': {
      const debut = new Date(reference.getFullYear(), reference.getMonth(), 1)
      const fin = new Date(reference.getFullYear(), reference.getMonth() + 1, 1)
      return { debut, fin }
    }
    case 'annee': {
      const debut = new Date(reference.getFullYear(), 0, 1)
      const fin = new Date(reference.getFullYear() + 1, 0, 1)
      return { debut, fin }
    }
    case 'personnalisee': {
      if (!filtre.dateDebut || !filtre.dateFin) {
        throw new Error("Periode personnalisee : dateDebut et dateFin sont requises")
      }
      const debut = parseDateLocale(filtre.dateDebut)
      const fin = parseDateLocale(filtre.dateFin)
      fin.setDate(fin.getDate() + 1) // date de fin incluse -> borne exclusive
      if (fin <= debut) {
        throw new Error('La date de fin doit etre posterieure ou egale a la date de debut')
      }
      return { debut, fin }
    }
    default: {
      const exhaustif: never = filtre.type
      throw new Error(`Type de periode inconnu : ${exhaustif}`)
    }
  }
}

/** Periode precedente de meme duree, utilisee pour la comparaison en % (4.5). */
export function periodePrecedente(periode: PeriodeResolue): PeriodeResolue {
  const dureeMs = periode.fin.getTime() - periode.debut.getTime()
  return {
    debut: new Date(periode.debut.getTime() - dureeMs),
    fin: new Date(periode.debut.getTime())
  }
}

export function nombreDeJours(periode: PeriodeResolue): number {
  return Math.max(1, Math.round((periode.fin.getTime() - periode.debut.getTime()) / 86_400_000))
}
