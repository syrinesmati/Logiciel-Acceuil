import { useEffect, useRef, useState, type FormEvent, type JSX } from 'react'
import { Dialog } from '@renderer/components/ui/dialog'
import { Input } from '@renderer/components/ui/input'
import { Button } from '@renderer/components/ui/button'

interface Props {
  onFermer: () => void
  onValider: (cin: string) => void
}

export function SaisieCinDialog({ onFermer, onValider }: Props): JSX.Element {
  const [cin, setCin] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function handleSubmit(e: FormEvent): void {
    e.preventDefault()
    if (!cin.trim()) return
    onValider(cin.trim())
  }

  return (
    <Dialog ouvert onFermer={onFermer} titre="Visiteur non-abonné" className="max-w-md">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          Pour un visiteur qui n&apos;est pas abonné à la médiathèque, saisissez le numéro de sa
          carte d&apos;identité nationale (CIN).
        </p>
        <Input
          ref={inputRef}
          inputMode="numeric"
          value={cin}
          onChange={(e) => setCin(e.target.value)}
          placeholder="N° CIN…"
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onFermer}>
            Annuler
          </Button>
          <Button type="submit" disabled={!cin.trim()}>
            Continuer
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
