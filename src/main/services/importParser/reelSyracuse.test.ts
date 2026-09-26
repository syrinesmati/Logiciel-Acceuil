import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { lireFichierImport } from './lecteurFichier'
import { detecterFormat } from './detectionFormat'
import { parserColonnesMappees } from './parseurColonnesMappees'
import type { MappageColonnes } from '@shared/import'

/**
 * Validation en conditions reelles du mode "mapping de colonnes" sur le vrai
 * export Syracuse fourni par la bibliotheque. Ce fichier contient de vraies
 * donnees personnelles : il n'est jamais commite (.gitignore) et ce test se
 * saute tout seul s'il est absent (autre machine, CI...).
 */
const CHEMIN_FICHIER_REEL = path.resolve(
  __dirname,
  '..',
  '..',
  '..',
  '..',
  'Archimed.Search.Export_639260300114978837_35379.xlsx'
)

const fichierPresent = fs.existsSync(CHEMIN_FICHIER_REEL)

describe.skipIf(!fichierPresent)('parserColonnesMappees (vrai fichier Syracuse, local uniquement)', () => {
  it('detecte le format structure et propose un mappage correct sur les vrais en-tetes', async () => {
    const { lignes } = await lireFichierImport(CHEMIN_FICHIER_REEL)
    const format = detecterFormat(lignes)

    expect(format.mode).toBe('mapping_colonnes')
    expect(format.mappageSuggere).toMatchObject({
      numeroAbonne: 'col_0',
      prenom: 'col_1',
      nom: 'col_2',
      dateNaissance: 'col_3',
      email: 'col_6'
    })
  })

  it('importe les 251 lignes reelles avec exactement 1 rejet (code-barres absent)', async () => {
    const { lignes } = await lireFichierImport(CHEMIN_FICHIER_REEL)
    const format = detecterFormat(lignes)
    const mappage = format.mappageSuggere as MappageColonnes
    const lignesDonnees = lignes.slice(1)

    const resultats = parserColonnesMappees(lignesDonnees, format.colonnes!, mappage, new Date('2026-09-26'))

    expect(resultats).toHaveLength(251)

    const rejetees = resultats.filter((r) => r.statut === 'rejetee')
    expect(rejetees).toHaveLength(1)
    expect(rejetees[0]!.numeroAbonne).toBeNull()

    // La ligne reelle sans prenom doit etre signalee, pas rejetee.
    expect(resultats.some((r) => r.avertissements.some((a) => a.includes('prenom manquant')))).toBe(true)

    // Aucun conflit de numero attendu sur ce fichier (verifie separement en 4.3).
    const numeros = resultats.map((r) => r.numeroAbonne).filter((n): n is string => n !== null)
    expect(new Set(numeros).size).toBe(numeros.length)
  })
})

if (!fichierPresent) {
  describe('fichier reel Syracuse absent', () => {
    it.skip('teste sur le vrai fichier (place-le a la racine du projet pour l\'activer)', () => {})
  })
}
