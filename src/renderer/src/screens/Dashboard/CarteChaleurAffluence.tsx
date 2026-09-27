import type { JSX } from 'react'
import type { CelluleAffluence } from '@shared/stats'
import { Card, CardContent, CardHeader, CardTitle } from '@renderer/components/ui/card'
import { couleurSequentielle } from '@renderer/lib/paletteGraphiques'

// jourSemaine cote donnees : 0 = dimanche ... 6 = samedi (JS Date#getDay()).
// Affichage en convention francaise : lundi -> dimanche.
const JOURS_AFFICHES = [
  { jourSemaine: 1, libelle: 'Lun' },
  { jourSemaine: 2, libelle: 'Mar' },
  { jourSemaine: 3, libelle: 'Mer' },
  { jourSemaine: 4, libelle: 'Jeu' },
  { jourSemaine: 5, libelle: 'Ven' },
  { jourSemaine: 6, libelle: 'Sam' },
  { jourSemaine: 0, libelle: 'Dim' }
]

const HEURES = Array.from({ length: 24 }, (_, i) => i)

export function CarteChaleurAffluence({ donnees }: { donnees: CelluleAffluence[] }): JSX.Element {
  const max = Math.max(1, ...donnees.map((d) => d.nombre))
  const parCle = new Map(donnees.map((d) => [`${d.jourSemaine}-${d.heure}`, d.nombre]))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Heures d&apos;affluence</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <div className="inline-grid gap-[2px]" style={{ gridTemplateColumns: `2.5rem repeat(24, 1.6rem)` }}>
          <div />
          {HEURES.map((h) => (
            <div key={h} className="text-center text-[10px] text-muted-foreground">
              {h}
            </div>
          ))}
          {JOURS_AFFICHES.map((jour) => (
            <div key={jour.jourSemaine} className="contents">
              <div className="flex items-center text-xs text-muted-foreground">{jour.libelle}</div>
              {HEURES.map((heure) => {
                const nombre = parCle.get(`${jour.jourSemaine}-${heure}`) ?? 0
                return (
                  <div
                    key={heure}
                    title={`${jour.libelle} ${heure}h : ${nombre} visite(s)`}
                    className="aspect-square rounded-sm"
                    style={{ backgroundColor: nombre === 0 ? '#f0efec' : couleurSequentielle(nombre / max) }}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
