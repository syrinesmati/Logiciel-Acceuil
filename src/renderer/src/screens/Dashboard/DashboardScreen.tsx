import { useEffect, useState, type JSX } from 'react'
import type { FiltrePeriode, TableauDeBord } from '@shared/stats'
import { ParametresGate } from '@renderer/screens/Parametres/ParametresGate'
import { FiltrePeriodeControle } from './FiltrePeriodeControle'
import { CarteIndicateur } from './CarteIndicateur'
import { GraphiqueEvolution } from './GraphiqueEvolution'
import { GraphiqueParMotif } from './GraphiqueParMotif'
import { GraphiqueParTrancheAge } from './GraphiqueParTrancheAge'
import { GraphiqueParSexe } from './GraphiqueParSexe'
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

  useEffect(() => {
    if (filtre.type === 'personnalisee' && (!filtre.dateDebut || !filtre.dateFin)) return
    setErreur(null)
    window.api.stats
      .obtenirTableauDeBord(filtre)
      .then(setTableau)
      .catch(() => setErreur('Impossible de calculer les statistiques pour cette periode.'))
  }, [filtre])

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-8">
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold">Tableau de bord</h1>
        <FiltrePeriodeControle filtre={filtre} onChanger={setFiltre} />
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
            <GraphiqueMotifParTrancheAge donnees={tableau.motifParTrancheAge} />
          </div>

          <CarteChaleurAffluence donnees={tableau.heuresAffluence} />

          <TableTopAbonnes donnees={tableau.topAbonnes} />
        </>
      )}
    </div>
  )
}
