import { useEffect, useState } from 'react'
import type { JSX } from 'react'
import type { CompteursDemarrage } from '@shared/ipc'
import { Button } from '@renderer/components/ui/button'
import { ImportScreen } from '@renderer/screens/Import/ImportScreen'
import { LignesACorrigerScreen } from '@renderer/screens/Import/LignesACorrigerScreen'

type Ecran = 'accueil' | 'import' | 'lignesACorriger'

function App(): JSX.Element {
  const [ecran, setEcran] = useState<Ecran>('accueil')

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <nav className="flex items-center gap-2 border-b border-border p-3">
        <Button variant={ecran === 'accueil' ? 'default' : 'ghost'} size="sm" onClick={() => setEcran('accueil')}>
          Accueil (test phase 1)
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
        {ecran === 'accueil' && <EcranTestPhase1 />}
        {ecran === 'import' && <ImportScreen onVoirLignesACorriger={() => setEcran('lignesACorriger')} />}
        {ecran === 'lignesACorriger' && <LignesACorrigerScreen onRetour={() => setEcran('import')} />}
      </div>
    </div>
  )
}

function EcranTestPhase1(): JSX.Element {
  const [compteurs, setCompteurs] = useState<CompteursDemarrage | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)

  useEffect(() => {
    window.api.systeme
      .compteursDemarrage()
      .then(setCompteurs)
      .catch(() => setErreur('Impossible de lire la base de donnees.'))
  }, [])

  return (
    <div className="flex flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-3xl font-semibold">Accueil Médiathèque — Phase 1</h1>

      <div className="grid w-full max-w-xl grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-6 text-center shadow-sm">
          <p className="text-sm text-muted-foreground">Abonnés en base</p>
          <p className="text-4xl font-bold">{compteurs ? compteurs.nbAbonnes : '…'}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-6 text-center shadow-sm">
          <p className="text-sm text-muted-foreground">Visites en base</p>
          <p className="text-4xl font-bold">{compteurs ? compteurs.nbVisites : '…'}</p>
        </div>
      </div>

      {erreur && <p className="text-destructive">{erreur}</p>}

      <p className="max-w-xl text-center text-lg" dir="auto">
        Vérification de la police arabe locale : محمد التونسي — فاطمة الزغلامي
      </p>
    </div>
  )
}

export default App
