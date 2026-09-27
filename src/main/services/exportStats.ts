import ExcelJS from 'exceljs'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { FiltrePeriode, TableauDeBord } from '@shared/stats'
import type { PeriodeResolue } from './periode'

/** Nom de fichier incluant la periode (voir 4.6), ex. "statistiques_2026-09.xlsx". */
export function nommerFichierStatistiques(
  filtre: FiltrePeriode,
  periode: PeriodeResolue,
  extension: 'xlsx' | 'pdf'
): string {
  const finInclusive = new Date(periode.fin.getTime() - 86_400_000)
  let suffixe: string
  switch (filtre.type) {
    case 'aujourdhui':
      suffixe = format(periode.debut, 'yyyy-MM-dd')
      break
    case 'mois':
      suffixe = format(periode.debut, 'yyyy-MM')
      break
    case 'annee':
      suffixe = format(periode.debut, 'yyyy')
      break
    case 'semaine':
    case 'personnalisee':
    default:
      suffixe = `${format(periode.debut, 'yyyy-MM-dd')}_${format(finInclusive, 'yyyy-MM-dd')}`
  }
  return `statistiques_${suffixe}.${extension}`
}

/** Periode formatee pour affichage humain (Excel, PDF) : "01/09/2026 au 30/09/2026". */
export function formaterPeriodeLisible(periode: PeriodeResolue): string {
  const finInclusive = new Date(periode.fin.getTime() - 86_400_000)
  return `${format(periode.debut, 'dd/MM/yyyy', { locale: fr })} au ${format(finInclusive, 'dd/MM/yyyy', { locale: fr })}`
}

const enTete = { font: { bold: true } }

function pivoterMotifParTrancheAge(tableau: TableauDeBord): { colonnes: string[]; lignes: (string | number)[][] } {
  const motifsConnus = new Map<number, string>()
  for (const tranche of tableau.motifParTrancheAge) {
    for (const motif of tranche.parMotif) motifsConnus.set(motif.motifId, motif.libelle)
  }
  const motifs = [...motifsConnus.entries()]

  const colonnes = ['Tranche age', ...motifs.map(([, libelle]) => libelle)]
  const lignes = tableau.motifParTrancheAge.map((tranche) => [
    tranche.trancheLibelle,
    ...motifs.map(([motifId]) => tranche.parMotif.find((m) => m.motifId === motifId)?.nombre ?? 0)
  ])
  return { colonnes, lignes }
}

