import { useState, type JSX } from 'react'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@renderer/components/ui/card'

export function SectionSecurite(): JSX.Element {
  const [ancienPin, setAncienPin] = useState('')
  const [nouveauPin, setNouveauPin] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [erreur, setErreur] = useState<string | null>(null)
  const [succes, setSucces] = useState(false)
  const [envoiEnCours, setEnvoiEnCours] = useState(false)

  async function handleChanger(): Promise<void> {
    setErreur(null)
    setSucces(false)
    if (nouveauPin.length < 4) {
      setErreur('Le nouveau code PIN doit comporter au moins 4 chiffres.')
      return
    }
    if (nouveauPin !== confirmation) {
      setErreur('Les deux nouveaux codes PIN ne correspondent pas.')
      return
    }
    setEnvoiEnCours(true)
    try {
      const resultat = await window.api.parametres.changerPin({ ancienPin, nouveauPin })
      if (resultat.succes) {
        setSucces(true)
        setAncienPin('')
        setNouveauPin('')
        setConfirmation('')
      } else {
        setErreur(resultat.erreur)
      }
    } finally {
      setEnvoiEnCours(false)
    }
  }

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>Changer le code PIN</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span>Code PIN actuel</span>
          <Input
            type="password"
            inputMode="numeric"
            value={ancienPin}
            onChange={(e) => setAncienPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span>Nouveau code PIN</span>
          <Input
            type="password"
            inputMode="numeric"
            value={nouveauPin}
            onChange={(e) => setNouveauPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span>Confirmer le nouveau code PIN</span>
          <Input
            type="password"
            inputMode="numeric"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value.replace(/\D/g, '').slice(0, 6))}
          />
        </label>

        {erreur && <p className="text-sm text-destructive">{erreur}</p>}
        {succes && <p className="text-sm text-emerald-600">Code PIN modifie avec succes.</p>}

        <Button
          className="w-fit"
          onClick={() => void handleChanger()}
          disabled={envoiEnCours || !ancienPin || nouveauPin.length < 4}
        >
          {envoiEnCours ? 'Enregistrement…' : 'Changer le code PIN'}
        </Button>
      </CardContent>
    </Card>
  )
}
