/**
 * Genere des donnees de demonstration (~200 abonnes, ~3000 visites sur 6 mois)
 * pour pouvoir tester l'ecran d'accueil et le tableau de bord sans donnees reelles.
 * Execution : `npm run seed` (script Node autonome via tsx, hors Electron).
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getDb, closeDb } from './client'
import { resolveDbPath } from './userDataPath'

const migrationsFolder = path.join(path.dirname(fileURLToPath(import.meta.url)), 'migrations')
import { abonnes, motifs, visites, visiteMotifs, imports, lignesACorriger } from './schema'
import { normaliserNom } from '../services/nomArabe'

const PRENOMS_ARABES = [
  'محمد',
  'أحمد',
  'علي',
  'يوسف',
  'عمر',
  'إبراهيم',
  'خالد',
  'سامي',
  'وليد',
  'كريم',
  'فاطمة',
  'مريم',
  'أمل',
  'سارة',
  'إيمان',
  'ليلى',
  'نور',
  'رانية',
  'آمنة',
  'زينب'
]

const NOMS_ARABES = [
  'التونسي',
  'الشارني',
  'بن علي',
  'الجريدي',
  'الزغلامي',
  'العماري',
  'بوزيد',
  'الحمروني',
  'الغربي',
  'الفرشيشي',
  'بن سالم',
  'الماجري'
]

const PRENOMS_LATINS = [
  'Mohamed',
  'Ahmed',
  'Ali',
  'Youssef',
  'Omar',
  'Karim',
  'Walid',
  'Sami',
  'Fatma',
  'Mariem',
  'Amel',
  'Sarra',
  'Ines',
  'Rania',
  'Leila',
  'Nour',
  'Chiraz',
  'Emna'
]

const NOMS_LATINS = [
  'Tounsi',
  'Charni',
  'Ben Ali',
  'Jeridi',
  'Zeghlami',
  'Ammari',
  'Bouzid',
  'Hamrouni',
  'Gharbi',
  'Ferchichi',
  'Ben Salem',
  'Majri',
  'Chouikh',
  'Trabelsi'
]

const MOTIFS_SEED = [
  { libelle: 'Pret', icone: 'book-up', couleur: '#2563eb', ordre: 1 },
  { libelle: 'Retour', icone: 'book-down', couleur: '#16a34a', ordre: 2 },
  { libelle: 'Lecture sur place', icone: 'book-open', couleur: '#d97706', ordre: 3 },
  { libelle: 'Recherche', icone: 'search', couleur: '#7c3aed', ordre: 4 },
  { libelle: 'Internet', icone: 'wifi', couleur: '#0891b2', ordre: 5 }
]

const NB_ABONNES = 200
const NB_VISITES = 3000
const NB_MOIS_HISTORIQUE = 6

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pick<T>(liste: T[]): T {
  return liste[randomInt(0, liste.length - 1)]!
}

function genererNumeroAbonne(index: number): string {
  return String(90000000 + index).padStart(8, '0')
}

function genererDateNaissance(): string {
  const age = randomInt(6, 78)
  const anneeNaissance = 2026 - age
  const mois = randomInt(1, 12)
  const jour = randomInt(1, 28)
  return `${anneeNaissance}-${String(mois).padStart(2, '0')}-${String(jour).padStart(2, '0')}`
}

function genererTelephone(): string | null {
  if (Math.random() < 0.15) return null // ~15% sans telephone, comme dans les vraies donnees
  const prefixe = pick(['2', '4', '5', '9'])
  const reste = String(randomInt(0, 9999999)).padStart(7, '0')
  return prefixe + reste
}

/** Heure biaisee vers l'apres-midi (14h-18h), ouverture 9h-18h. */
function genererHeureOuverture(): number {
  const poids = [1, 1, 2, 2, 3, 4, 5, 5, 4, 3] // 9h..18h
  const total = poids.reduce((a, b) => a + b, 0)
  let tirage = Math.random() * total
  for (let h = 0; h < poids.length; h++) {
    tirage -= poids[h]!
    if (tirage <= 0) return 9 + h
  }
  return 9
}

