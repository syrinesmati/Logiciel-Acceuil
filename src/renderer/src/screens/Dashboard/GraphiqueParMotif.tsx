import type { JSX } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { RepartitionMotif } from '@shared/stats'
import { Card, CardContent, CardHeader, CardTitle } from '@renderer/components/ui/card'

export function GraphiqueParMotif({ donnees }: { donnees: RepartitionMotif[] }): JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Repartition par motif</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={donnees} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e1e0d9" vertical={false} />
            <XAxis dataKey="libelle" tick={{ fontSize: 12, fill: '#898781' }} axisLine={{ stroke: '#c3c2b7' }} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#898781' }} axisLine={false} tickLine={false} width={32} />
            <Tooltip formatter={(valeur, _n, item) => [`${valeur} (${item.payload.pourcentage}%)`, 'Visites']} />
            <Bar dataKey="nombre" name="Visites" radius={[4, 4, 0, 0]}>
              {donnees.map((motif) => (
                <Cell key={motif.motifId} fill={motif.couleur} />
              ))}
              <LabelList dataKey="pourcentage" position="top" formatter={(v) => `${v}%`} fontSize={11} fill="#52514e" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
