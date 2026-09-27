import { useState } from 'react'
import type { JSX } from 'react'
import { BarChart3, Settings } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { AccueilScreen } from '@renderer/screens/Accueil/AccueilScreen'
import { ParametresScreen } from '@renderer/screens/Parametres/ParametresScreen'
import { DashboardScreen } from '@renderer/screens/Dashboard/DashboardScreen'

type Ecran = 'accueil' | 'tableauDeBord' | 'parametres'

function App(): JSX.Element {
  const [ecran, setEcran] = useState<Ecran>('accueil')

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <nav className="flex items-center justify-between border-b border-border p-3">
        <Button variant={ecran === 'accueil' ? 'default' : 'ghost'} size="sm" onClick={() => setEcran('accueil')}>
          Accueil
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant={ecran === 'tableauDeBord' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setEcran('tableauDeBord')}
          >
            <BarChart3 className="h-4 w-4" />
            Tableau de bord
          </Button>
          <Button
            variant={ecran === 'parametres' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setEcran('parametres')}
          >
            <Settings className="h-4 w-4" />
            Parametres
          </Button>
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
