import {
  BookUp,
  BookDown,
  BookOpen,
  BookMarked,
  Library,
  Search,
  Wifi,
  Users,
  User,
  Printer,
  Newspaper,
  Headphones,
  Monitor,
  Laptop,
  GraduationCap,
  PenLine,
  FileText,
  Coffee,
  Baby,
  Gamepad2,
  Music,
  Film,
  CalendarDays,
  Phone,
  Mail,
  MapPin,
  Star,
  Heart,
  Clock,
  HelpCircle,
  type LucideIcon
} from 'lucide-react'

/** Associe le nom d'icone stocke en base (motifs.icone) au composant lucide-react correspondant. */
const REGISTRE_ICONES: Record<string, LucideIcon> = {
  'book-up': BookUp,
  'book-down': BookDown,
  'book-open': BookOpen,
  'book-marked': BookMarked,
  library: Library,
  search: Search,
  wifi: Wifi,
  users: Users,
  user: User,
  printer: Printer,
  newspaper: Newspaper,
  headphones: Headphones,
  monitor: Monitor,
  laptop: Laptop,
  'graduation-cap': GraduationCap,
  'pen-line': PenLine,
  'file-text': FileText,
  coffee: Coffee,
  baby: Baby,
  'game-pad': Gamepad2,
  music: Music,
  film: Film,
  calendar: CalendarDays,
  phone: Phone,
  mail: Mail,
  'map-pin': MapPin,
  star: Star,
  heart: Heart,
  clock: Clock
}

/** Icones proposees dans le selecteur de l'ecran Parametres (gestion des motifs). */
export const ICONES_DISPONIBLES = Object.keys(REGISTRE_ICONES)

export function obtenirIcone(nom: string): LucideIcon {
  return REGISTRE_ICONES[nom] ?? HelpCircle
}
