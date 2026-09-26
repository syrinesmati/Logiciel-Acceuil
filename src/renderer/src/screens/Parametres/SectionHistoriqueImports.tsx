import { useEffect, useState, type JSX } from 'react'
import type { HistoriqueImport } from '@shared/import'
import { Card, CardContent, CardHeader, CardTitle } from '@renderer/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@renderer/components/ui/table'

export function SectionHistoriqueImports(): JSX.Element {
  const [historique, setHistorique] = useState<HistoriqueImport[] | null>(null)

  useEffect(() => {
    window.api.import.listerHistorique().then(setHistorique)
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historique des imports</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Fichier</TableHead>
              <TableHead>Crees</TableHead>
              <TableHead>Mis a jour</TableHead>
              <TableHead>Corriges</TableHead>
              <TableHead>Rejetes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {historique?.map((imp) => (
              <TableRow key={imp.id}>
                <TableCell>{new Date(imp.date).toLocaleString('fr-FR')}</TableCell>
                <TableCell>{imp.nomFichier}</TableCell>
                <TableCell>{imp.nbCrees}</TableCell>
                <TableCell>{imp.nbMisAJour}</TableCell>
                <TableCell>{imp.nbCorriges}</TableCell>
                <TableCell>{imp.nbRejetes}</TableCell>
              </TableRow>
            ))}
            {historique?.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  Aucun import effectue pour le moment.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
