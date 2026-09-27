import { and, desc, eq, gte, like, lt } from 'drizzle-orm'
import type { AppDb, AppDbOuTransaction } from '../db/client'
import { abonnes, visites, visiteMotifs } from '../db/schema'
import { normaliserNom } from './nomArabe'
import { nettoyerNumeroScanne } from './scanUtils'
import { calculerAge } from './age'
import type {
  AbonnePourFiche,
  EnregistrerVisitePayload,
  InscriptionNonAbonnePayload,
  InscriptionRapidePayload,
  ResultatInscription,
  ResultatRecherche
} from '@shared/accueil'

type LigneAbonne = typeof abonnes.$inferSelect

function versAbonnePourFiche(ligne: LigneAbonne, dateReference: Date): AbonnePourFiche {
  return {
    id: ligne.id,
    numeroAbonne: ligne.numeroAbonne,
    nomComplet: ligne.nomComplet,
    dateNaissance: ligne.dateNaissance,
    sexe: ligne.sexe,
    telephone: ligne.telephone,
    email: ligne.email,
    source: ligne.source,
    actif: ligne.actif,
    age: ligne.dateNaissance ? calculerAge(new Date(ligne.dateNaissance), dateReference) : null
  }
}

function bornesJour(dateReference: Date): { debut: string; fin: string } {
  const debut = new Date(dateReference.getFullYear(), dateReference.getMonth(), dateReference.getDate())
  const fin = new Date(debut)
  fin.setDate(fin.getDate() + 1)
  return { debut: debut.toISOString(), fin: fin.toISOString() }
}

export function compterVisitesAujourdhui(db: AppDbOuTransaction, dateReference: Date = new Date()): number {
  const { debut, fin } = bornesJour(dateReference)
  return db
    .select({ id: visites.id })
    .from(visites)
    .where(and(gte(visites.dateHeure, debut), lt(visites.dateHeure, fin)))
    .all().length
}

/**
 * Recherche un abonne par numero pour l'ecran d'accueil (scan ou saisie manuelle).
 * Signale un eventuel double-scan recent (voir 4.1), sans jamais bloquer l'acces.
 */
export function rechercherAbonnePourVisite(
  numeroBrut: string,
  db: AppDb,
  delaiAntiDoubleScanSecondes: number,
  dateReference: Date = new Date()
): ResultatRecherche {
  const numero = nettoyerNumeroScanne(numeroBrut)
  const ligne = db
    .select()
    .from(abonnes)
    .where(and(eq(abonnes.numeroAbonne, numero), eq(abonnes.actif, true)))
    .get()

  if (!ligne) return { trouve: false }

  const derniereVisite = db
    .select({ dateHeure: visites.dateHeure })
    .from(visites)
    .where(eq(visites.abonneId, ligne.id))
    .orderBy(desc(visites.dateHeure))
    .limit(1)
    .get()

  const avertissementDoubleScan = derniereVisite
    ? dateReference.getTime() - new Date(derniereVisite.dateHeure).getTime() < delaiAntiDoubleScanSecondes * 1000
    : false

  return {
    trouve: true,
    abonne: versAbonnePourFiche(ligne, dateReference),
    avertissementDoubleScan,
    derniereVisite: derniereVisite?.dateHeure ?? null
  }
}

function creerAbonneLeger(
  numero: string,
  donnees: { nomComplet: string; dateNaissance: string | null; sexe: 'H' | 'F' | null; telephone: string | null },
  source: 'inscription_rapide' | 'non_abonne',
  db: AppDb,
  dateReference: Date
): ResultatInscription {
  const existant = db.select({ id: abonnes.id }).from(abonnes).where(eq(abonnes.numeroAbonne, numero)).get()
  if (existant) {
    return { succes: false, erreur: `Le numero ${numero} est deja utilise par un abonne existant.` }
  }

  const maintenant = dateReference.toISOString()
  const inseree = db
    .insert(abonnes)
    .values({
      numeroAbonne: numero,
      nomComplet: donnees.nomComplet,
      nomNormalise: normaliserNom(donnees.nomComplet),
      dateNaissance: donnees.dateNaissance,
      sexe: donnees.sexe,
      telephone: donnees.telephone,
      source,
      datePremierImport: maintenant,
      dateDerniereMaj: maintenant,
      actif: true
    })
    .returning()
    .get()

  return { succes: true, abonne: versAbonnePourFiche(inseree, dateReference) }
}

/** Inscription rapide (4.2) : source = 'inscription_rapide', remplacee au prochain import Syracuse. */
export function inscrireAbonneRapide(
  payload: InscriptionRapidePayload,
  db: AppDb,
  dateReference: Date = new Date()
): ResultatInscription {
  const numero = nettoyerNumeroScanne(payload.numeroAbonne)
  return creerAbonneLeger(numero, payload, 'inscription_rapide', db, dateReference)
}

/**
 * Visiteur non-abonne identifie par sa CIN (pas de carte de la mediatheque) :
 * source = 'non_abonne', jamais rapprochee d'un import Syracuse. Si la meme CIN
 * revient plus tard, `rechercherAbonnePourVisite` retrouve directement sa fiche.
 */
export function inscrireNonAbonne(
  payload: InscriptionNonAbonnePayload,
  db: AppDb,
  dateReference: Date = new Date()
): ResultatInscription {
  const cin = nettoyerNumeroScanne(payload.cin)
  return creerAbonneLeger(cin, { ...payload, telephone: null }, 'non_abonne', db, dateReference)
}

export function completerSexe(
  abonneId: number,
  sexe: 'H' | 'F',
  db: AppDb,
  dateReference: Date = new Date()
): AbonnePourFiche {
  const miseAJour = db
    .update(abonnes)
    .set({ sexe, dateDerniereMaj: dateReference.toISOString() })
    .where(eq(abonnes.id, abonneId))
    .returning()
    .get()
  if (!miseAJour) throw new Error(`Abonne introuvable (id ${abonneId})`)
  return versAbonnePourFiche(miseAJour, dateReference)
}

export function enregistrerVisite(
  payload: EnregistrerVisitePayload,
  db: AppDb,
  dateReference: Date = new Date()
): { compteurAujourdhui: number } {
  return db.transaction((tx) => {
    const dateHeure = dateReference.toISOString()
    const visite = tx.insert(visites).values({ abonneId: payload.abonneId, dateHeure }).returning({ id: visites.id }).get()
    tx.insert(visiteMotifs)
      .values(payload.motifIds.map((motifId) => ({ visiteId: visite.id, motifId })))
      .run()
    return { compteurAujourdhui: compterVisitesAujourdhui(tx, dateReference) }
  })
}

export function rechercherAbonnesParNom(
  requete: string,
  db: AppDb,
  dateReference: Date = new Date()
): AbonnePourFiche[] {
  const normalise = normaliserNom(requete)
  if (!normalise) return []
  const lignes = db
    .select()
    .from(abonnes)
    .where(and(eq(abonnes.actif, true), like(abonnes.nomNormalise, `%${normalise}%`)))
    .limit(20)
    .all()
  return lignes.map((l) => versAbonnePourFiche(l, dateReference))
}
