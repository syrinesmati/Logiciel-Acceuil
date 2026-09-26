import type { AppDb } from '../db/client'
import { enregistrerIpcSysteme } from './systeme'

export function enregistrerTousLesIpc(db: AppDb): void {
  enregistrerIpcSysteme(db)
}
