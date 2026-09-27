import type { JSX } from 'react'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { MotifParTrancheAge } from '@shared/stats'
import { Card, CardContent, CardHeader, CardTitle } from '@renderer/components/ui/card'

export function GraphiqueMotifParTrancheAge({ donnees }: { donnees: MotifParTrancheAge[] }): JSX.Element {
  const motifsConnus = new Map<number, { libelle: string; couleur: string }>()
  for (const tranche of donnees) {
    for (const motif of tranche.parMotif) {
      if (!motifsConnus.has(motif.motifId)) motifsConnus.set(motif.motifId, { libelle: motif.libelle, couleur: motif.couleur })
    }
  }
  const motifs = [...motifsConnus.entries()].map(([motifId, m]) => ({ motifId, ...m }))

  const donneesGraphique = donnees.map((tranche) => {
    const ligne: Record<string, string | number> = { libelle: tranche.trancheLibelle }
    for (const motif of motifs) {
      ligne[motif.libelle] = tranche.parMotif.find((m) => m.motifId === motif.motifId)?.nombre ?? 0
    }
    return ligne
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Motifs par tranche d&apos;age</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={donneesGraphique} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e1e0d9" vertical={false} />
            <XAxis dataKey="libelle" tick={{ fontSize: 12, fill: '#898781' }} axisLine={{ stroke: '#c3c2b7' }} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#898781' }} axisLine={false} tickLine={false} width={32} />
            <Tooltip />
            <Legend />
            {motifs.map((motif) => (
              <Bar key={motif.motifId} dataKey={motif.libelle} stackId="motifs" fill={motif.couleur} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
