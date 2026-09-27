import { useEffect, useState, type JSX } from 'react'
import type { FiltrePeriode, TableauDeBord } from '@shared/stats'
import type { ParametresGeneraux } from '@shared/parametres'
import { CarteIndicateur } from '@renderer/screens/Dashboard/CarteIndicateur'
import { GraphiqueEvolution } from '@renderer/screens/Dashboard/GraphiqueEvolution'
import { GraphiqueParMotif } from '@renderer/screens/Dashboard/GraphiqueParMotif'
import { GraphiqueParTrancheAge } from '@renderer/screens/Dashboard/GraphiqueParTrancheAge'
import { GraphiqueParSexe } from '@renderer/screens/Dashboard/GraphiqueParSexe'
import { GraphiqueParTypeVisiteur } from '@renderer/screens/Dashboard/GraphiqueParTypeVisiteur'
import { GraphiqueMotifParTrancheAge } from '@renderer/screens/Dashboard/GraphiqueMotifParTrancheAge'
import { CarteChaleurAffluence } from '@renderer/screens/Dashboard/CarteChaleurAffluence'
import { TableTopAbonnes } from '@renderer/screens/Dashboard/TableTopAbonnes'

function lireFiltreDepuisUrl(): FiltrePeriode {
  const hash = window.location.hash // ex: "#/rapport?type=mois&dateDebut=...&dateFin=..."
  const indexQuestion = hash.indexOf('?')
  const params = new URLSearchParams(indexQuestion >= 0 ? hash.slice(indexQuestion + 1) : '')
  const type = (params.get('type') ?? 'mois') as FiltrePeriode['type']
  return {
    type,
    dateDebut: params.get('dateDebut') ?? undefined,
    dateFin: params.get('dateFin') ?? undefined
  }
}

const LIBELLES_PERIODE: Record<FiltrePeriode['type'], string> = {
  aujourdhui: "Aujourd'hui",
  semaine: 'Cette semaine',
  mois: 'Ce mois',
  annee: 'Cette annee',
  personnalisee: 'Periode personnalisee'
}

/**
 * Page de rapport dediee (voir 4.6), chargee dans une fenetre Electron invisible
 * et imprimee en PDF via `webContents.printToPDF`. Reutilise les composants de
 * graphique du tableau de bord : la mise en page reste coherente entre l'ecran
 * et le PDF, et les noms arabes s'affichent avec la meme police locale.
 */
export function RapportPage(): JSX.Element {
  const [filtre] = useState<FiltrePeriode>(lireFiltreDepuisUrl)
  const [tableau, setTableau] = useState<TableauDeBord | null>(null)
  const [parametres, setParametres] = useState<ParametresGeneraux | null>(null)

  useEffect(() => {
    Promise.all([window.api.stats.obtenirTableauDeBord(filtre), window.api.parametres.obtenirGeneraux()]).then(
      ([t, p]) => {
        setTableau(t)
        setParametres(p)
      }
    )
  }, [filtre])

  useEffect(() => {
    if (!tableau || !parametres) return
    // Laisse Recharts terminer une passe de mesure/rendu (ResizeObserver) avant d'imprimer.
    const identifiant = requestAnimationFrame(() => {
      setTimeout(() => window.api.rapport.signalerPret(), 200)
    })
    return () => cancelAnimationFrame(identifiant)
  }, [tableau, parametres])

  if (!tableau || !parametres) {
    return <div className="p-8 text-muted-foreground">Generation du rapport…</div>
  }

  const finInclusive = new Date(new Date(tableau.periode.fin).getTime() - 86_400_000)
  const periodeLisible = `${new Date(tableau.periode.debut).toLocaleDateString('fr-FR')} au ${finInclusive.toLocaleDateString('fr-FR')}`

  return (
    <div className="flex flex-col gap-6 bg-white p-8 text-foreground">
      <header className="border-b border-border pb-4">
        <h1 className="text-2xl font-bold">{parametres.nomBibliotheque}</h1>
        <p className="text-lg text-muted-foreground">
          Rapport de frequentation — {LIBELLES_PERIODE[filtre.type]} ({periodeLisible})
        </p>
      </header>

      <div className="grid grid-cols-3 gap-4">
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
        <CarteIndicateur libelle="Moyenne de visites / jour" valeur={tableau.indicateurs.moyenneVisitesParJour.toString()} />
      </div>

      <GraphiqueEvolution donnees={tableau.evolution} />

      <div className="grid grid-cols-2 gap-6">
        <GraphiqueParMotif donnees={tableau.parMotif} />
        <GraphiqueParTrancheAge donnees={tableau.parTrancheAge} />
        <GraphiqueParSexe donnees={tableau.parSexe} />
        <GraphiqueParTypeVisiteur donnees={tableau.parTypeVisiteur} />
        <GraphiqueMotifParTrancheAge donnees={tableau.motifParTrancheAge} />
      </div>

      <CarteChaleurAffluence donnees={tableau.heuresAffluence} />

      <TableTopAbonnes donnees={tableau.topAbonnes} />
    </div>
  )
}
