import { useEffect, useState, type JSX } from 'react'
import { FileSpreadsheet, FileText } from 'lucide-react'
import type { FiltrePeriode, TableauDeBord } from '@shared/stats'
import { Button } from '@renderer/components/ui/button'
import { ParametresGate } from '@renderer/screens/Parametres/ParametresGate'
import { FiltrePeriodeControle } from './FiltrePeriodeControle'
import { CarteIndicateur } from './CarteIndicateur'
import { GraphiqueEvolution } from './GraphiqueEvolution'
import { GraphiqueParMotif } from './GraphiqueParMotif'
import { GraphiqueParTrancheAge } from './GraphiqueParTrancheAge'
import { GraphiqueParSexe } from './GraphiqueParSexe'
import { GraphiqueParTypeVisiteur } from './GraphiqueParTypeVisiteur'
import { GraphiqueMotifParTrancheAge } from './GraphiqueMotifParTrancheAge'
import { CarteChaleurAffluence } from './CarteChaleurAffluence'
import { TableTopAbonnes } from './TableTopAbonnes'

export function DashboardScreen(): JSX.Element {
  return (
    <ParametresGate>
      <DashboardContenu />
    </ParametresGate>
  )
}

function DashboardContenu(): JSX.Element {
  const [filtre, setFiltre] = useState<FiltrePeriode>({ type: 'mois' })
  const [tableau, setTableau] = useState<TableauDeBord | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)
  const [exportEnCours, setExportEnCours] = useState<'excel' | 'pdf' | null>(null)
  const [messageExport, setMessageExport] = useState<string | null>(null)

  useEffect(() => {
    if (filtre.type === 'personnalisee' && (!filtre.dateDebut || !filtre.dateFin)) return
    setErreur(null)
    window.api.stats
      .obtenirTableauDeBord(filtre)
      .then(setTableau)
      .catch(() => setErreur('Impossible de calculer les statistiques pour cette periode.'))
  }, [filtre])

  async function handleExporter(format: 'excel' | 'pdf'): Promise<void> {
    setExportEnCours(format)
    setMessageExport(null)
    try {
      const chemin =
        format === 'excel' ? await window.api.stats.exporterExcel(filtre) : await window.api.stats.exporterPdf(filtre)
      setMessageExport(chemin ? `Fichier enregistre : ${chemin}` : null)
    } catch {
      setMessageExport("Echec de l'export. Reessayez.")
    } finally {
      setExportEnCours(null)
    }
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-8">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Tableau de bord</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={!tableau || !!exportEnCours} onClick={() => void handleExporter('excel')}>
              <FileSpreadsheet className="h-4 w-4" />
              {exportEnCours === 'excel' ? 'Export…' : 'Exporter en Excel'}
            </Button>
            <Button variant="outline" size="sm" disabled={!tableau || !!exportEnCours} onClick={() => void handleExporter('pdf')}>
              <FileText className="h-4 w-4" />
              {exportEnCours === 'pdf' ? 'Export…' : 'Exporter en PDF'}
            </Button>
          </div>
        </div>
        <FiltrePeriodeControle filtre={filtre} onChanger={setFiltre} />
        {messageExport && <p className="text-sm text-muted-foreground">{messageExport}</p>}
      </div>

      {erreur && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {erreur}
        </div>
      )}

      {!tableau && !erreur && <p className="text-muted-foreground">Chargement…</p>}

      {tableau && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <CarteIndicateur
              libelle="Visites"
              valeur={String(tableau.indicateurs.nbVisites)}
              variationPct={tableau.indicateurs.variationNbVisitesPct}
            />
            <CarteIndicateur
              libelle="Abonnes uniques"
              valeur={String(tableau.indicateurs.nbAbonnesUniques)}
              variationPct={tableau.indicateurs.variationNbAbonnesPct}
            />
            <CarteIndicateur
              libelle="Moyenne de visites / jour"
              valeur={tableau.indicateurs.moyenneVisitesParJour.toString()}
            />
          </div>

          <GraphiqueEvolution donnees={tableau.evolution} />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <GraphiqueParMotif donnees={tableau.parMotif} />
            <GraphiqueParTrancheAge donnees={tableau.parTrancheAge} />
            <GraphiqueParSexe donnees={tableau.parSexe} />
            <GraphiqueParTypeVisiteur donnees={tableau.parTypeVisiteur} />
            <GraphiqueMotifParTrancheAge donnees={tableau.motifParTrancheAge} />
          </div>

          <CarteChaleurAffluence donnees={tableau.heuresAffluence} />

          <TableTopAbonnes donnees={tableau.topAbonnes} />
        </>
      )}
    </div>
  )
}
