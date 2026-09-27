import path from 'node:path'
import fs from 'node:fs'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import * as schema from './schema'

export type AppDb = ReturnType<typeof drizzle<typeof schema>>
/** Type d'une transaction (le `tx` recu dans `db.transaction((tx) => ...)`). */
export type AppTransaction = Parameters<Parameters<AppDb['transaction']>[0]>[0]
/** A utiliser pour toute fonction de service appelable aussi bien avec `db` qu'avec un `tx`. */
export type AppDbOuTransaction = AppDb | AppTransaction

let dbInstance: AppDb | null = null
let sqliteInstance: Database.Database | null = null

/**
 * Ouvre (ou reutilise) la connexion SQLite et applique les migrations Drizzle.
 * `dbPath` et `migrationsFolder` sont fournis par l'appelant pour que ce fichier
 * reste utilisable aussi bien depuis Electron (main/index.ts, qui connait
 * app.getPath/app.getAppPath) que depuis un script Node autonome (seed.ts, tests).
 */
export function getDb(dbPath: string, migrationsFolder: string): AppDb {
  if (dbInstance) return dbInstance

  fs.mkdirSync(path.dirname(dbPath), { recursive: true })
  sqliteInstance = new Database(dbPath)
  sqliteInstance.pragma('journal_mode = WAL')
  sqliteInstance.pragma('foreign_keys = ON')

  dbInstance = drizzle(sqliteInstance, { schema })
  migrate(dbInstance, { migrationsFolder })

  return dbInstance
}

export function closeDb(): void {
  sqliteInstance?.close()
  sqliteInstance = null
  dbInstance = null
}

/** Instance brute better-sqlite3 (pour la sauvegarde, voir services/backupService.ts). */
export function getSqliteInstance(): Database.Database {
  if (!sqliteInstance) throw new Error('Base de donnees non initialisee')
  return sqliteInstance
}
