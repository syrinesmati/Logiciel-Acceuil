import type { JSX } from 'react'
import type { AbonneAssidu } from '@shared/stats'
import { Card, CardContent, CardHeader, CardTitle } from '@renderer/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@renderer/components/ui/table'

export function TableTopAbonnes({ donnees }: { donnees: AbonneAssidu[] }): JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top 10 des abonnes les plus assidus</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Nom</TableHead>
              <TableHead>Numero</TableHead>
              <TableHead className="text-right">Visites</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {donnees.map((abonne, index) => (
              <TableRow key={abonne.abonneId}>
                <TableCell className="font-mono text-muted-foreground">{index + 1}</TableCell>
                <TableCell dir="auto">{abonne.nomComplet}</TableCell>
                <TableCell className="font-mono">{abonne.numeroAbonne}</TableCell>
                <TableCell className="text-right font-semibold">{abonne.nbVisites}</TableCell>
              </TableRow>
            ))}
            {donnees.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                  Aucune visite sur cette periode.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
