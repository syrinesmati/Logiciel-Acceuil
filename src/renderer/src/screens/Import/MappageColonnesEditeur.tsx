import type { JSX } from 'react'
import type { EnteteColonne, MappageColonnes } from '@shared/import'
import { Select } from '@renderer/components/ui/select'
import { Button } from '@renderer/components/ui/button'

interface ChampMappage {
  cle: keyof MappageColonnes
  libelle: string
  obligatoire?: boolean
}

const CHAMPS: ChampMappage[] = [
  { cle: 'numeroAbonne', libelle: "Numero d'abonne (code-barres)", obligatoire: true },
  { cle: 'nomComplet', libelle: 'Nom complet (une seule colonne)' },
  { cle: 'prenom', libelle: 'Prenom' },
  { cle: 'nom', libelle: 'Nom' },
  { cle: 'dateNaissance', libelle: 'Date de naissance' },
  { cle: 'telephone', libelle: 'Telephone' },
  { cle: 'email', libelle: 'Email' }
]

interface Props {
  colonnes: EnteteColonne[]
  mappage: Partial<MappageColonnes>
  onChanger: (champ: keyof MappageColonnes, valeur: string) => void
  onRecalculer: () => void
  chargement: boolean
}

export function MappageColonnesEditeur({
  colonnes,
  mappage,
  onChanger,
  onRecalculer,
  chargement
}: Props): JSX.Element {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="mb-1 text-sm font-semibold">Correspondance des colonnes</h3>
      <p className="mb-4 text-sm text-muted-foreground">
        Ce fichier a plusieurs colonnes avec en-tetes. Verifiez ou ajustez la correspondance
        avant de continuer.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CHAMPS.map((champ) => (
          <label key={champ.cle} className="flex flex-col gap-1 text-sm">
            <span>
              {champ.libelle}
              {champ.obligatoire && <span className="text-destructive"> *</span>}
            </span>
            <Select
              value={mappage[champ.cle] ?? ''}
              onChange={(e) => onChanger(champ.cle, e.target.value)}
            >
              <option value="">— Non mappe —</option>
              {colonnes.map((colonne) => (
                <option key={colonne.cle} value={colonne.cle}>
                  {colonne.libelle} {colonne.exemple ? `(ex: ${colonne.exemple})` : ''}
                </option>
              ))}
            </Select>
          </label>
        ))}
      </div>
      <div className="mt-4 flex justify-end">
        <Button onClick={onRecalculer} disabled={!mappage.numeroAbonne || chargement}>
          Recalculer l&apos;apercu
        </Button>
      </div>
    </div>
  )
}
