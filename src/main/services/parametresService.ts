import { eq } from 'drizzle-orm'
import type { AppDb } from '../db/client'
import { parametres } from '../db/schema'
import type { ParametresAccueil } from '@shared/accueil'

/**
 * Valeurs par defaut posees au premier lancement (voir 4.4). L'ecran Parametres
 * (phase 4) permettra de les modifier ; ici on se contente de garantir qu'elles
 * existent toujours en base avec une valeur raisonnable.
 */
const PARAMETRES_PAR_DEFAUT: Record<string, string> = {
  delai_anti_double_scan_secondes: '300',
  delai_retour_auto_secondes: '30'
}

export function assurerParametresParDefaut(db: AppDb): void {
  for (const [cle, valeur] of Object.entries(PARAMETRES_PAR_DEFAUT)) {
    const existant = db.select({ cle: parametres.cle }).from(parametres).where(eq(parametres.cle, cle)).get()
    if (!existant) db.insert(parametres).values({ cle, valeur }).run()
  }
}

function obtenirParametreNombre(db: AppDb, cle: string, defaut: number): number {
  const row = db.select({ valeur: parametres.valeur }).from(parametres).where(eq(parametres.cle, cle)).get()
  if (!row) return defaut
  const nombre = Number(row.valeur)
  return Number.isFinite(nombre) ? nombre : defaut
}

export function obtenirParametresAccueil(db: AppDb): ParametresAccueil {
  return {
    delaiAntiDoubleScanSecondes: obtenirParametreNombre(db, 'delai_anti_double_scan_secondes', 300),
    delaiRetourAutoSecondes: obtenirParametreNombre(db, 'delai_retour_auto_secondes', 30)
  }
}
