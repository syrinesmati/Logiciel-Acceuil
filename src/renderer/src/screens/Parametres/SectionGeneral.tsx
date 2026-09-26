import { useEffect, useState, type JSX } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import type { ParametresGeneraux, TrancheAge } from '@shared/parametres'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@renderer/components/ui/card'

function trancheVide(): TrancheAge {
  return { id: `tranche-${Date.now()}`, libelle: '', min: 0, max: null }
}

export function SectionGeneral(): JSX.Element {
  const [valeurs, setValeurs] = useState<ParametresGeneraux | null>(null)
  const [enregistrement, setEnregistrement] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    window.api.parametres.obtenirGeneraux().then(setValeurs)
  }, [])

  async function handleEnregistrer(): Promise<void> {
    if (!valeurs) return
    setEnregistrement(true)
    setMessage(null)
    try {
      await window.api.parametres.enregistrerGeneraux(valeurs)
      setMessage('Parametres enregistres.')
    } finally {
      setEnregistrement(false)
    }
  }

  if (!valeurs) return <p className="p-6 text-muted-foreground">Chargement…</p>

  function modifierTranche(index: number, patch: Partial<TrancheAge>): void {
    setValeurs((prec) => {
      if (!prec) return prec
      const tranchesAge = prec.tranchesAge.map((t, i) => (i === index ? { ...t, ...patch } : t))
      return { ...prec, tranchesAge }
    })
  }

  function supprimerTranche(index: number): void {
    setValeurs((prec) => (prec ? { ...prec, tranchesAge: prec.tranchesAge.filter((_, i) => i !== index) } : prec))
  }

  function ajouterTranche(): void {
    setValeurs((prec) => (prec ? { ...prec, tranchesAge: [...prec.tranchesAge, trancheVide()] } : prec))
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Bibliotheque et delais</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            <span>Nom de la bibliotheque</span>
            <Input
              value={valeurs.nomBibliotheque}
              onChange={(e) => setValeurs({ ...valeurs, nomBibliotheque: e.target.value })}
            />
          </label>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              <span>Delai anti-double-scan (secondes)</span>
              <Input
                type="number"
                min={1}
                value={valeurs.delaiAntiDoubleScanSecondes}
                onChange={(e) =>
                  setValeurs({ ...valeurs, delaiAntiDoubleScanSecondes: Number(e.target.value) || 0 })
                }
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span>Delai de retour automatique (secondes)</span>
              <Input
                type="number"
                min={5}
                value={valeurs.delaiRetourAutoSecondes}
                onChange={(e) => setValeurs({ ...valeurs, delaiRetourAutoSecondes: Number(e.target.value) || 0 })}
              />
            </label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tranches d&apos;age</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {valeurs.tranchesAge.map((tranche, index) => (
            <div key={tranche.id} className="flex items-center gap-2">
              <Input
                className="w-40"
                placeholder="Libelle"
                value={tranche.libelle}
                onChange={(e) => modifierTranche(index, { libelle: e.target.value })}
              />
              <Input
                type="number"
                className="w-24"
                placeholder="Min"
                value={tranche.min}
                onChange={(e) => modifierTranche(index, { min: Number(e.target.value) || 0 })}
              />
              <span className="text-muted-foreground">a</span>
              <Input
                type="number"
                className="w-24"
                placeholder="Illimite"
                value={tranche.max ?? ''}
                onChange={(e) =>
                  modifierTranche(index, { max: e.target.value === '' ? null : Number(e.target.value) })
                }
              />
              <Button variant="ghost" size="icon" onClick={() => supprimerTranche(index)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button variant="outline" className="w-fit" onClick={ajouterTranche}>
            <Plus className="h-4 w-4" />
            Ajouter une tranche
          </Button>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button size="lg" onClick={() => void handleEnregistrer()} disabled={enregistrement}>
          {enregistrement ? 'Enregistrement…' : 'Enregistrer'}
        </Button>
        {message && <span className="text-sm text-muted-foreground">{message}</span>}
      </div>
    </div>
  )
}
