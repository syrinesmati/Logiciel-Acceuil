import {
  BookUp,
  BookDown,
  BookOpen,
  Search,
  Wifi,
  HelpCircle,
  type LucideIcon
} from 'lucide-react'

/** Associe le nom d'icone stocke en base (motifs.icone) au composant lucide-react correspondant. */
const REGISTRE_ICONES: Record<string, LucideIcon> = {
  'book-up': BookUp,
  'book-down': BookDown,
  'book-open': BookOpen,
  search: Search,
  wifi: Wifi
}

export function obtenirIcone(nom: string): LucideIcon {
  return REGISTRE_ICONES[nom] ?? HelpCircle
}
