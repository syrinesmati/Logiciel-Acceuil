import { useEffect, type ReactNode, type JSX } from 'react'
import { cn } from '@renderer/lib/utils'

export interface DialogProps {
  ouvert: boolean
  onFermer: () => void
  titre: string
  description?: string
  children: ReactNode
  className?: string
}

/** Modale simple et accessible (pas de dependance Radix) : Echap et clic sur le fond ferment la boite. */
export function Dialog({ ouvert, onFermer, titre, description, children, className }: DialogProps): JSX.Element | null {
  useEffect(() => {
    if (!ouvert) return
    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onFermer()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [ouvert, onFermer])

  if (!ouvert) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onFermer()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-titre"
        className={cn(
          'w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-lg',
          className
        )}
      >
        <h2 id="dialog-titre" className="text-lg font-semibold">
          {titre}
        </h2>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        <div className="mt-4">{children}</div>
      </div>
    </div>
  )
}
