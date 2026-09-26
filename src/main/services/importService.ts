import { eq } from 'drizzle-orm'
import type {
  ApercuImport,
  HistoriqueImport,
  LigneACorriger,
  LigneImportParsee,
  MappageColonnes,
  RapportImport,
  StatutLigneImport
} from '@shared/import'
import type { AppDb } from '../db/client'
import { abonnes, imports, lignesACorriger } from '../db/schema'
import { normaliserNom } from './nomArabe'
import { lireFichierImport } from './importParser/lecteurFichier'
import { detecterFormat } from './importParser/detectionFormat'
import { parserColonneUnique } from './importParser/parseurColonneUnique'
import { parserColonnesMappees } from './importParser/parseurColonnesMappees'
import { detecterConflitsAvecBase, detecterConflitsDansFichier } from './importParser/conflits'

const COMPTEURS_VIDES: Record<StatutLigneImport, number> = {
  ok: 0,
  corrigee: 0,
  a_verifier: 0,
  rejetee: 0
}

function compterStatuts(lignes: LigneImportParsee[]): Record<StatutLigneImport, number> {
  const compteurs = { ...COMPTEURS_VIDES }
  for (const ligne of lignes) compteurs[ligne.statut]++
  return compteurs
}

function nomExistantEnBase(db: AppDb): (numeroAbonne: string) => string | null {
  return (numeroAbonne: string) => {
    const row = db
      .select({ nomComplet: abonnes.nomComplet })
      .from(abonnes)
      .where(eq(abonnes.numeroAbonne, numeroAbonne))
      .get()
    return row?.nomComplet ?? null
  }
}

/**
 * Lit et analyse un fichier d'import sans rien ecrire en base : sert a construire
 * l'ecran d'apercu (tableau + compteurs) avant confirmation par l'utilisateur.
 */
export async function analyserFichier(
  cheminFichier: string,
  nomFichier: string,
  db: AppDb,
  mappageChoisi?: MappageColonnes,
  dateReference: Date = new Date()
): Promise<ApercuImport> {
  const { lignes: lignesBrutes } = await lireFichierImport(cheminFichier)
  const format = detecterFormat(lignesBrutes)

  let lignes: LigneImportParsee[]
  if (format.mode === 'colonne_unique') {
    lignes = parserColonneUnique(
      lignesBrutes.map((l) => l[0] ?? ''),
      dateReference
    )
  } else {
    const mappage = mappageChoisi ?? format.mappageSuggere
    if (!mappage) {
      throw new Error(
        "Impossible de deviner automatiquement les colonnes de ce fichier. Veuillez preciser le mappage manuellement."
      )
    }
    const indexEntete = lignesBrutes.findIndex((l) => l.some((c) => c.trim() !== ''))
    const lignesDonnees = lignesBrutes.slice(indexEntete + 1)
    lignes = parserColonnesMappees(lignesDonnees, format.colonnes!, mappage, dateReference)
  }

  lignes = detecterConflitsDansFichier(lignes)
  lignes = detecterConflitsAvecBase(lignes, nomExistantEnBase(db))

  return {
    nomFichier,
    mode: format.mode,
    format,
    lignes,
    compteurs: compterStatuts(lignes)
  }
}

/**
 * Ecrit le resultat d'un import en base dans une transaction unique : upsert des
 * abonnes valides, enregistrement des lignes rejetees pour correction manuelle,
 * et historique de l'import. Syracuse fait foi : les donnees importees ecrasent
 * les anciennes, sauf le sexe saisi localement (jamais fourni par l'import).
 */
