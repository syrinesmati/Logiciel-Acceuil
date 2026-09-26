import { useEffect, useRef } from 'react'

/**
 * Revient automatiquement a l'ecran de scan apres un delai d'inactivite (voir 4.1).
 * Actif uniquement quand `actif` est vrai (pas sur l'ecran de scan lui-meme, qui
 * est deja l'etat de repos). Le minuteur se reinitialise a chaque interaction.
 */
export function useRetourAutomatique(actif: boolean, delaiMs: number, onExpiration: () => void): void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onExpirationRef = useRef(onExpiration)

  useEffect(() => {
    onExpirationRef.current = onExpiration
  }, [onExpiration])

  useEffect(() => {
    if (!actif) return undefined

    function reinitialiser(): void {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => onExpirationRef.current(), delaiMs)
    }

    reinitialiser()
    window.addEventListener('keydown', reinitialiser)
    window.addEventListener('mousedown', reinitialiser)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      window.removeEventListener('keydown', reinitialiser)
      window.removeEventListener('mousedown', reinitialiser)
    }
  }, [actif, delaiMs])
}
