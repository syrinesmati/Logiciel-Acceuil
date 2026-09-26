import fs from 'node:fs'
import path from 'node:path'

/**
 * Journal d'erreurs fichier (voir 5.2) : jamais de message technique affiche
 * a l'utilisateur, mais tout est trace ici pour le debogage.
 */
export class Logger {
  private readonly fichier: string

  constructor(dossierUserData: string) {
    fs.mkdirSync(dossierUserData, { recursive: true })
    this.fichier = path.join(dossierUserData, 'app.log')
  }

  private ecrire(niveau: 'INFO' | 'ERROR', message: string, details?: unknown): void {
    const ligne = `[${new Date().toISOString()}] [${niveau}] ${message}${
      details !== undefined ? ' ' + safeStringify(details) : ''
    }\n`
    try {
      fs.appendFileSync(this.fichier, ligne, 'utf8')
    } catch {
      // Si l'ecriture du log echoue elle-meme, on ne doit pas planter l'app pour autant.
    }
  }

  info(message: string, details?: unknown): void {
    this.ecrire('INFO', message, details)
  }

  error(message: string, details?: unknown): void {
    this.ecrire('ERROR', message, details)
  }
}

function safeStringify(value: unknown): string {
  if (value instanceof Error) {
    return `${value.name}: ${value.message}\n${value.stack ?? ''}`
  }
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}
