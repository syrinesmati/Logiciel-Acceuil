import { join } from 'path'
import { app, session, shell, BrowserWindow } from 'electron'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { getDb, closeDb } from './db/client'
import { enregistrerTousLesIpc } from './ipc'
import { Logger } from './services/logger'

/**
 * CSP posee dynamiquement plutot que dans index.html : en dev, le renderer est
 * charge depuis le serveur Vite (localhost) qui a besoin d'un script inline pour
 * le Fast Refresh ; en production il est charge en `file://` sans HMR, donc une
 * politique stricte ne casse rien.
 */
function appliquerCsp(): void {
  const politique = is.dev
    ? "default-src 'self' http://localhost:5173 ws://localhost:5173; script-src 'self' 'unsafe-inline' http://localhost:5173; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data:"
    : "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data:"

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [politique]
      }
    })
  })
}

function creerFenetrePrincipale(): BrowserWindow {
  const fenetre = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  fenetre.on('ready-to-show', () => fenetre.show())

  fenetre.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    fenetre.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    fenetre.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return fenetre
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('fr.mediatheque-ariana.accueil')

  app.on('browser-window-created', (_, fenetre) => {
    optimizer.watchWindowShortcuts(fenetre)
  })

  appliquerCsp()

  const dbPath = join(app.getPath('userData'), 'accueil.sqlite')
  // En dev, les .sql restent dans les sources (non embarquees dans out/main) ; en
  // build, electron-builder les copie dans resources/migrations (voir extraResources
  // dans electron-builder.yml).
  const migrationsFolder = app.isPackaged
    ? join(process.resourcesPath, 'migrations')
    : join(app.getAppPath(), 'src/main/db/migrations')
  const logger = new Logger(app.getPath('userData'))

  try {
    const db = getDb(dbPath, migrationsFolder)
    enregistrerTousLesIpc(db)
  } catch (erreur) {
    logger.error("Echec de l'initialisation de la base de donnees", erreur)
    throw erreur
  }

  creerFenetrePrincipale()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) creerFenetrePrincipale()
  })
})

app.on('window-all-closed', () => {
  closeDb()
  if (process.platform !== 'darwin') app.quit()
})
