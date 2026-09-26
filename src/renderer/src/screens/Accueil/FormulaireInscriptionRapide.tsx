import { useEffect, useState, type JSX } from 'react'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'

interface Props {
  numeroAbonne: string
  chargement: boolean
  erreur: string | null
  onValider: (donnees: {
    nomComplet: string
    dateNaissance: string | null
    sexe: 'H' | 'F' | null
    telephone: string | null
  }) => void
  onAnnuler: () => void
}

export function FormulaireInscriptionRapide({
  numeroAbonne,
  chargement,
  erreur,
  onValider,
  onAnnuler
}: Props): JSX.Element {
  const [nomComplet, setNomComplet] = useState('')
  const [dateNaissance, setDateNaissance] = useState('')
  const [sexe, setSexe] = useState<'H' | 'F' | null>(null)
  const [telephone, setTelephone] = useState('')

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
      sexe,
      telephone: telephone.trim() || null
    })
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold">Abonné introuvable</h1>
        <p className="text-muted-foreground">
          Le numéro <span className="font-mono">{numeroAbonne}</span> n&apos;a pas ete trouve. Il a
          peut-etre ete inscrit dans Syracuse apres le dernier import. L&apos;inscrire ici ?
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
            Numéro d&apos;abonné <span className="text-destructive">*</span>
          </span>
          <Input value={numeroAbonne} disabled />
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

        <label className="flex flex-col gap-1 text-sm">
          <span>Téléphone</span>
          <Input value={telephone} onChange={(e) => setTelephone(e.target.value)} />
        </label>
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
