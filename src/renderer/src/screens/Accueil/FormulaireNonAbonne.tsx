import { useEffect, useState, type JSX } from 'react'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'

interface Props {
  cin: string
  chargement: boolean
  erreur: string | null
  onValider: (donnees: { nomComplet: string; dateNaissance: string | null; sexe: 'H' | 'F' | null }) => void
  onAnnuler: () => void
}

export function FormulaireNonAbonne({ cin, chargement, erreur, onValider, onAnnuler }: Props): JSX.Element {
  const [nomComplet, setNomComplet] = useState('')
  const [dateNaissance, setDateNaissance] = useState('')
  const [sexe, setSexe] = useState<'H' | 'F' | null>(null)

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent): void {
      if (e.key === 'Escape') onAnnuler()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onAnnuler])

  function handleSubmit(): void {
    if (!nomComplet.trim() || chargement) return
    onValider({
      nomComplet: nomComplet.trim(),
      dateNaissance: dateNaissance.trim() || null,
      sexe
    })
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold">Visiteur non-abonné</h1>
        <p className="text-muted-foreground">
          Ce visiteur n&apos;est pas abonné à la médiathèque. Sa visite sera enregistrée sous son
          numéro de CIN <span className="font-mono">{cin}</span>, sans créer de carte d&apos;abonné.
        </p>
      </div>

      {erreur && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {erreur}
        </div>
      )}

      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          <span>
            N° CIN <span className="text-destructive">*</span>
          </span>
          <Input value={cin} disabled />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span>
            Nom complet <span className="text-destructive">*</span>
          </span>
          <Input
            autoFocus
            dir="auto"
            value={nomComplet}
            onChange={(e) => setNomComplet(e.target.value)}
            placeholder="محمد التونسي"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span>Date de naissance</span>
          <Input
            type="date"
            value={dateNaissance}
            onChange={(e) => setDateNaissance(e.target.value)}
          />
        </label>

        <div className="flex flex-col gap-1 text-sm">
          <span>Sexe</span>
          <div className="flex gap-2">
            <Button type="button" variant={sexe === 'H' ? 'default' : 'outline'} onClick={() => setSexe('H')}>
              Homme
            </Button>
            <Button type="button" variant={sexe === 'F' ? 'default' : 'outline'} onClick={() => setSexe('F')}>
              Femme
            </Button>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="ghost" size="lg" onClick={onAnnuler}>
          Annuler (Échap)
        </Button>
        <Button size="lg" onClick={handleSubmit} disabled={!nomComplet.trim() || chargement}>
          {chargement ? 'Enregistrement…' : 'Enregistrer et continuer'}
        </Button>
      </div>
    </div>
  )
}
