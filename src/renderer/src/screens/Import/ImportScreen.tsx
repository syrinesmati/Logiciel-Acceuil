import { useState, type JSX } from 'react'
import type { ApercuImport, MappageColonnes, RapportImport, StatutLigneImport } from '@shared/import'
import { Button } from '@renderer/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@renderer/components/ui/card'
import { MappageColonnesEditeur } from './MappageColonnesEditeur'
import { ApercuTable } from './ApercuTable'

type Etape = 'choix' | 'apercu' | 'rapport'

function nomDeFichier(chemin: string): string {
  return chemin.split(/[\\/]/).pop() ?? chemin
}

interface Props {
  onVoirLignesACorriger: () => void
}

export function ImportScreen({ onVoirLignesACorriger }: Props): JSX.Element {
  const [etape, setEtape] = useState<Etape>('choix')
  const [cheminFichier, setCheminFichier] = useState<string | null>(null)
  const [nomFichier, setNomFichier] = useState('')
  const [apercu, setApercu] = useState<ApercuImport | null>(null)
  const [mappage, setMappage] = useState<Partial<MappageColonnes>>({})
  const [filtre, setFiltre] = useState<StatutLigneImport | 'tous'>('tous')
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [rapport, setRapport] = useState<RapportImport | null>(null)
  const [messageExport, setMessageExport] = useState<string | null>(null)

  async function analyser(chemin: string, fichier: string, mappageChoisi?: MappageColonnes): Promise<void> {
    setChargement(true)
    setErreur(null)
    try {
      const resultat = await window.api.import.analyserFichier({
        cheminFichier: chemin,
        nomFichier: fichier,
        mappage: mappageChoisi
      })
      setApercu(resultat)
      if (resultat.mode === 'mapping_colonnes' && resultat.format.mappageSuggere) {
        setMappage(resultat.format.mappageSuggere)
      }
      setFiltre('tous')
      setEtape('apercu')
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'Impossible de lire ce fichier.')
    } finally {
      setChargement(false)
    }
  }

  async function handleChoisirFichier(): Promise<void> {
    const chemin = await window.api.import.choisirFichier()
    if (!chemin) return
    const fichier = nomDeFichier(chemin)
    setCheminFichier(chemin)
    setNomFichier(fichier)
    await analyser(chemin, fichier)
  }

  function handleChangerMappage(champ: keyof MappageColonnes, valeur: string): void {
    setMappage((prec) => ({ ...prec, [champ]: valeur || undefined }))
  }

  async function handleRecalculer(): Promise<void> {
    if (!cheminFichier || !mappage.numeroAbonne) return
    await analyser(cheminFichier, nomFichier, mappage as MappageColonnes)
  }

  async function handleConfirmerImport(): Promise<void> {
    if (!apercu) return
    setChargement(true)
    setErreur(null)
    try {
      const resultat = await window.api.import.executerImport({
        nomFichier: apercu.nomFichier,
        lignes: apercu.lignes
      })
      setRapport(resultat)
      setEtape('rapport')
    } catch {
      setErreur("Une erreur est survenue pendant l'import. Rien n'a ete enregistre.")
    } finally {
      setChargement(false)
    }
  }

  async function handleExporterErreurs(): Promise<void> {
    if (!apercu) return
    const chemin = await window.api.import.exporterErreurs({ lignes: apercu.lignes })
    setMessageExport(chemin ? `Fichier enregistre : ${chemin}` : null)
  }

  function handleNouvelImport(): void {
    setEtape('choix')
    setCheminFichier(null)
    setNomFichier('')
    setApercu(null)
    setMappage({})
    setRapport(null)
    setErreur(null)
    setMessageExport(null)
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold">Import Syracuse</h1>
        <p className="text-muted-foreground">
          Importez un export d&apos;abonnes (.xlsx ou .csv) depuis Syracuse.
        </p>
      </div>

      {erreur && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {erreur}
        </div>
      )}

      {etape === 'choix' && (
        <Card>
          <CardHeader>
            <CardTitle>Choisir un fichier</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Formats acceptes : export structure avec en-tetes (mappage des colonnes), ou export
              une seule colonne de texte libre.
            </p>
            <div>
              <Button onClick={handleChoisirFichier} disabled={chargement} size="lg">
                {chargement ? 'Lecture en cours…' : 'Choisir un fichier…'}
              </Button>
            </div>
            <Button variant="ghost" className="w-fit" onClick={onVoirLignesACorriger}>
              Voir les lignes a corriger d&apos;un import precedent →
            </Button>
          </CardContent>
        </Card>
      )}

      {etape === 'apercu' && apercu && (
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>{apercu.nomFichier}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {apercu.mode === 'mapping_colonnes' && apercu.format.colonnes && (
                <MappageColonnesEditeur
                  colonnes={apercu.format.colonnes}
                  mappage={mappage}
                  onChanger={handleChangerMappage}
                  onRecalculer={handleRecalculer}
                  chargement={chargement}
                />
              )}

              <ApercuTable
                lignes={apercu.lignes}
                compteurs={apercu.compteurs}
                filtre={filtre}
                onChangerFiltre={setFiltre}
              />

              <div className="flex justify-between">
                <Button variant="ghost" onClick={handleNouvelImport}>
                  ← Choisir un autre fichier
                </Button>
                <Button size="lg" onClick={handleConfirmerImport} disabled={chargement}>
                  {chargement ? 'Import en cours…' : "Confirmer l'import"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {etape === 'rapport' && rapport && (
        <Card>
          <CardHeader>
            <CardTitle>Import termine</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatCarte libelle="Créés" valeur={rapport.nbCrees} />
              <StatCarte libelle="Mis à jour" valeur={rapport.nbMisAJour} />
              <StatCarte libelle="Corrigés automatiquement" valeur={rapport.nbCorriges} />
              <StatCarte libelle="Rejetés (à corriger)" valeur={rapport.nbRejetes} accent />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={handleExporterErreurs} variant="outline">
                Exporter les erreurs en Excel
              </Button>
              <Button onClick={onVoirLignesACorriger} variant="outline">
                Voir les lignes a corriger
              </Button>
              <Button onClick={handleNouvelImport}>Nouvel import</Button>
            </div>
            {messageExport && <p className="text-sm text-muted-foreground">{messageExport}</p>}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function StatCarte({ libelle, valeur, accent }: { libelle: string; valeur: number; accent?: boolean }): JSX.Element {
  return (
    <div className="rounded-lg border border-border p-4 text-center">
      <p className="text-sm text-muted-foreground">{libelle}</p>
      <p className={`text-3xl font-bold ${accent && valeur > 0 ? 'text-destructive' : ''}`}>{valeur}</p>
    </div>
  )
}
