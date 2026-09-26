import type { EnteteColonne, LigneImportParsee, MappageColonnes } from '@shared/import'
import { analyserDateNaissance } from './dateRepair'

const VALEURS_NUMERO_INVALIDES = new Set(['', '-', '--', 'n/a', 'na', 'null'])

function indexColonne(colonnes: EnteteColonne[], cle: string | undefined): number {
  if (!cle) return -1
  return colonnes.findIndex((c) => c.cle === cle)
}

/** Analyse un fichier d'export structure (plusieurs colonnes avec en-tetes, voir 4.3). */
export function parserColonnesMappees(
  lignesDonnees: string[][],
  colonnes: EnteteColonne[],
  mappage: MappageColonnes,
  dateReference: Date = new Date()
): LigneImportParsee[] {
  const idxNumero = indexColonne(colonnes, mappage.numeroAbonne)
  const idxNomComplet = indexColonne(colonnes, mappage.nomComplet)
  const idxPrenom = indexColonne(colonnes, mappage.prenom)
  const idxNom = indexColonne(colonnes, mappage.nom)
  const idxDate = indexColonne(colonnes, mappage.dateNaissance)
  const idxTelephone = indexColonne(colonnes, mappage.telephone)
  const idxEmail = indexColonne(colonnes, mappage.email)

  const resultats: LigneImportParsee[] = []

  lignesDonnees.forEach((ligne, index) => {
    if (ligne.every((c) => c.trim() === '')) return

    const corrections: string[] = []
    const avertissements: string[] = []

    const ligneBrute: Record<string, string> = {}
    colonnes.forEach((colonne, i) => {
      ligneBrute[colonne.libelle] = ligne[i]?.trim() ?? ''
    })

    const numeroBrut = (idxNumero >= 0 ? ligne[idxNumero] : '')?.trim() ?? ''
    const numeroAbonne = VALEURS_NUMERO_INVALIDES.has(numeroBrut.toLowerCase()) ? null : numeroBrut

    let nomComplet: string | null
    if (idxNomComplet >= 0) {
      nomComplet = ligne[idxNomComplet]?.trim() || null
    } else {
      const prenom = (idxPrenom >= 0 ? ligne[idxPrenom] : '')?.trim() ?? ''
      const nom = (idxNom >= 0 ? ligne[idxNom] : '')?.trim() ?? ''
      nomComplet = [prenom, nom].filter(Boolean).join(' ').trim() || null
      if (idxPrenom >= 0 && idxNom >= 0) {
        if (!prenom && nom) avertissements.push('prenom manquant')
        if (prenom && !nom) avertissements.push('nom (famille) manquant')
      }
    }
    if (!nomComplet) avertissements.push('nom manquant')

    const dateBrute = (idxDate >= 0 ? ligne[idxDate] : '')?.trim() ?? ''
    const resultatDate = analyserDateNaissance(dateBrute, dateReference)
    if (resultatDate.correction) corrections.push(resultatDate.correction)
    if (resultatDate.avertissement) avertissements.push(resultatDate.avertissement)

    const telephone = (idxTelephone >= 0 ? ligne[idxTelephone] : '')?.trim() || null
    if (telephone && telephone.length !== 8) {
      avertissements.push(`telephone de longueur inhabituelle (${telephone.length} chiffres) : "${telephone}"`)
    }

    const email = (idxEmail >= 0 ? ligne[idxEmail] : '')?.trim() || null

    let erreur: string | null = null
    if (!numeroAbonne) {
      erreur = "numero d'abonne manquant ou invalide sur cette ligne"
    }

    const statut = erreur
      ? 'rejetee'
      : avertissements.length > 0
        ? 'a_verifier'
        : corrections.length > 0
          ? 'corrigee'
          : 'ok'

    resultats.push({
      index,
      ligneBrute,
      statut,
      numeroAbonne,
      nomComplet,
      dateNaissance: resultatDate.iso,
      telephone,
      email,
      corrections,
      avertissements,
      erreur
    })
  })

  return resultats
}
