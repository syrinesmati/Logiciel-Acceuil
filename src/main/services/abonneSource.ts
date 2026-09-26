import { eq } from 'drizzle-orm'
import type { AppDb } from '../db/client'
import { abonnes } from '../db/schema'
import type { Abonne } from '@shared/types'

/**
 * Abstraction volontairement isolee de la source de verite "abonnes".
 * Aujourd'hui : base SQLite locale alimentee par import Syracuse.
 * Demain (hors scope de cette version) : connexion directe a Syracuse
 * (web service ou protocole SIP2) sans toucher au reste de l'app, tant
 * que cette interface est respectee.
 */
export interface AbonneSource {
  findByNumero(numero: string): Abonne | null
  countActifs(): number
}

function versAbonne(row: typeof abonnes.$inferSelect): Abonne {
  return {
    id: row.id,
    numeroAbonne: row.numeroAbonne,
    nomComplet: row.nomComplet,
    dateNaissance: row.dateNaissance,
    sexe: row.sexe,
    telephone: row.telephone,
    email: row.email,
    source: row.source,
    actif: row.actif
  }
}

export class LocalAbonneSource implements AbonneSource {
  constructor(private readonly db: AppDb) {}

  findByNumero(numero: string): Abonne | null {
    const row = this.db.select().from(abonnes).where(eq(abonnes.numeroAbonne, numero)).get()
    return row ? versAbonne(row) : null
  }

  countActifs(): number {
    const rows = this.db.select({ id: abonnes.id }).from(abonnes).where(eq(abonnes.actif, true)).all()
    return rows.length
  }
}
