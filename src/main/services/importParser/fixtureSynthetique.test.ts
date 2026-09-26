import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { lireFichierImport } from './lecteurFichier'
import { detecterFormat } from './detectionFormat'
import { parserColonneUnique } from './parseurColonneUnique'
import { detecterConflitsDansFichier } from './conflits'

const CHEMIN_FIXTURE = path.resolve(__dirname, '..', '..', '..', '..', 'fixtures', 'exemple_import_anonymise.xlsx')

/**
 * Bout en bout sur le fixture synthetique anonymise (mode "une seule colonne"),
 * qui reproduit chaque cas d'erreur du cahier des charges 4.3. Sert aussi de
 * garde-fou si le fichier ou le parseur changent independamment l'un de l'autre.
 */
describe('pipeline complet sur le fixture synthetique (mode colonne unique)', () => {
  it('detecte le mode colonne unique', async () => {
    const { lignes } = await lireFichierImport(CHEMIN_FIXTURE)
    expect(detecterFormat(lignes).mode).toBe('colonne_unique')
  })

  it('produit la repartition de statuts attendue', async () => {
    const { lignes } = await lireFichierImport(CHEMIN_FIXTURE)
    const brut = lignes.map((l) => l[0] ?? '')
    const parsees = parserColonneUnique(brut, new Date('2026-09-26'))
    const resultat = detecterConflitsDansFichier(parsees)

    const compteurs = { ok: 0, corrigee: 0, a_verifier: 0, rejetee: 0 }
    for (const ligne of resultat) compteurs[ligne.statut]++

    expect(resultat).toHaveLength(21)
    expect(compteurs).toEqual({ ok: 6, corrigee: 6, a_verifier: 6, rejetee: 3 })
  })

  it('rejette bien les deux lignes en conflit de numero (10017)', async () => {
    const { lignes } = await lireFichierImport(CHEMIN_FIXTURE)
    const brut = lignes.map((l) => l[0] ?? '')
    const parsees = parserColonneUnique(brut, new Date('2026-09-26'))
    const resultat = detecterConflitsDansFichier(parsees)

    const enConflit = resultat.filter((l) => l.numeroAbonne === '10017')
    expect(enConflit).toHaveLength(2)
    expect(enConflit.every((l) => l.statut === 'rejetee')).toBe(true)
  })
})
