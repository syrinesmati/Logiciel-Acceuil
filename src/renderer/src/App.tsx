import { useState } from 'react'
import type { JSX } from 'react'
import { Settings } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { AccueilScreen } from '@renderer/screens/Accueil/AccueilScreen'
import { ParametresScreen } from '@renderer/screens/Parametres/ParametresScreen'

type Ecran = 'accueil' | 'parametres'

function App(): JSX.Element {
  const [ecran, setEcran] = useState<Ecran>('accueil')

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <nav className="flex items-center justify-between border-b border-border p-3">
        <Button variant={ecran === 'accueil' ? 'default' : 'ghost'} size="sm" onClick={() => setEcran('accueil')}>
          Accueil
        </Button>
        <Button
          variant={ecran === 'parametres' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setEcran('parametres')}
        >
          <Settings className="h-4 w-4" />
          Parametres
        </Button>
      </nav>

      <div className="flex-1">
        {ecran === 'accueil' && <AccueilScreen />}
        {/* Demontee quand on quitte l'onglet : le PIN est redemande a chaque nouvel acces. */}
        {ecran === 'parametres' && <ParametresScreen />}
      </div>
    </div>
  )
}

export default App