export function executerImport(lignes: LigneImportParsee[], nomFichier: string, db: AppDb): RapportImport {
  return db.transaction((tx) => {
    let nbCrees = 0
    let nbMisAJour = 0
    let nbCorriges = 0
    const maintenant = new Date().toISOString()

    for (const ligne of lignes) {
      if (ligne.statut === 'rejetee') {
        tx.insert(lignesACorriger)
          .values({
            ligneBrute: ligne.ligneBrute,
            motifRejet: ligne.erreur ?? 'rejetee',
            statut: 'en_attente',
            numeroAbonneDetecte: ligne.numeroAbonne,
            nomDetecte: ligne.nomComplet,
            dateNaissanceDetectee: ligne.dateNaissance,
            telephoneDetecte: ligne.telephone,
            emailDetecte: ligne.email,
            dateCreation: maintenant
          })
          .run()
        continue
      }

      if (!ligne.numeroAbonne) continue // ne devrait pas arriver hors statut 'rejetee'

      const existant = tx
        .select({ id: abonnes.id })
        .from(abonnes)
        .where(eq(abonnes.numeroAbonne, ligne.numeroAbonne))
        .get()

      const nomComplet = ligne.nomComplet ?? ''
      const valeurs = {
        nomComplet,
        nomNormalise: normaliserNom(nomComplet),
        dateNaissance: ligne.dateNaissance,
        telephone: ligne.telephone,
        email: ligne.email
      }

      if (existant) {
        tx.update(abonnes)
          .set({ ...valeurs, source: 'import', actif: true, dateDerniereMaj: maintenant })
          .where(eq(abonnes.id, existant.id))
          .run()
        nbMisAJour++
      } else {
        tx.insert(abonnes)
          .values({
            numeroAbonne: ligne.numeroAbonne,
            ...valeurs,
            source: 'import',
            actif: true,
            datePremierImport: maintenant,
            dateDerniereMaj: maintenant
          })
          .run()
        nbCrees++
      }

      if (ligne.statut === 'corrigee') nbCorriges++
    }

    const nbRejetes = lignes.filter((l) => l.statut === 'rejetee').length
    const rapport: RapportImport = {
      nbCrees,
      nbMisAJour,
      nbCorriges,
      nbRejetes,
      nbTotalLignesValides: lignes.length - nbRejetes
    }

    tx.insert(imports)
      .values({
        date: maintenant,
        nomFichier,
        nbCrees,
        nbMisAJour,
        nbCorriges,
        nbRejetes,
        rapport
      })
      .run()

    return rapport
  })
}

export function listerHistoriqueImports(db: AppDb): HistoriqueImport[] {
  return db
    .select({
      id: imports.id,
      date: imports.date,
      nomFichier: imports.nomFichier,
      nbCrees: imports.nbCrees,
      nbMisAJour: imports.nbMisAJour,
      nbCorriges: imports.nbCorriges,
      nbRejetes: imports.nbRejetes
    })
    .from(imports)
    .orderBy(imports.id)
    .all()
    .reverse()
}

export function listerLignesACorriger(db: AppDb): LigneACorriger[] {
  return db
    .select()
    .from(lignesACorriger)
    .where(eq(lignesACorriger.statut, 'en_attente'))
    .all()
    .map((row) => ({
      ...row,
      ligneBrute: row.ligneBrute as string | Record<string, string>
    }))
    .reverse()
}

export function ignorerLigneACorriger(id: number, db: AppDb): void {
  db.update(lignesACorriger).set({ statut: 'ignoree' }).where(eq(lignesACorriger.id, id)).run()
}

export interface CorrectionManuelle {
  numeroAbonne: string
  nomComplet: string
  dateNaissance: string | null
  telephone: string | null
  email: string | null
}

/**
 * Reprend manuellement une ligne a corriger (ecran "Lignes a corriger") : si le
 * numero choisi ne rentre plus en conflit, l'abonne est cree/mis a jour et la
 * ligne passe en statut "corrigee". Sinon le conflit est renvoye pour un nouvel essai.
 */
export function corrigerLigneManuellement(
  id: number,
  correction: CorrectionManuelle,
  db: AppDb
): { succes: true } | { succes: false; erreur: string } {
  const existant = db
    .select({ id: abonnes.id, nomComplet: abonnes.nomComplet })
    .from(abonnes)
    .where(eq(abonnes.numeroAbonne, correction.numeroAbonne))
    .get()

  if (existant && normaliserNom(existant.nomComplet) !== normaliserNom(correction.nomComplet)) {
    return {
      succes: false,
      erreur: `Le numero ${correction.numeroAbonne} est deja utilise par "${existant.nomComplet}" en base.`
    }
  }

  const maintenant = new Date().toISOString()
  const valeurs = {
    nomComplet: correction.nomComplet,
    nomNormalise: normaliserNom(correction.nomComplet),
    dateNaissance: correction.dateNaissance,
    telephone: correction.telephone,
    email: correction.email
  }

  db.transaction((tx) => {
    if (existant) {
      tx.update(abonnes)
        .set({ ...valeurs, source: 'import', actif: true, dateDerniereMaj: maintenant })
        .where(eq(abonnes.id, existant.id))
        .run()
    } else {
      tx.insert(abonnes)
        .values({
          numeroAbonne: correction.numeroAbonne,
          ...valeurs,
          source: 'import',
          actif: true,
          datePremierImport: maintenant,
          dateDerniereMaj: maintenant
        })
        .run()
    }
    tx.update(lignesACorriger).set({ statut: 'corrigee' }).where(eq(lignesACorriger.id, id)).run()
  })

  return { succes: true }
}
