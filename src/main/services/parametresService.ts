import { eq } from 'drizzle-orm'
import type { AppDb } from '../db/client'
import { parametres } from '../db/schema'
import type { ParametresAccueil } from '@shared/accueil'
import type { ParametresGeneraux, TrancheAge } from '@shared/parametres'
import { TRANCHES_AGE_PAR_DEFAUT } from '@shared/parametres'

const CLE_NOM_BIBLIOTHEQUE = 'nom_bibliotheque'
const CLE_DELAI_ANTI_DOUBLE_SCAN = 'delai_anti_double_scan_secondes'
const CLE_DELAI_RETOUR_AUTO = 'delai_retour_auto_secondes'
const CLE_TRANCHES_AGE = 'tranches_age'

/**
 * Valeurs par defaut posees au premier lancement (voir 4.4). L'ecran Parametres
 * permet ensuite de les modifier ; ici on se contente de garantir qu'elles
 * existent toujours en base avec une valeur raisonnable.
 */
const PARAMETRES_PAR_DEFAUT: Record<string, string> = {
  [CLE_NOM_BIBLIOTHEQUE]: "Mediatheque de l'Ariana",
  [CLE_DELAI_ANTI_DOUBLE_SCAN]: '300',
  [CLE_DELAI_RETOUR_AUTO]: '30',
  [CLE_TRANCHES_AGE]: JSON.stringify(TRANCHES_AGE_PAR_DEFAUT)
}

export function assurerParametresParDefaut(db: AppDb): void {
  for (const [cle, valeur] of Object.entries(PARAMETRES_PAR_DEFAUT)) {
    const existant = db.select({ cle: parametres.cle }).from(parametres).where(eq(parametres.cle, cle)).get()
    if (!existant) db.insert(parametres).values({ cle, valeur }).run()
  }
}

function obtenirTexte(db: AppDb, cle: string, defaut: string): string {
  const row = db.select({ valeur: parametres.valeur }).from(parametres).where(eq(parametres.cle, cle)).get()
  return row?.valeur ?? defaut
}

function definirTexte(db: AppDb, cle: string, valeur: string): void {
  db.insert(parametres)
    .values({ cle, valeur })
    .onConflictDoUpdate({ target: parametres.cle, set: { valeur } })
    .run()
}

function obtenirNombre(db: AppDb, cle: string, defaut: number): number {
  const row = db.select({ valeur: parametres.valeur }).from(parametres).where(eq(parametres.cle, cle)).get()
  if (!row) return defaut
  const nombre = Number(row.valeur)
  return Number.isFinite(nombre) ? nombre : defaut
}

function obtenirTranchesAge(db: AppDb): TrancheAge[] {
  const row = db.select({ valeur: parametres.valeur }).from(parametres).where(eq(parametres.cle, CLE_TRANCHES_AGE)).get()
  if (!row) return TRANCHES_AGE_PAR_DEFAUT
  try {
    const parsed = JSON.parse(row.valeur)
    return Array.isArray(parsed) ? parsed : TRANCHES_AGE_PAR_DEFAUT
  } catch {
    return TRANCHES_AGE_PAR_DEFAUT
  }
}

export function obtenirParametresAccueil(db: AppDb): ParametresAccueil {
  return {
    delaiAntiDoubleScanSecondes: obtenirNombre(db, CLE_DELAI_ANTI_DOUBLE_SCAN, 300),
    delaiRetourAutoSecondes: obtenirNombre(db, CLE_DELAI_RETOUR_AUTO, 30)
  }
}

export function obtenirParametresGeneraux(db: AppDb): ParametresGeneraux {
  return {
    nomBibliotheque: obtenirTexte(db, CLE_NOM_BIBLIOTHEQUE, "Mediatheque de l'Ariana"),
    delaiAntiDoubleScanSecondes: obtenirNombre(db, CLE_DELAI_ANTI_DOUBLE_SCAN, 300),
    delaiRetourAutoSecondes: obtenirNombre(db, CLE_DELAI_RETOUR_AUTO, 30),
    tranchesAge: obtenirTranchesAge(db)
  }
}

export function enregistrerParametresGeneraux(valeurs: ParametresGeneraux, db: AppDb): void {
  definirTexte(db, CLE_NOM_BIBLIOTHEQUE, valeurs.nomBibliotheque)
  definirTexte(db, CLE_DELAI_ANTI_DOUBLE_SCAN, String(Math.max(1, Math.round(valeurs.delaiAntiDoubleScanSecondes))))
  definirTexte(db, CLE_DELAI_RETOUR_AUTO, String(Math.max(5, Math.round(valeurs.delaiRetourAutoSecondes))))
  definirTexte(db, CLE_TRANCHES_AGE, JSON.stringify(valeurs.tranchesAge))
}
