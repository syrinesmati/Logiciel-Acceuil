import { useEffect, useRef, useState, type FormEvent, type JSX } from 'react'
import { ScanLine, Search } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'

interface Props {
  compteurAujourdhui: number
  chargement: boolean
  onScanner: (numero: string) => void
  onOuvrirRecherche: () => void
}

export function EcranScan({ compteurAujourdhui, chargement, onScanner, onOuvrirRecherche }: Props): JSX.Element {
  const [valeur, setValeur] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const input = inputRef.current
    if (!input) return undefined
    input.focus()

    const refocus = (): void => input.focus()
    // Re-focalise si l'utilisateur clique ailleurs (voir 4.1).
    window.addEventListener('click', refocus)
    return () => window.removeEventListener('click', refocus)
  }, [])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent): void {
      if (e.key === 'F2') {
        e.preventDefault()
        onOuvrirRecherche()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onOuvrirRecherche])

  function handleSubmit(e: FormEvent): void {
    e.preventDefault()
    if (!valeur.trim() || chargement) return
    onScanner(valeur)
    setValeur('')
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-10 p-8">
      <div className="absolute right-6 top-6 rounded-full border border-border bg-card px-4 py-2 text-sm shadow-sm">
        Visites aujourd&apos;hui : <span className="font-semibold">{compteurAujourdhui}</span>
      </div>

      <ScanLine className="h-20 w-20 text-muted-foreground" strokeWidth={1} />

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
          onBlur={() => setTimeout(() => inputRef.current?.focus(), 0)}
          disabled={chargement}
          inputMode="numeric"
          placeholder="Numéro d'abonné…"
          className="w-full rounded-xl border-2 border-input bg-background px-6 py-5 text-center text-3xl tracking-widest shadow-sm outline-none focus-visible:border-ring"
        />
      </form>

      <Button variant="ghost" size="lg" onClick={onOuvrirRecherche}>
        <Search className="h-5 w-5" />
        Rechercher par nom (F2)
      </Button>
    </div>
  )
}
