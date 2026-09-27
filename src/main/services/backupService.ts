import path from 'node:path'
import fs from 'node:fs'
import { format } from 'date-fns'
import type Database from 'better-sqlite3'

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
