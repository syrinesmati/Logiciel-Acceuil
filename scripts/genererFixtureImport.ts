/**
 * Genere fixtures/exemple_import_anonymise.xlsx : un exemple synthetique et
 * anonymise au format "une seule colonne de texte" (voir cahier des charges 4.3),
 * reproduisant fidelement chaque cas d'erreur decrit dans le document (aucun
 * exemple reel de ce format n'a ete fourni ; le vrai fichier Syracuse recu est
 * un export structure different, voir CLAUDE.md).
 *
 * Execution : `npm run fixture:generer`
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import ExcelJS from 'exceljs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// prettier-ignore
const LIGNES: string[] = [
  'جانفي',
  '',
  // Lignes correctes
  '10001 محمد التونسي 12-05-2008 23456789',
  '10018 مريم بن سالم 05-11-1999 56784321',
  '10019 يوسف العماري 21-02-2015 67891234',

  // Dates mal tapees, reparees automatiquement sans ambiguite
  '10002 كريم الشارني 3008-2004 34567890',       // jour/mois colles au tiret manquant -> 30-08-2004
  '10003 سامي الغربي 10-09--2005 45678901',       // double tiret -> 10-09-2005
  '10004 وليد بوزيد 18-092012 56789012',          // mois/annee colles -> 18-09-2012
  '10005 نور الفرشيشي 19-009-2000 67890123',      // chiffre en trop dans le mois -> 19-09-2000
  '10006 إيمان الماجري 29 08 2016 78901234',       // espaces au lieu de tirets -> 29-08-2016
  '10015 كريم الزغلامي07-10-2013 34567890',       // nom colle a la date

  '',
  'فيفري',

  // Dates non reparables (a verifier), mais numero + nom suffisent pour importer
  '10007 عمر الحمروني 17-09- 89012345',            // annee manquante
  '10008 خالد الجريدي 2011 90123456',              // annee seule

  // Ordre des champs inverse : tolere sans etre signale
  '10009 سارة العماري 34567890 12-05-2008',        // telephone avant la date
  'محمد بن سالم 12-05-2008 23456789 10010',        // numero d'abonne en fin de ligne

  // Telephone manquant, trop court, trop long, ou remplace par un email
  '10011 ليلى الشارني 12-05-2008',
  '10012 فاطمة الزغلامي 12-05-2008 3456789',
  '10013 أحمد التونسي 12-05-2008 345678901',
  '10014 يوسف الغربي 12-05-2008 youssef@example.com',

  // Numero d'abonne avec un chiffre en trop (6 chiffres au lieu de 5) : tolere
  '100016 محمد الفرشيشي 12-05-2008 23456789',

  '',
  'أوت',

  // Meme numero d'abonne pour deux personnes differentes : conflit -> rejetees
  '10017 وليد الماجري 12-05-2008 23456789',
  '10017 كريم بوزيد 10-03-2010 34567890',

  // Ligne sans numero d'abonne reconnaissable : rejetee
  'خالد بن علي 12-05-2008 23456789'
]

async function main(): Promise<void> {
  const classeur = new ExcelJS.Workbook()
  const feuille = classeur.addWorksheet('Export')
  for (const ligne of LIGNES) {
    feuille.addRow([ligne])
  }

  const cheminSortie = path.resolve(__dirname, '..', 'fixtures', 'exemple_import_anonymise.xlsx')
  await classeur.xlsx.writeFile(cheminSortie)
  console.log(`[fixture] Ecrit : ${cheminSortie} (${LIGNES.length} lignes)`)
}

main().catch((err) => {
  console.error('[fixture] Echec :', err)
  process.exitCode = 1
})
