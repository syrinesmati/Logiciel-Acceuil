import type { JSX } from 'react'
import { ArrowDown, ArrowUp } from 'lucide-react'
import { Card, CardContent } from '@renderer/components/ui/card'
import { cn } from '@renderer/lib/utils'

interface Props {
  libelle: string
  valeur: string
  variationPct?: number | null
}

export function CarteIndicateur({ libelle, valeur, variationPct }: Props): JSX.Element {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1 p-5">
        <p className="text-sm text-muted-foreground">{libelle}</p>
        <p className="text-3xl font-bold">{valeur}</p>
        {variationPct !== undefined && variationPct !== null && (
          <p
            className={cn(
              'flex items-center gap-1 text-sm font-medium',
              variationPct >= 0 ? 'text-emerald-600' : 'text-destructive'
            )}
          >
            {variationPct >= 0 ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />}
            {Math.abs(variationPct)}% vs periode precedente
          </p>
        )}
        {variationPct === null && <p className="text-sm text-muted-foreground">— vs periode precedente</p>}
      </CardContent>
    </Card>
  )
}
