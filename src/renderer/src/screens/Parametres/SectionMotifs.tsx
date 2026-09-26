import { useEffect, useState, type JSX } from 'react'
import { GripVertical, ChevronUp, ChevronDown, Plus } from 'lucide-react'
import type { MotifAdmin } from '@shared/parametres'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Select } from '@renderer/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@renderer/components/ui/card'
import { ICONES_DISPONIBLES, obtenirIcone } from '@renderer/lib/icones'

export function SectionMotifs(): JSX.Element {
  const [motifs, setMotifs] = useState<MotifAdmin[]>([])
  const [nouveauLibelle, setNouveauLibelle] = useState('')
  const [nouvelleIcone, setNouvelleIcone] = useState(ICONES_DISPONIBLES[0]!)
  const [nouvelleCouleur, setNouvelleCouleur] = useState('#2563eb')
  const [indexGlisse, setIndexGlisse] = useState<number | null>(null)

  function recharger(): void {
    window.api.parametres.listerMotifs().then(setMotifs)
  }

  useEffect(recharger, [])

  async function handleModifier(id: number, patch: Partial<MotifAdmin>): Promise<void> {
    setMotifs((prec) => prec.map((m) => (m.id === id ? { ...m, ...patch } : m)))
    const motif = motifs.find((m) => m.id === id)
    if (!motif) return
    await window.api.parametres.modifierMotif({
      id,
      libelle: patch.libelle ?? motif.libelle,
      icone: patch.icone ?? motif.icone,
      couleur: patch.couleur ?? motif.couleur
    })
  }

  async function handleBasculerActif(motif: MotifAdmin): Promise<void> {
    const majour = await window.api.parametres.activerMotif({ id: motif.id, actif: !motif.actif })
    setMotifs((prec) => prec.map((m) => (m.id === motif.id ? majour : m)))
  }

  async function handleAjouter(): Promise<void> {
    if (!nouveauLibelle.trim()) return
    const cree = await window.api.parametres.creerMotif({
      libelle: nouveauLibelle.trim(),
      icone: nouvelleIcone,
      couleur: nouvelleCouleur
    })
    setMotifs((prec) => [...prec, cree])
    setNouveauLibelle('')
  }

  async function appliquerNouvelOrdre(nouvelleListe: MotifAdmin[]): Promise<void> {
    setMotifs(nouvelleListe)
    await window.api.parametres.reordonnerMotifs(nouvelleListe.map((m) => m.id))
    recharger()
  }

  function deplacer(index: number, direction: -1 | 1): void {
    const cible = index + direction
    if (cible < 0 || cible >= motifs.length) return
    const copie = [...motifs]
    ;[copie[index], copie[cible]] = [copie[cible]!, copie[index]!]
    void appliquerNouvelOrdre(copie)
  }

  function handleDrop(indexCible: number): void {
    if (indexGlisse === null || indexGlisse === indexCible) return
    const copie = [...motifs]
    const [deplace] = copie.splice(indexGlisse, 1)
    copie.splice(indexCible, 0, deplace!)
    setIndexGlisse(null)
    void appliquerNouvelOrdre(copie)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Motifs de visite</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {motifs.map((motif, index) => {
          const Icone = obtenirIcone(motif.icone)
          return (
            <div
              key={motif.id}
              draggable
              onDragStart={() => setIndexGlisse(index)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(index)}
              className={`flex items-center gap-2 rounded-lg border border-border p-3 ${motif.actif ? '' : 'opacity-50'}`}
            >
              <GripVertical className="h-5 w-5 shrink-0 cursor-grab text-muted-foreground" />
              <div className="flex flex-col">
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deplacer(index, -1)}>
                  <ChevronUp className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deplacer(index, 1)}>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </div>

              <Icone className="h-6 w-6 shrink-0" style={{ color: motif.couleur }} />

              <Input
                className="w-48"
                value={motif.libelle}
                onChange={(e) => void handleModifier(motif.id, { libelle: e.target.value })}
              />

              <Select
                className="w-40"
                value={motif.icone}
                onChange={(e) => void handleModifier(motif.id, { icone: e.target.value })}
              >
                {ICONES_DISPONIBLES.map((nom) => (
                  <option key={nom} value={nom}>
                    {nom}
                  </option>
                ))}
              </Select>

              <input
                type="color"
                value={motif.couleur}
                onChange={(e) => void handleModifier(motif.id, { couleur: e.target.value })}
                className="h-9 w-12 cursor-pointer rounded border border-input"
              />

              <Button
                variant={motif.actif ? 'outline' : 'default'}
                size="sm"
                className="ml-auto"
                onClick={() => void handleBasculerActif(motif)}
              >
                {motif.actif ? 'Desactiver' : 'Activer'}
              </Button>
            </div>
          )
        })}

        <div className="mt-4 flex items-end gap-2 border-t border-border pt-4">
          <label className="flex flex-col gap-1 text-sm">
            <span>Nouveau motif</span>
            <Input
              value={nouveauLibelle}
              onChange={(e) => setNouveauLibelle(e.target.value)}
              placeholder="Libelle"
            />
          </label>
          <Select className="w-40" value={nouvelleIcone} onChange={(e) => setNouvelleIcone(e.target.value)}>
            {ICONES_DISPONIBLES.map((nom) => (
              <option key={nom} value={nom}>
                {nom}
              </option>
            ))}
          </Select>
          <input
            type="color"
            value={nouvelleCouleur}
            onChange={(e) => setNouvelleCouleur(e.target.value)}
            className="h-10 w-12 cursor-pointer rounded border border-input"
          />
          <Button onClick={() => void handleAjouter()} disabled={!nouveauLibelle.trim()}>
            <Plus className="h-4 w-4" />
            Ajouter
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
