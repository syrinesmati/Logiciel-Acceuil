import type { JSX } from 'react'
import type { LigneImportParsee, StatutLigneImport } from '@shared/import'
import { Badge } from '@renderer/components/ui/badge'
import { Button } from '@renderer/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@renderer/components/ui/table'
import { cn } from '@renderer/lib/utils'
import { LIBELLE_STATUT, VARIANT_BADGE_STATUT } from './statutAffichage'

interface Props {
  lignes: LigneImportParsee[]
  compteurs: Record<StatutLigneImport, number>
  filtre: StatutLigneImport | 'tous'
  onChangerFiltre: (filtre: StatutLigneImport | 'tous') => void
}

const ONGLETS: { cle: StatutLigneImport | 'tous'; libelle: string }[] = [
  { cle: 'tous', libelle: 'Toutes' },
  { cle: 'ok', libelle: 'OK' },
  { cle: 'corrigee', libelle: 'Corrigées' },
  { cle: 'a_verifier', libelle: 'À vérifier' },
  { cle: 'rejetee', libelle: 'Rejetées' }
]

export function ApercuTable({ lignes, compteurs, filtre, onChangerFiltre }: Props): JSX.Element {
  const lignesFiltrees = filtre === 'tous' ? lignes : lignes.filter((l) => l.statut === filtre)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {ONGLETS.map((onglet) => (
          <Button
            key={onglet.cle}
            size="sm"
            variant={filtre === onglet.cle ? 'default' : 'outline'}
            onClick={() => onChangerFiltre(onglet.cle)}
          >
            {onglet.libelle}
            <span className="ml-1 opacity-70">
              ({onglet.cle === 'tous' ? lignes.length : compteurs[onglet.cle]})
            </span>
          </Button>
        ))}
      </div>

      <div className="max-h-[420px] overflow-auto rounded-lg border border-border">
        <Table>
          <TableHeader className="sticky top-0 bg-card">
            <TableRow>
              <TableHead>Statut</TableHead>
              <TableHead>Numéro</TableHead>
              <TableHead>Nom</TableHead>
              <TableHead>Naissance</TableHead>
              <TableHead>Téléphone</TableHead>
              <TableHead>Détails</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lignesFiltrees.map((ligne) => (
              <TableRow key={ligne.index}>
                <TableCell>
                  <Badge variant={VARIANT_BADGE_STATUT[ligne.statut]}>{LIBELLE_STATUT[ligne.statut]}</Badge>
                </TableCell>
                <TableCell className="font-mono">{ligne.numeroAbonne ?? '—'}</TableCell>
                <TableCell dir="auto">{ligne.nomComplet ?? '—'}</TableCell>
                <TableCell>{ligne.dateNaissance ?? '—'}</TableCell>
                <TableCell className="font-mono">{ligne.telephone ?? ligne.email ?? '—'}</TableCell>
                <TableCell className={cn('max-w-md text-xs', ligne.statut === 'rejetee' && 'text-destructive')}>
                  {[ligne.erreur, ...ligne.corrections, ...ligne.avertissements].filter(Boolean).join(' · ')}
                </TableCell>
              </TableRow>
            ))}
            {lignesFiltrees.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  Aucune ligne dans cette categorie.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
