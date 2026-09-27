import type { JSX } from 'react'
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { RepartitionSexe } from '@shared/stats'
import { Card, CardContent, CardHeader, CardTitle } from '@renderer/components/ui/card'
import { COULEUR_SEXE } from '@renderer/lib/paletteGraphiques'

const LIBELLES: Record<RepartitionSexe['sexe'], string> = {
  H: 'Homme',
  F: 'Femme',
  non_renseigne: 'Non renseigne'
}

export function GraphiqueParSexe({ donnees }: { donnees: RepartitionSexe[] }): JSX.Element {
  const donneesGraphique = donnees.map((d) => ({ ...d, libelle: LIBELLES[d.sexe] }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Repartition par sexe</CardTitle>
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
                <Cell key={d.sexe} fill={COULEUR_SEXE[d.sexe]} />
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
