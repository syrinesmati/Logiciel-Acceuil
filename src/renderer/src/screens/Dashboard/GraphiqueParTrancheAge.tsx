import type { JSX } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { RepartitionTrancheAge } from '@shared/stats'
import { Card, CardContent, CardHeader, CardTitle } from '@renderer/components/ui/card'
import { couleurCategorielle, COULEUR_MUTEE } from '@renderer/lib/paletteGraphiques'

export function GraphiqueParTrancheAge({ donnees }: { donnees: RepartitionTrancheAge[] }): JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Repartition par tranche d&apos;age</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={donnees} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e1e0d9" vertical={false} />
            <XAxis dataKey="libelle" tick={{ fontSize: 12, fill: '#898781' }} axisLine={{ stroke: '#c3c2b7' }} tickLine={false} />
            <YAxis unit="%" tick={{ fontSize: 12, fill: '#898781' }} axisLine={false} tickLine={false} width={40} />
            <Tooltip formatter={(valeur, _n, item) => [`${valeur}% (${item.payload.nombre} visites)`, 'Part']} />
            <Bar dataKey="pourcentage" name="Part" radius={[4, 4, 0, 0]}>
              {donnees.map((tranche, index) => (
                <Cell
                  key={tranche.trancheId}
                  fill={tranche.trancheId === 'age_inconnu' ? COULEUR_MUTEE : couleurCategorielle(index)}
                />
              ))}
              <LabelList dataKey="pourcentage" position="top" formatter={(v) => `${v}%`} fontSize={11} fill="#52514e" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
