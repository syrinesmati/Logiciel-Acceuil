import type { StatutLigneImport } from '@shared/import'
import type { BadgeProps } from '@renderer/components/ui/badge'

export const LIBELLE_STATUT: Record<StatutLigneImport, string> = {
  ok: 'OK',
  corrigee: 'Corrigée',
  a_verifier: 'À vérifier',
  rejetee: 'Rejetée'
}

export const VARIANT_BADGE_STATUT: Record<StatutLigneImport, NonNullable<BadgeProps['variant']>> = {
  ok: 'succes',
  corrigee: 'secondary',
  a_verifier: 'avertissement',
  rejetee: 'destructive'
}
