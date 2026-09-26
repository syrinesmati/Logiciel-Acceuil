/** Types partages pour l'import Syracuse (voir cahier des charges 4.3). */

export type StatutLigneImport = 'ok' | 'corrigee' | 'a_verifier' | 'rejetee'

export type ModeImport = 'colonne_unique' | 'mapping_colonnes'

export type SexeAbonne = 'H' | 'F'

/** Une ligne source une fois analysee, avant ecriture en base. */
export interface LigneImportParsee {
  /** Index de la ligne dans le fichier source (pour l'affichage et le debogage). */
  index: number
  /** Contenu brut d'origine : texte de la ligne (mode colonne unique) ou objet ligne (mode mapping). */
  ligneBrute: string | Record<string, string>
  statut: StatutLigneImport
  numeroAbonne: string | null
  nomComplet: string | null
  dateNaissance: string | null
  telephone: string | null
  email: string | null
  /** Corrections automatiques appliquees (statut 'corrigee'). */
  corrections: string[]
  /** Champs facultatifs manquants ou douteux (statut 'a_verifier'). */
  avertissements: string[]
  /** Raison du rejet (statut 'rejetee'). */
  erreur: string | null
}

/** Cible de mappage pour le mode "export structure" (plusieurs colonnes avec en-tetes). */
export interface MappageColonnes {
  numeroAbonne: string
  nomComplet?: string
  prenom?: string
  nom?: string
  dateNaissance?: string
  telephone?: string
  email?: string
}

export interface EnteteColonne {
  cle: string
  libelle: string
  exemple: string
}

export interface FormatDetecte {
  mode: ModeImport
  /** Presentes uniquement en mode mapping_colonnes. */
  colonnes?: EnteteColonne[]
  /** Proposition automatique de mappage (mode mapping_colonnes), a confirmer/ajuster par l'utilisateur. */
  mappageSuggere?: MappageColonnes
}

export interface RapportImport {
  nbCrees: number
  nbMisAJour: number
  nbCorriges: number
  nbRejetes: number
  /** Compte total de lignes valides (ok + corrigee + a_verifier), utile pour l'affichage. */
  nbTotalLignesValides: number
}

export interface ApercuImport {
  nomFichier: string
  mode: ModeImport
  format: FormatDetecte
  lignes: LigneImportParsee[]
  compteurs: Record<StatutLigneImport, number>
}

export interface LigneACorriger {
  id: number
  importId: number | null
  ligneBrute: string | Record<string, string>
  motifRejet: string
  statut: 'en_attente' | 'corrigee' | 'ignoree'
  numeroAbonneDetecte: string | null
  nomDetecte: string | null
  dateNaissanceDetectee: string | null
  telephoneDetecte: string | null
  emailDetecte: string | null
  dateCreation: string
}

export interface HistoriqueImport {
  id: number
  date: string
  nomFichier: string
  nbCrees: number
  nbMisAJour: number
  nbCorriges: number
  nbRejetes: number
}
