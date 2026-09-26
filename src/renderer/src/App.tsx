import { useEffect, useState } from 'react'
import type { JSX } from 'react'
import type { CompteursDemarrage } from '@shared/ipc'

function App(): JSX.Element {
  const [compteurs, setCompteurs] = useState<CompteursDemarrage | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)

  useEffect(() => {
    window.api.systeme
      .compteursDemarrage()
      .then(setCompteurs)
      .catch(() => setErreur('Impossible de lire la base de donnees.'))
  }, [])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-8 text-foreground">
      <h1 className="text-3xl font-semibold">Accueil Mediatheque — Phase 1</h1>

      <div className="grid w-full max-w-xl grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-6 text-center shadow-sm">
          <p className="text-sm text-muted-foreground">Abonnes en base</p>
          <p className="text-4xl font-bold">{compteurs ? compteurs.nbAbonnes : '…'}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-6 text-center shadow-sm">
          <p className="text-sm text-muted-foreground">Visites en base</p>
          <p className="text-4xl font-bold">{compteurs ? compteurs.nbVisites : '…'}</p>
        </div>
      </div>

      {erreur && <p className="text-destructive">{erreur}</p>}

      <p className="max-w-xl text-center text-lg" dir="auto">
        Verification de la police arabe locale : محمد التونسي — فاطمة الزغلامي
      </p>

      <p className="text-sm text-muted-foreground">
        Lancez <code className="rounded bg-muted px-1.5 py-0.5">npm run seed</code> puis rechargez pour
        peupler la base de demonstration.
      </p>
    </div>
  )
}

export default App
