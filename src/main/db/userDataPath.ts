import os from 'node:os'
import path from 'node:path'

const APP_NAME = 'bibliotheque-accueil'

/**
 * Reproduit le calcul par defaut d'Electron pour `app.getPath('userData')`,
 * afin que le script de seed (execute hors Electron, via tsx) ecrive dans
 * exactement le meme dossier que l'app en dev. Le process main utilise, lui,
 * directement `app.getPath('userData')` (voir src/main/index.ts).
 */
export function resolveUserDataDir(): string {
  if (process.platform === 'win32') {
    return path.join(process.env.APPDATA ?? path.join(os.homedir(), 'AppData', 'Roaming'), APP_NAME)
  }
  if (process.platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Application Support', APP_NAME)
  }
  return path.join(process.env.XDG_CONFIG_HOME ?? path.join(os.homedir(), '.config'), APP_NAME)
}

export function resolveDbPath(): string {
  return path.join(resolveUserDataDir(), 'accueil.sqlite')
}
