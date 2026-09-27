import type { JSX } from 'react'
import type { FiltrePeriode, TypePeriode } from '@shared/stats'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'

const OPTIONS: { valeur: TypePeriode; libelle: string }[] = [
  { valeur: 'aujourdhui', libelle: "Aujourd'hui" },
  { valeur: 'semaine', libelle: 'Cette semaine' },
  { valeur: 'mois', libelle: 'Ce mois' },
  { valeur: 'annee', libelle: 'Cette annee' },
  { valeur: 'personnalisee', libelle: 'Periode personnalisee' }
]

interface Props {
  filtre: FiltrePeriode
  onChanger: (filtre: FiltrePeriode) => void
}

export function FiltrePeriodeControle({ filtre, onChanger }: Props): JSX.Element {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {OPTIONS.map((option) => (
        <Button
          key={option.valeur}
          size="sm"
          variant={filtre.type === option.valeur ? 'default' : 'outline'}
          onClick={() => onChanger({ type: option.valeur })}
        >
          {option.libelle}
        </Button>
      ))}

      {filtre.type === 'personnalisee' && (
        <div className="flex items-center gap-2">
          <Input
            type="date"
            className="w-40"
            value={filtre.dateDebut ?? ''}
            onChange={(e) => onChanger({ ...filtre, dateDebut: e.target.value })}
          />
          <span className="text-muted-foreground">a</span>
          <Input
            type="date"
            className="w-40"
            value={filtre.dateFin ?? ''}
            onChange={(e) => onChanger({ ...filtre, dateFin: e.target.value })}
          />
        </div>
      )}
    </div>
  )
}
