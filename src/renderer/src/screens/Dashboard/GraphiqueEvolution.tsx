import type { JSX } from 'react'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts'
import type { PointEvolution } from '@shared/stats'
import { Card, CardContent, CardHeader, CardTitle } from '@renderer/components/ui/card'
import { PALETTE_CATEGORIELLE } from '@renderer/lib/paletteGraphiques'

export function GraphiqueEvolution({ donnees }: { donnees: PointEvolution[] }): JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Evolution des visites</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={donnees} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e1e0d9" vertical={false} />
            <XAxis dataKey="libelle" tick={{ fontSize: 12, fill: '#898781' }} axisLine={{ stroke: '#c3c2b7' }} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#898781' }} axisLine={false} tickLine={false} width={32} />
            <Tooltip formatter={(valeur) => [valeur, 'Visites']} />
            <Line
              type="monotone"
              dataKey="nbVisites"
              name="Visites"
              stroke={PALETTE_CATEGORIELLE[0]}
              strokeWidth={2}
              dot={donnees.length <= 31}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
