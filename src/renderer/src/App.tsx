import { useState } from 'react'
import type { JSX } from 'react'
import { BarChart3, BookOpen, Home, Settings } from 'lucide-react'
import { cn } from '@renderer/lib/utils'
import { AccueilScreen } from '@renderer/screens/Accueil/AccueilScreen'
import { ParametresScreen } from '@renderer/screens/Parametres/ParametresScreen'
import { DashboardScreen } from '@renderer/screens/Dashboard/DashboardScreen'

type Ecran = 'accueil' | 'tableauDeBord' | 'parametres'

const ONGLETS: { cle: Ecran; libelle: string; Icone: typeof Home }[] = [
  { cle: 'accueil', libelle: 'Accueil', Icone: Home },
  { cle: 'tableauDeBord', libelle: 'Tableau de bord', Icone: BarChart3 },
  { cle: 'parametres', libelle: 'Parametres', Icone: Settings }
]

function App(): JSX.Element {
  const [ecran, setEcran] = useState<Ecran>('accueil')

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <nav className="sticky top-0 z-40 border-b border-border/70 bg-card/90 backdrop-blur-sm">
        <div className="flex items-center justify-between px-6 py-2.5">
          <div className="flex items-center gap-2.5">
            <div className="from-primary to-primary-2 shadow-glow-sm flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br">
              <BookOpen className="h-5 w-5 text-white" strokeWidth={2} />
            </div>
            <span className="text-sm font-semibold tracking-tight">Médiathèque de l&apos;Ariana</span>
          </div>

          <div className="bg-muted/70 flex items-center gap-1 rounded-full border border-border p-1">
            {ONGLETS.map(({ cle, libelle, Icone }) => (
              <button
                key={cle}
                type="button"
                onClick={() => setEcran(cle)}
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200',
                  ecran === cle
                    ? 'shadow-glow-sm bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icone className="h-4 w-4" />
                {libelle}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <div className="flex-1">
        {ecran === 'accueil' && <AccueilScreen />}
        {/* Demontees quand on quitte l'onglet : le PIN est redemande a chaque nouvel acces. */}
        {ecran === 'tableauDeBord' && <DashboardScreen />}
        {ecran === 'parametres' && <ParametresScreen />}
      </div>
    </div>
  )
}

export default App
