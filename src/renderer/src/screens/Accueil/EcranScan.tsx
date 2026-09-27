import { useEffect, useRef, useState, type FormEvent, type JSX } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { IdCard, ScanLine, Search } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'

function Horloge(): JSX.Element {
  const [maintenant, setMaintenant] = useState(new Date())

  useEffect(() => {
    const identifiant = setInterval(() => setMaintenant(new Date()), 1000)
    return () => clearInterval(identifiant)
  }, [])

  return (
    <div className="text-right">
      <p className="text-lg font-semibold tabular-nums">{format(maintenant, 'HH:mm')}</p>
      <p className="text-xs capitalize text-muted-foreground">{format(maintenant, 'EEEE d MMMM', { locale: fr })}</p>
    </div>
  )
}

interface Props {
  compteurAujourdhui: number
  chargement: boolean
  /** false quand une boite de dialogue (recherche, CIN...) est ouverte par-dessus : ne pas lui voler le focus. */
  focusActif: boolean
  onScanner: (numero: string) => void
  onOuvrirRecherche: () => void
  onOuvrirCin: () => void
}

export function EcranScan({
  compteurAujourdhui,
  chargement,
  focusActif,
  onScanner,
  onOuvrirRecherche,
  onOuvrirCin
}: Props): JSX.Element {
  const [valeur, setValeur] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const input = inputRef.current
    if (!input || !focusActif) return undefined
    input.focus()

    const refocus = (): void => input.focus()
    // Re-focalise si l'utilisateur clique ailleurs (voir 4.1) — desactive quand
    // une boite de dialogue est ouverte par-dessus (sinon impossible d'y saisir du texte).
    window.addEventListener('click', refocus)
    return () => window.removeEventListener('click', refocus)
  }, [focusActif])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent): void {
      if (e.key === 'F2') {
        e.preventDefault()
        onOuvrirRecherche()
      } else if (e.key === 'F3') {
        e.preventDefault()
        onOuvrirCin()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onOuvrirRecherche, onOuvrirCin])

  function handleSubmit(e: FormEvent): void {
    e.preventDefault()
    if (!valeur.trim() || chargement) return
    onScanner(valeur)
    setValeur('')
  }

  return (
    <div className="animate-in fade-in relative flex min-h-full flex-col items-center justify-center gap-10 p-8 duration-300">
      <div className="absolute right-6 top-6 flex items-start gap-4">
        <div className="rounded-full border border-border bg-card px-4 py-2 text-sm shadow-sm">
          Visites aujourd&apos;hui : <span className="font-semibold text-primary">{compteurAujourdhui}</span>
        </div>
        <Horloge />
      </div>

      <div className="relative flex h-36 w-36 items-center justify-center">
        <span className="bg-primary/10 absolute inset-0 animate-pulse rounded-full" />
        <span className="bg-primary/10 absolute inset-3 rounded-full" />
        <ScanLine className="text-primary relative h-16 w-16" strokeWidth={1.5} />
      </div>

      <div className="text-center">
        <h1 className="text-3xl font-semibold">Scannez la carte de l&apos;abonné</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          ou saisissez le numéro d&apos;abonné au clavier puis validez
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-xl">
        <input
          ref={inputRef}
          autoFocus
          value={valeur}
          onChange={(e) => setValeur(e.target.value)}
          onBlur={() => {
            if (focusActif) setTimeout(() => inputRef.current?.focus(), 0)
          }}
          disabled={chargement}
          inputMode="numeric"
          placeholder="Numéro d'abonné…"
          className="focus-visible:border-primary w-full rounded-xl border-2 border-input bg-background px-6 py-5 text-center text-3xl tracking-widest shadow-sm outline-none transition-colors"
        />
      </form>

      <div className="flex gap-2">
        <Button variant="ghost" size="sm" onClick={onOuvrirRecherche}>
          <Search className="h-4 w-4" />
          Rechercher par nom (F2)
        </Button>
        <Button variant="ghost" size="sm" onClick={onOuvrirCin}>
          <IdCard className="h-4 w-4" />
          Visiteur non-abonné (F3)
        </Button>
      </div>
    </div>
  )
}
