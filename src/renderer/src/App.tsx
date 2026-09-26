import { useState } from 'react'
import type { JSX } from 'react'
import { Button } from '@renderer/components/ui/button'
import { AccueilScreen } from '@renderer/screens/Accueil/AccueilScreen'
import { ImportScreen } from '@renderer/screens/Import/ImportScreen'
import { LignesACorrigerScreen } from '@renderer/screens/Import/LignesACorrigerScreen'

type Ecran = 'accueil' | 'import' | 'lignesACorriger'

function App(): JSX.Element {
  const [ecran, setEcran] = useState<Ecran>('accueil')

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Barre provisoire : sera remplacee par un acces Parametres protege par code PIN (phase 4). */}
      <nav className="flex items-center gap-2 border-b border-border p-3">
        <Button variant={ecran === 'accueil' ? 'default' : 'ghost'} size="sm" onClick={() => setEcran('accueil')}>
          Accueil
        </Button>
        <Button variant={ecran === 'import' ? 'default' : 'ghost'} size="sm" onClick={() => setEcran('import')}>
          Import Syracuse
        </Button>
        <Button
          variant={ecran === 'lignesACorriger' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setEcran('lignesACorriger')}
        >
          Lignes à corriger
        </Button>
      </nav>

      <div className="flex-1">
        {ecran === 'accueil' && <AccueilScreen />}
        {ecran === 'import' && <ImportScreen onVoirLignesACorriger={() => setEcran('lignesACorriger')} />}
        {ecran === 'lignesACorriger' && <LignesACorrigerScreen onRetour={() => setEcran('import')} />}
      </div>
    </div>
  )
}

export default App
