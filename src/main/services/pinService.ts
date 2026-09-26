import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import { eq } from 'drizzle-orm'
import type { AppDb } from '../db/client'
import { parametres } from '../db/schema'

const CLE_PIN = 'pin_hash'
const LONGUEUR_HASH = 64

/**
 * Code PIN admin (voir 4.4) : jamais stocke en clair. Format stocke :
 * "<sel hex>:<hash hex>" (scrypt, comparaison en temps constant).
 */
function hacherPin(pin: string, sel: Buffer): Buffer {
  return scryptSync(pin, sel, LONGUEUR_HASH)
}

function formaterHash(pin: string): string {
  const sel = randomBytes(16)
  const hash = hacherPin(pin, sel)
  return `${sel.toString('hex')}:${hash.toString('hex')}`
}

function verifierContreHash(pin: string, valeurStockee: string): boolean {
  const [selHex, hashHex] = valeurStockee.split(':')
  if (!selHex || !hashHex) return false
  const sel = Buffer.from(selHex, 'hex')
  const hashAttendu = Buffer.from(hashHex, 'hex')
  const hashCalcule = hacherPin(pin, sel)
  if (hashCalcule.length !== hashAttendu.length) return false
  return timingSafeEqual(hashCalcule, hashAttendu)
}

export function pinEstDefini(db: AppDb): boolean {
  const ligne = db.select({ cle: parametres.cle }).from(parametres).where(eq(parametres.cle, CLE_PIN)).get()
  return !!ligne
}

/** Definit le PIN au premier acces a la zone Parametres (voir 4.4). */
export function definirPin(pin: string, db: AppDb): void {
  const valeur = formaterHash(pin)
  db.insert(parametres)
    .values({ cle: CLE_PIN, valeur })
    .onConflictDoUpdate({ target: parametres.cle, set: { valeur } })
    .run()
}

export function verifierPin(pin: string, db: AppDb): boolean {
  const ligne = db.select({ valeur: parametres.valeur }).from(parametres).where(eq(parametres.cle, CLE_PIN)).get()
  if (!ligne) return false
  return verifierContreHash(pin, ligne.valeur)
}

export function changerPin(
  ancienPin: string,
  nouveauPin: string,
  db: AppDb
): { succes: true } | { succes: false; erreur: string } {
  if (!verifierPin(ancienPin, db)) {
    return { succes: false, erreur: 'Le code PIN actuel est incorrect.' }
  }
  definirPin(nouveauPin, db)
  return { succes: true }
}
