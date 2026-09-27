import type { JSX } from 'react'
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { RepartitionTypeVisiteur } from '@shared/stats'
import { Card, CardContent, CardHeader, CardTitle } from '@renderer/components/ui/card'
import { COULEUR_TYPE_VISITEUR } from '@renderer/lib/paletteGraphiques'

const LIBELLES: Record<RepartitionTypeVisiteur['type'], string> = {
  abonne: 'Abonne',
  non_abonne: 'Non-abonne (CIN)'
}

export function GraphiqueParTypeVisiteur({ donnees }: { donnees: RepartitionTypeVisiteur[] }): JSX.Element {
  const donneesGraphique = donnees.map((d) => ({ ...d, libelle: LIBELLES[d.type] }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Abonnes / non-abonnes</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={donneesGraphique}
              dataKey="nombre"
              nameKey="libelle"
              cx="50%"
              cy="50%"
              outerRadius={90}
              label={({ percent }) => `${Math.round((percent ?? 0) * 100)}%`}
            >
              {donneesGraphique.map((d) => (
                <Cell key={d.type} fill={COULEUR_TYPE_VISITEUR[d.type]} />
              ))}
            </Pie>
            <Tooltip formatter={(valeur, _n, item) => [`${valeur} (${item.payload.pourcentage}%)`, item.payload.libelle]} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
