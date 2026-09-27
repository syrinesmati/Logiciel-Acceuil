import path from 'node:path'
import fs from 'node:fs'
import { format } from 'date-fns'
import Database from 'better-sqlite3'
import type { ApercuSauvegarde } from '@shared/parametres'

const NOM_DOSSIER_SAUVEGARDES_AUTO = 'sauvegardes-automatiques'
const NB_SAUVEGARDES_AUTO_CONSERVEES = 14

// Date LOCALE (pas toISOString, qui bascule sur le mauvais jour civil selon le
// fuseau horaire) : "le jour" d'une sauvegarde doit correspondre au calendrier
// du poste, comme les bornes de jour utilisees pour les statistiques.
function formatDateFichier(dateReference: Date): string {
  return format(dateReference, 'yyyy-MM-dd')
}

/** Nom suggere pour une sauvegarde manuelle (voir SectionSecurite.tsx). */
export function nommerFichierSauvegardeManuelle(dateReference: Date = new Date()): string {
  return `sauvegarde_bibliotheque_${formatDateFichier(dateReference)}.sqlite`
}

/**
 * Copie coherente de la base vers `cheminDestination` via l'API de sauvegarde en
 * ligne de SQLite (`Database#backup`) : contrairement a une copie brute du
 * fichier, elle est sure meme en mode WAL avec des ecritures en cours.
 */
export async function sauvegarderVers(sqlite: Database.Database, cheminDestination: string): Promise<void> {
  fs.mkdirSync(path.dirname(cheminDestination), { recursive: true })
  await sqlite.backup(cheminDestination)
}

function purgerAnciennesSauvegardes(dossier: string): void {
  const fichiers = fs
    .readdirSync(dossier)
    .filter((f) => f.endsWith('.sqlite'))
    .sort()
  const enTrop = fichiers.length - NB_SAUVEGARDES_AUTO_CONSERVEES
  for (let i = 0; i < enTrop; i++) {
    fs.rmSync(path.join(dossier, fichiers[i]!), { force: true })
  }
}

/**
 * Sauvegarde automatique quotidienne (filet de securite local contre la
 * corruption ou une erreur de manipulation) : une copie par jour dans le
 * dossier userData, purge au-dela de NB_SAUVEGARDES_AUTO_CONSERVEES jours.
 * Ne protege PAS contre une panne totale du disque/PC : le personnel doit
 * aussi faire une sauvegarde manuelle reguliere vers un support externe
 * (cle USB, dossier reseau) via Parametres > Securite.
 */
export async function effectuerSauvegardeAutomatiqueSiNecessaire(
  sqlite: Database.Database,
  dossierUserData: string,
  dateReference: Date = new Date()
): Promise<void> {
  const dossier = path.join(dossierUserData, NOM_DOSSIER_SAUVEGARDES_AUTO)
  const cheminDuJour = path.join(dossier, `accueil-${formatDateFichier(dateReference)}.sqlite`)
  if (fs.existsSync(cheminDuJour)) return

  await sauvegarderVers(sqlite, cheminDuJour)
  purgerAnciennesSauvegardes(dossier)
}

/**
 * Ouvre `cheminCandidat` en lecture seule et verifie qu'il s'agit bien d'une
 * sauvegarde valide de cette application (tables attendues presentes), avant
 * de proposer une restauration (voir SectionSecurite.tsx). Ne modifie rien.
 */
export function analyserFichierSauvegarde(cheminCandidat: string): ApercuSauvegarde {
  let sqlite: Database.Database | null = null
  try {
    sqlite = new Database(cheminCandidat, { readonly: true, fileMustExist: true })
    const nbAbonnes = (sqlite.prepare('SELECT COUNT(*) AS n FROM abonnes').get() as { n: number }).n
    const nbVisites = (sqlite.prepare('SELECT COUNT(*) AS n FROM visites').get() as { n: number }).n
    return { valide: true, chemin: cheminCandidat, nbAbonnes, nbVisites }
  } catch {
    return { valide: false }
  } finally {
    sqlite?.close()
  }
}

/**
 * Remplace la base actuellement ouverte par le fichier de sauvegarde valide
 * `cheminSource`. Doit etre appelee juste avant de fermer/relancer l'app (la
 * connexion SQLite en cours doit deja etre fermee par l'appelant) : ce n'est
 * pas une operation a chaud, l'app entiere doit redemarrer pour rouvrir le
 * fichier restaure proprement.
 */
export function restaurerDepuis(cheminSource: string, cheminDbActuelle: string): void {
  for (const suffixe of ['', '-wal', '-shm']) {
    fs.rmSync(cheminDbActuelle + suffixe, { force: true })
  }
  fs.copyFileSync(cheminSource, cheminDbActuelle)
}