/** Jour de semaine biaise : ferme le dimanche, plus calme le samedi. */
function genererDateVisite(debut: Date, fin: Date): Date {
  for (let tentative = 0; tentative < 20; tentative++) {
    const t = debut.getTime() + Math.random() * (fin.getTime() - debut.getTime())
    const date = new Date(t)
    const jour = date.getDay() // 0 = dimanche
    if (jour === 0) continue
    if (jour === 6 && Math.random() < 0.5) continue // samedi : moins de visites
    date.setHours(genererHeureOuverture(), randomInt(0, 59), 0, 0)
    return date
  }
  const fallback = new Date(debut.getTime() + Math.random() * (fin.getTime() - debut.getTime()))
  fallback.setHours(10, 0, 0, 0)
  return fallback
}

async function main(): Promise<void> {
  const dbPath = resolveDbPath()
  console.log(`[seed] Base de donnees : ${dbPath}`)
  const db = getDb(dbPath, migrationsFolder)

  db.transaction((tx) => {
    tx.delete(visiteMotifs).run()
    tx.delete(visites).run()
    tx.delete(lignesACorriger).run()
    tx.delete(imports).run()
    tx.delete(abonnes).run()
    tx.delete(motifs).run()

    tx.insert(motifs).values(MOTIFS_SEED).run()
    const motifsInseres = tx.select().from(motifs).all()

    const maintenant = new Date().toISOString()
    const abonnesAInserer = Array.from({ length: NB_ABONNES }, (_, i) => {
      const estArabe = Math.random() < 0.6 // reflete la mixite constatee dans l'export reel
      const prenom = estArabe ? pick(PRENOMS_ARABES) : pick(PRENOMS_LATINS)
      const nom = estArabe ? pick(NOMS_ARABES) : pick(NOMS_LATINS)
      const nomComplet = `${prenom} ${nom}`
      return {
        numeroAbonne: genererNumeroAbonne(i),
        nomComplet,
        nomNormalise: normaliserNom(nomComplet),
        dateNaissance: Math.random() < 0.95 ? genererDateNaissance() : null,
        sexe: Math.random() < 0.85 ? (Math.random() < 0.5 ? ('H' as const) : ('F' as const)) : null,
        telephone: genererTelephone(),
        email: null,
        source: 'import' as const,
        datePremierImport: maintenant,
        dateDerniereMaj: maintenant,
        actif: true
      }
    })
    tx.insert(abonnes).values(abonnesAInserer).run()
    const abonnesInseres = tx.select().from(abonnes).all()

    const fin = new Date()
    const debut = new Date()
    debut.setMonth(debut.getMonth() - NB_MOIS_HISTORIQUE)

    const CHUNK = 200
    for (let depart = 0; depart < NB_VISITES; depart += CHUNK) {
      const lot = Math.min(CHUNK, NB_VISITES - depart)
      const visitesLot = Array.from({ length: lot }, () => ({
        abonneId: pick(abonnesInseres).id,
        dateHeure: genererDateVisite(debut, fin).toISOString()
      }))
      const visitesInserees = tx.insert(visites).values(visitesLot).returning({ id: visites.id }).all()

      const liaisons = visitesInserees.flatMap((v) => {
        const nbMotifs = randomInt(1, 2)
        const motifsChoisis = new Set<number>()
        while (motifsChoisis.size < nbMotifs) {
          motifsChoisis.add(pick(motifsInseres).id)
        }
        return [...motifsChoisis].map((motifId) => ({ visiteId: v.id, motifId }))
      })
      tx.insert(visiteMotifs).values(liaisons).run()
    }
  })

  console.log(`[seed] ${NB_ABONNES} abonnes et ${NB_VISITES} visites generes sur ${NB_MOIS_HISTORIQUE} mois.`)
  closeDb()
}

main().catch((err) => {
  console.error('[seed] Echec :', err)
  process.exitCode = 1
})
