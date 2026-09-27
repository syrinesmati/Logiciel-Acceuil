import type { AppDb } from '../db/client'
import { enregistrerIpcSysteme } from './systeme'
import { enregistrerIpcImport } from './import'
import { enregistrerIpcAccueil } from './accueil'
import { enregistrerIpcParametres } from './parametres'
import { enregistrerIpcStats } from './stats'

export function enregistrerTousLesIpc(db: AppDb): void {
  enregistrerIpcSysteme(db)
  enregistrerIpcImport(db)
  enregistrerIpcAccueil(db)
  enregistrerIpcParametres(db)
  enregistrerIpcStats(db)
}
