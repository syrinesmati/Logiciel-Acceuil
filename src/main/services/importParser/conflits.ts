import type { LigneImportParsee } from '@shared/import'
import { normaliserNom } from '../nomArabe'

/**
 * Detecte les conflits de numero d'abonne : meme numero, noms differents,
 * a l'interieur du fichier importe. On ne doit jamais ecraser silencieusement
 * une fiche existante ni en creer une ambigue : les lignes en conflit sont
 * basculees en statut "rejetee" (voir 4.3, elles iront dans lignes_a_corriger).
 */
export function detecterConflitsDansFichier(lignes: LigneImportParsee[]): LigneImportParsee[] {
  const nomsParNumero = new Map<string, Set<string>>()

  for (const ligne of lignes) {
    if (ligne.statut === 'rejetee' || !ligne.numeroAbonne || !ligne.nomComplet) continue
    const nomsExistants = nomsParNumero.get(ligne.numeroAbonne) ?? new Set<string>()
    nomsExistants.add(normaliserNom(ligne.nomComplet))
    nomsParNumero.set(ligne.numeroAbonne, nomsExistants)
  }

  const numerosEnConflit = new Set(
    [...nomsParNumero.entries()].filter(([, noms]) => noms.size > 1).map(([numero]) => numero)
  )

  if (numerosEnConflit.size === 0) return lignes

  return lignes.map((ligne) => {
    if (!ligne.numeroAbonne || !numerosEnConflit.has(ligne.numeroAbonne)) return ligne
    return {
      ...ligne,
      statut: 'rejetee',
      erreur: `numero d'abonne ${ligne.numeroAbonne} utilise par plusieurs noms differents dans le fichier`
    }
  })
}

/**
 * Verifie les conflits par rapport a des abonnes deja en base (numero existant,
 * mais nom clairement different). Fournir une fonction de lookup plutot que la
 * DB directement pour rester testable sans SQLite.
 */
export function detecterConflitsAvecBase(
  lignes: LigneImportParsee[],
  nomExistant: (numeroAbonne: string) => string | null
): LigneImportParsee[] {
  return lignes.map((ligne) => {
    if (ligne.statut === 'rejetee' || !ligne.numeroAbonne || !ligne.nomComplet) return ligne
    const existant = nomExistant(ligne.numeroAbonne)
    if (!existant) return ligne
    if (normaliserNom(existant) === normaliserNom(ligne.nomComplet)) return ligne
    return {
      ...ligne,
      statut: 'rejetee' as const,
      erreur: `numero d'abonne ${ligne.numeroAbonne} deja utilise en base par "${existant}" (nom different : "${ligne.nomComplet}")`
    }
  })
}
