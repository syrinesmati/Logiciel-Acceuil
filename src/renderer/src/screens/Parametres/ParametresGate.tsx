import { useEffect, useState, type ReactNode, type JSX } from 'react'
import { Lock } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@renderer/components/ui/card'

interface Props {
  children: ReactNode
}

/**
 * Protege l'acces a l'ecran Parametres par un code PIN (voir 4.4). Le PIN est
 * defini au premier acces s'il n'existe pas encore, puis redemande a chaque
 * fois (pas de session persistante) : c'est un poste partage a l'accueil.
 */
export function ParametresGate({ children }: Props): JSX.Element {
  const [etat, setEtat] = useState<'chargement' | 'definir' | 'saisie' | 'deverrouille'>('chargement')
  const [pin, setPin] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [erreur, setErreur] = useState<string | null>(null)
  const [envoiEnCours, setEnvoiEnCours] = useState(false)

  useEffect(() => {
    window.api.parametres.pinEstDefini().then((defini) => setEtat(defini ? 'saisie' : 'definir'))
  }, [])

  async function handleDefinir(): Promise<void> {
    if (pin.length < 4) {
      setErreur('Le code PIN doit comporter au moins 4 chiffres.')
      return
    }
    if (pin !== confirmation) {
      setErreur('Les deux codes PIN ne correspondent pas.')
      return
    }
    setEnvoiEnCours(true)
    setErreur(null)
    try {
      await window.api.parametres.definirPin(pin)
      setEtat('deverrouille')
    } catch {
      setErreur('Code PIN invalide (4 a 6 chiffres attendus).')
    } finally {
      setEnvoiEnCours(false)
    }
  }

  async function handleSaisie(): Promise<void> {
    setEnvoiEnCours(true)
    setErreur(null)
    try {
      const ok = await window.api.parametres.verifierPin(pin)
      if (ok) setEtat('deverrouille')
      else {
        setErreur('Code PIN incorrect.')
        setPin('')
      }
    } finally {
      setEnvoiEnCours(false)
    }
  }

  if (etat === 'chargement') return <div className="p-8 text-muted-foreground">Chargement…</div>

  if (etat === 'deverrouille') return <>{children}</>

  const estDefinition = etat === 'definir'

  return (
    <div className="flex min-h-full items-center justify-center p-8">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <Lock className="mb-2 h-10 w-10 text-muted-foreground" />
          <CardTitle>{estDefinition ? 'Definir un code PIN' : 'Zone protegee'}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {estDefinition && (
            <p className="text-center text-sm text-muted-foreground">
              Cette zone n&apos;est pas encore protegee. Choisissez un code PIN (4 a 6 chiffres).
            </p>
          )}

          <Input
            autoFocus
            type="password"
            inputMode="numeric"
            placeholder="Code PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
            onKeyDown={(e) => e.key === 'Enter' && !estDefinition && void handleSaisie()}
            className="text-center text-2xl tracking-[0.5em]"
          />

          {estDefinition && (
            <Input
              type="password"
              inputMode="numeric"
              placeholder="Confirmer le code PIN"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyDown={(e) => e.key === 'Enter' && void handleDefinir()}
              className="text-center text-2xl tracking-[0.5em]"
            />
          )}

          {erreur && <p className="text-center text-sm text-destructive">{erreur}</p>}

          <Button
            size="lg"
            disabled={envoiEnCours || pin.length < 4}
            onClick={() => void (estDefinition ? handleDefinir() : handleSaisie())}
          >
            {estDefinition ? 'Definir le code PIN' : 'Deverrouiller'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
