import { useState, type JSX } from 'react'
import { Button } from '@renderer/components/ui/button'
import { ImportScreen } from '@renderer/screens/Import/ImportScreen'
import { LignesACorrigerScreen } from '@renderer/screens/Import/LignesACorrigerScreen'
import { ParametresGate } from './ParametresGate'
import { SectionGeneral } from './SectionGeneral'
import { SectionMotifs } from './SectionMotifs'
import { SectionHistoriqueImports } from './SectionHistoriqueImports'
import { SectionSecurite } from './SectionSecurite'

type Onglet = 'general' | 'motifs' | 'import' | 'lignesACorriger' | 'historique' | 'securite'

const ONGLETS: { cle: Onglet; libelle: string }[] = [
  { cle: 'general', libelle: 'General' },
  { cle: 'motifs', libelle: 'Motifs' },
  { cle: 'import', libelle: 'Import Syracuse' },
  { cle: 'lignesACorriger', libelle: 'Lignes a corriger' },
  { cle: 'historique', libelle: 'Historique des imports' },
  { cle: 'securite', libelle: 'Securite' }
]

export function ParametresScreen(): JSX.Element {
  return (
    <ParametresGate>
      <ParametresContenu />
    </ParametresGate>
  )
}

function ParametresContenu(): JSX.Element {
  const [onglet, setOnglet] = useState<Onglet>('general')

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold">Parametres</h1>

      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        {ONGLETS.map((o) => (
          <Button key={o.cle} size="sm" variant={onglet === o.cle ? 'default' : 'ghost'} onClick={() => setOnglet(o.cle)}>
            {o.libelle}
          </Button>
        ))}
      </div>

      {onglet === 'general' && <SectionGeneral />}
      {onglet === 'motifs' && <SectionMotifs />}
      {onglet === 'import' && (
        <div className="-mx-8">
          <ImportScreen onVoirLignesACorriger={() => setOnglet('lignesACorriger')} />
        </div>
      )}
      {onglet === 'lignesACorriger' && (
        <div className="-mx-8">
          <LignesACorrigerScreen onRetour={() => setOnglet('import')} />
        </div>
      )}
      {onglet === 'historique' && <SectionHistoriqueImports />}
      {onglet === 'securite' && <SectionSecurite />}
    </div>
  )
}
