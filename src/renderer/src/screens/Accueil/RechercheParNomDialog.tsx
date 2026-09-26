import { useEffect, useRef, useState, type JSX } from 'react'
import type { AbonnePourFiche } from '@shared/accueil'
import { Dialog } from '@renderer/components/ui/dialog'
import { Input } from '@renderer/components/ui/input'

interface Props {
  onFermer: () => void
  onSelectionner: (abonne: AbonnePourFiche) => void
}

export function RechercheParNomDialog({ onFermer, onSelectionner }: Props): JSX.Element {
  const [requete, setRequete] = useState('')
  const [resultats, setResultats] = useState<AbonnePourFiche[]>([])
  const [recherche, setRecherche] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const q = requete.trim()
    if (q.length < 2) {
      setResultats([])
      return
    }
    setRecherche(true)
    const identifiant = setTimeout(() => {
      window.api.accueil
        .rechercherParNom(q)
        .then(setResultats)
        .finally(() => setRecherche(false))
    }, 200)
    return () => clearTimeout(identifiant)
  }, [requete])

  return (
    <Dialog ouvert onFermer={onFermer} titre="Rechercher un abonné par nom" className="max-w-2xl">
      <div className="flex flex-col gap-3">
        <Input
          ref={inputRef}
          dir="auto"
          value={requete}
          onChange={(e) => setRequete(e.target.value)}
          placeholder="Nom de l'abonné…"
        />

        <div className="max-h-96 overflow-auto rounded-lg border border-border">
          {resultats.map((abonne) => (
            <button
              key={abonne.id}
              type="button"
              onClick={() => onSelectionner(abonne)}
              className="flex w-full items-center justify-between border-b border-border px-4 py-3 text-left last:border-0 hover:bg-accent"
            >
              <span dir="auto" className="text-lg">
                {abonne.nomComplet}
              </span>
              <span className="font-mono text-sm text-muted-foreground">{abonne.numeroAbonne}</span>
            </button>
          ))}
          {!recherche && requete.trim().length >= 2 && resultats.length === 0 && (
            <p className="p-4 text-center text-sm text-muted-foreground">Aucun abonné trouvé.</p>
          )}
          {requete.trim().length < 2 && (
            <p className="p-4 text-center text-sm text-muted-foreground">
              Tapez au moins 2 caractères pour rechercher.
            </p>
          )}
        </div>
      </div>
    </Dialog>
  )
}
