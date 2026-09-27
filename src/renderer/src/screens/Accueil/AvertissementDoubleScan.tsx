import { useEffect, type JSX } from 'react'
import { AlertTriangle } from 'lucide-react'
import type { AbonnePourFiche } from '@shared/accueil'
import { Button } from '@renderer/components/ui/button'

interface Props {
  abonne: AbonnePourFiche
  derniereVisite: string | null
  onAnnuler: () => void
  onContinuer: () => void
}

function formaterDelai(derniereVisite: string): string {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(derniereVisite).getTime()) / 60000))
  if (minutes < 1) return "moins d'une minute"
  if (minutes === 1) return '1 minute'
  return `${minutes} minutes`
}

export function AvertissementDoubleScan({ abonne, derniereVisite, onAnnuler, onContinuer }: Props): JSX.Element {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent): void {
      if (e.key === 'Escape') onAnnuler()
      if (e.key === 'Enter') onContinuer()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onAnnuler, onContinuer])

  return (
    <div className="animate-in fade-in zoom-in-95 mx-auto flex max-w-lg flex-col items-center gap-6 p-8 text-center duration-300">
      <AlertTriangle className="h-16 w-16 text-amber-500" />
      <div>
        <h1 className="text-2xl font-semibold">Déjà scanné récemment</h1>
        <p dir="auto" className="mt-2 text-xl">
          {abonne.nomComplet}
        </p>
        <p className="mt-1 text-muted-foreground">
          {derniereVisite
            ? `Ce numéro a déjà été scanné il y a ${formaterDelai(derniereVisite)}.`
            : 'Ce numéro a déjà été scanné récemment.'}
        </p>
      </div>
      <div className="flex gap-3">
        <Button variant="outline" size="lg" onClick={onAnnuler}>
          Annuler (Échap)
        </Button>
        <Button size="lg" onClick={onContinuer}>
          Continuer quand même (Entrée)
        </Button>
      </div>
    </div>
  )
}