/** Classeur Excel multi-feuilles pour la periode filtree (voir 4.6). */
export async function construireClasseurStatistiques(
  tableau: TableauDeBord,
  periode: PeriodeResolue,
  nomBibliotheque: string
): Promise<Buffer> {
  const classeur = new ExcelJS.Workbook()
  classeur.creator = nomBibliotheque
  classeur.created = new Date()

  const resume = classeur.addWorksheet('Resume')
  resume.columns = [
    { header: 'Indicateur', key: 'cle', width: 34 },
    { header: 'Valeur', key: 'valeur', width: 24 }
  ]
  resume.addRows([
    { cle: 'Bibliotheque', valeur: nomBibliotheque },
    { cle: 'Periode', valeur: formaterPeriodeLisible(periode) },
    { cle: 'Nombre de visites', valeur: tableau.indicateurs.nbVisites },
    { cle: "Nombre d'abonnes uniques", valeur: tableau.indicateurs.nbAbonnesUniques },
    { cle: 'Moyenne de visites par jour', valeur: tableau.indicateurs.moyenneVisitesParJour },
    {
      cle: 'Variation des visites vs periode precedente',
      valeur: tableau.indicateurs.variationNbVisitesPct !== null ? `${tableau.indicateurs.variationNbVisitesPct}%` : 'N/A'
    },
    {
      cle: 'Variation des abonnes uniques vs periode precedente',
      valeur: tableau.indicateurs.variationNbAbonnesPct !== null ? `${tableau.indicateurs.variationNbAbonnesPct}%` : 'N/A'
    }
  ])
  resume.getRow(1).font = enTete.font

  const evolution = classeur.addWorksheet('Evolution')
  evolution.columns = [
    { header: 'Periode', key: 'libelle', width: 20 },
    { header: 'Visites', key: 'nbVisites', width: 14 }
  ]
  evolution.addRows(tableau.evolution)
  evolution.getRow(1).font = enTete.font

  const parMotif = classeur.addWorksheet('Par motif')
  parMotif.columns = [
    { header: 'Motif', key: 'libelle', width: 24 },
    { header: 'Nombre', key: 'nombre', width: 14 },
    { header: 'Pourcentage', key: 'pourcentage', width: 14 }
  ]
  parMotif.addRows(tableau.parMotif)
  parMotif.getRow(1).font = enTete.font

  const parTrancheAge = classeur.addWorksheet('Par tranche age')
  parTrancheAge.columns = [
    { header: "Tranche d'age", key: 'libelle', width: 20 },
    { header: 'Nombre', key: 'nombre', width: 14 },
    { header: 'Pourcentage', key: 'pourcentage', width: 14 }
  ]
  parTrancheAge.addRows(tableau.parTrancheAge)
  parTrancheAge.getRow(1).font = enTete.font

  const parSexe = classeur.addWorksheet('Par sexe')
  const LIBELLES_SEXE: Record<string, string> = { H: 'Homme', F: 'Femme', non_renseigne: 'Non renseigne' }
  parSexe.columns = [
    { header: 'Sexe', key: 'libelle', width: 20 },
    { header: 'Nombre', key: 'nombre', width: 14 },
    { header: 'Pourcentage', key: 'pourcentage', width: 14 }
  ]
  parSexe.addRows(tableau.parSexe.map((s) => ({ libelle: LIBELLES_SEXE[s.sexe], nombre: s.nombre, pourcentage: s.pourcentage })))
  parSexe.getRow(1).font = enTete.font

  const parTypeVisiteur = classeur.addWorksheet('Type de visiteur')
  const LIBELLES_TYPE_VISITEUR: Record<string, string> = { abonne: 'Abonne', non_abonne: 'Non-abonne (CIN)' }
  parTypeVisiteur.columns = [
    { header: 'Type', key: 'libelle', width: 20 },
    { header: 'Nombre', key: 'nombre', width: 14 },
    { header: 'Pourcentage', key: 'pourcentage', width: 14 }
  ]
  parTypeVisiteur.addRows(
    tableau.parTypeVisiteur.map((t) => ({ libelle: LIBELLES_TYPE_VISITEUR[t.type], nombre: t.nombre, pourcentage: t.pourcentage }))
  )
  parTypeVisiteur.getRow(1).font = enTete.font

  const motifParAge = classeur.addWorksheet('Motif x tranche age')
  const { colonnes, lignes } = pivoterMotifParTrancheAge(tableau)
  motifParAge.columns = colonnes.map((libelle, i) => ({ header: libelle, key: `c${i}`, width: i === 0 ? 20 : 16 }))
  for (const ligne of lignes) motifParAge.addRow(ligne)
  motifParAge.getRow(1).font = enTete.font

  const heures = classeur.addWorksheet('Heures affluence')
  // jourSemaine cote donnees : 0 = dimanche ... 6 = samedi (JS Date#getDay()).
  // Affiche en convention francaise : lundi -> dimanche (comme la heatmap ecran).
  const JOURS_LUNDI_DIMANCHE = [
    { jourSemaine: 1, libelle: 'Lundi' },
    { jourSemaine: 2, libelle: 'Mardi' },
    { jourSemaine: 3, libelle: 'Mercredi' },
    { jourSemaine: 4, libelle: 'Jeudi' },
    { jourSemaine: 5, libelle: 'Vendredi' },
    { jourSemaine: 6, libelle: 'Samedi' },
    { jourSemaine: 0, libelle: 'Dimanche' }
  ]
  heures.columns = [
    { header: 'Jour', key: 'jour', width: 14 },
    ...Array.from({ length: 24 }, (_, h) => ({ header: `${h}h`, key: `h${h}`, width: 6 }))
  ]
  for (const jour of JOURS_LUNDI_DIMANCHE) {
    const ligne: Record<string, string | number> = { jour: jour.libelle }
    for (let h = 0; h < 24; h++) {
      ligne[`h${h}`] = tableau.heuresAffluence.find((c) => c.jourSemaine === jour.jourSemaine && c.heure === h)?.nombre ?? 0
    }
    heures.addRow(ligne)
  }
  heures.getRow(1).font = enTete.font

  const topAbonnes = classeur.addWorksheet('Top 10 abonnes')
  topAbonnes.columns = [
    { header: 'Rang', key: 'rang', width: 8 },
    { header: 'Numero', key: 'numeroAbonne', width: 16 },
    { header: 'Nom', key: 'nomComplet', width: 30 },
    { header: 'Visites', key: 'nbVisites', width: 12 }
  ]
  tableau.topAbonnes.forEach((a, i) => topAbonnes.addRow({ rang: i + 1, ...a }))
  topAbonnes.getRow(1).font = enTete.font

  const buffer = await classeur.xlsx.writeBuffer()
  return Buffer.from(buffer)
}
