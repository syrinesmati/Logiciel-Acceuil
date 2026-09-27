import { useEffect, useState, type JSX } from 'react'
import { Check } from 'lucide-react'
import type { AbonnePourFiche, Motif } from '@shared/accueil'
import { Button } from '@renderer/components/ui/button'
import { obtenirIcone } from '@renderer/lib/icones'
import { cn } from '@renderer/lib/utils'

interface Props {
  abonne: AbonnePourFiche
  motifs: Motif[]
  chargement: boolean
  onCompleterSexe: (sexe: 'H' | 'F') => void
  onValider: (motifIds: number[]) => void
  onAnnuler: () => void
}

export function FicheAbonne({ abonne, motifs, chargement, onCompleterSexe, onValider, onAnnuler }: Props): JSX.Element {
  const [motifsSelectionnes, setMotifsSelectionnes] = useState<Set<number>>(new Set())

  useEffect(() => {
    setMotifsSelectionnes(new Set())
  }, [abonne.id])

  function basculerMotif(id: number): void {
    setMotifsSelectionnes((prec) => {
      const suivant = new Set(prec)
      if (suivant.has(id)) suivant.delete(id)
      else suivant.add(id)
      return suivant
    })
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent): void {
      if (e.key === 'Escape') {
        onAnnuler()
        return
      }
      if (e.key === 'Enter') {
        if (motifsSelectionnes.size > 0 && !chargement) onValider([...motifsSelectionnes])
        return
      }
      const position = Number(e.key)
      if (Number.isInteger(position) && position >= 1 && position <= 9) {
        const motif = motifs[position - 1]
        if (motif) basculerMotif(motif.id)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [motifs, motifsSelectionnes, chargement, onAnnuler, onValider])

  return (
    <div className="animate-in fade-in zoom-in-95 mx-auto flex max-w-3xl flex-col gap-8 p-8 duration-300">
      <div className="rounded-xl border border-border bg-card p-8 text-center shadow-sm">
        <p className="text-sm text-muted-foreground">
          {abonne.source === 'non_abonne' ? `Visiteur non-abonné · CIN ${abonne.numeroAbonne}` : `Abonné n° ${abonne.numeroAbonne}`}
        </p>
        <p dir="auto" className="mt-1 text-4xl font-bold">
          {abonne.nomComplet}
        </p>
        <p className="mt-2 text-lg text-muted-foreground">
          {abonne.age !== null ? `${abonne.age} ans` : 'Âge inconnu'}
        </p>

        {!abonne.sexe && (
          <div className="mt-4 flex items-center justify-center gap-3">
            <span className="text-sm text-muted-foreground">Sexe non renseigné :</span>
            <Button size="sm" variant="outline" onClick={() => onCompleterSexe('H')}>
              Homme
            </Button>
            <Button size="sm" variant="outline" onClick={() => onCompleterSexe('F')}>
              Femme
            </Button>
          </div>
        )}
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Motif de la visite</h2>
          {motifsSelectionnes.size > 0 && (
            <span className="animate-in fade-in text-sm font-medium text-primary">
              {motifsSelectionnes.size} sélectionné{motifsSelectionnes.size > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {motifs.map((motif, index) => {
            const Icone = obtenirIcone(motif.icone)
            const selectionne = motifsSelectionnes.has(motif.id)
            return (
              <button
                key={motif.id}
                type="button"
                onClick={() => basculerMotif(motif.id)}
                className={cn(
                  'relative flex flex-col items-center gap-2 rounded-xl border-2 p-6 text-lg font-medium shadow-sm transition-all',
                  selectionne
                    ? 'scale-[1.03] border-transparent text-white shadow-md'
                    : 'border-border bg-card hover:bg-accent'
                )}
                style={selectionne ? { backgroundColor: motif.couleur } : undefined}
              >
                {selectionne && (
                  <span className="animate-in zoom-in-50 absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow">
                    <Check className="h-4 w-4" style={{ color: motif.couleur }} strokeWidth={3} />
                  </span>
                )}
                <Icone className="h-8 w-8" style={selectionne ? undefined : { color: motif.couleur }} />
                {motif.libelle}
                <span className="text-xs opacity-70">({index + 1})</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="ghost" size="lg" onClick={onAnnuler}>
          Annuler (Échap)
        </Button>
        <Button
          size="lg"
          disabled={motifsSelectionnes.size === 0 || chargement}
          onClick={() => onValider([...motifsSelectionnes])}
        >
          {chargement ? 'Enregistrement…' : 'Valider (Entrée)'}
        </Button>
      </div>
    </div>
  )
}
