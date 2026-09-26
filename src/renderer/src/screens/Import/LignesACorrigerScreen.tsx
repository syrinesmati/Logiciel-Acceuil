import { useEffect, useState, type JSX } from 'react'
import type { LigneACorriger } from '@shared/import'
import { Button } from '@renderer/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@renderer/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@renderer/components/ui/table'
import { Dialog } from '@renderer/components/ui/dialog'
import { Input } from '@renderer/components/ui/input'

interface Props {
  onRetour: () => void
}

function texteLigneBrute(ligneBrute: LigneACorriger['ligneBrute']): string {
  return typeof ligneBrute === 'string' ? ligneBrute : JSON.stringify(ligneBrute)
}

export function LignesACorrigerScreen({ onRetour }: Props): JSX.Element {
  const [lignes, setLignes] = useState<LigneACorriger[]>([])
  const [chargement, setChargement] = useState(true)
  const [ligneEnEdition, setLigneEnEdition] = useState<LigneACorriger | null>(null)

  async function recharger(): Promise<void> {
    setChargement(true)
    const resultat = await window.api.import.listerLignesACorriger()
    setLignes(resultat)
    setChargement(false)
  }

  useEffect(() => {
    void recharger()
  }, [])

  async function handleIgnorer(id: number): Promise<void> {
    await window.api.import.ignorerLigne(id)
    setLignes((prec) => prec.filter((l) => l.id !== id))
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Lignes à corriger</h1>
          <p className="text-muted-foreground">
            Fiches rejetées lors d&apos;un import (numéro introuvable ou en conflit).
          </p>
        </div>
        <Button variant="ghost" onClick={onRetour}>
          ← Retour à l&apos;import
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{chargement ? 'Chargement…' : `${lignes.length} ligne(s) en attente`}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Numéro détecté</TableHead>
                <TableHead>Nom détecté</TableHead>
                <TableHead>Motif</TableHead>
                <TableHead>Ligne source</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lignes.map((ligne) => (
                <TableRow key={ligne.id}>
                  <TableCell className="font-mono">{ligne.numeroAbonneDetecte ?? '—'}</TableCell>
                  <TableCell dir="auto">{ligne.nomDetecte ?? '—'}</TableCell>
                  <TableCell className="max-w-sm text-xs text-destructive">{ligne.motifRejet}</TableCell>
                  <TableCell className="max-w-xs truncate text-xs text-muted-foreground">
                    {texteLigneBrute(ligne.ligneBrute)}
                  </TableCell>
                  <TableCell className="flex justify-end gap-2 text-right">
                    <Button size="sm" onClick={() => setLigneEnEdition(ligne)}>
                      Corriger
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => void handleIgnorer(ligne.id)}>
                      Ignorer
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!chargement && lignes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    Aucune ligne en attente de correction.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {ligneEnEdition && (
        <FormulaireCorrection
          ligne={ligneEnEdition}
          onFermer={() => setLigneEnEdition(null)}
          onSucces={(id) => {
            setLignes((prec) => prec.filter((l) => l.id !== id))
            setLigneEnEdition(null)
          }}
        />
      )}
    </div>
  )
}

function FormulaireCorrection({
  ligne,
  onFermer,
  onSucces
}: {
  ligne: LigneACorriger
  onFermer: () => void
  onSucces: (id: number) => void
}): JSX.Element {
  const [numeroAbonne, setNumeroAbonne] = useState(ligne.numeroAbonneDetecte ?? '')
  const [nomComplet, setNomComplet] = useState(ligne.nomDetecte ?? '')
  const [dateNaissance, setDateNaissance] = useState(ligne.dateNaissanceDetectee ?? '')
  const [telephone, setTelephone] = useState(ligne.telephoneDetecte ?? '')
  const [email, setEmail] = useState(ligne.emailDetecte ?? '')
  const [erreur, setErreur] = useState<string | null>(null)
  const [envoiEnCours, setEnvoiEnCours] = useState(false)

  async function handleValider(): Promise<void> {
    setErreur(null)
    setEnvoiEnCours(true)
    try {
      const resultat = await window.api.import.corrigerLigne({
        id: ligne.id,
        numeroAbonne: numeroAbonne.trim(),
        nomComplet: nomComplet.trim(),
        dateNaissance: dateNaissance.trim() || null,
        telephone: telephone.trim() || null,
        email: email.trim() || null
      })
      if (resultat.succes) {
        onSucces(ligne.id)
      } else {
        setErreur(resultat.erreur)
      }
    } finally {
      setEnvoiEnCours(false)
    }
  }

  return (
    <Dialog
      ouvert
      onFermer={onFermer}
      titre="Corriger la fiche"
      description="Corrigez les champs puis validez. Le numero doit rester unique."
    >
      <div className="flex flex-col gap-3">
        <Champ label="Numéro d'abonné">
          <Input value={numeroAbonne} onChange={(e) => setNumeroAbonne(e.target.value)} />
        </Champ>
        <Champ label="Nom complet">
          <Input dir="auto" value={nomComplet} onChange={(e) => setNomComplet(e.target.value)} />
        </Champ>
        <Champ label="Date de naissance (aaaa-mm-jj)">
          <Input
            placeholder="aaaa-mm-jj"
            value={dateNaissance}
            onChange={(e) => setDateNaissance(e.target.value)}
          />
        </Champ>
        <Champ label="Téléphone">
          <Input value={telephone} onChange={(e) => setTelephone(e.target.value)} />
        </Champ>
        <Champ label="Email">
          <Input value={email} onChange={(e) => setEmail(e.target.value)} />
        </Champ>

        {erreur && <p className="text-sm text-destructive">{erreur}</p>}

        <div className="mt-2 flex justify-end gap-2">
          <Button variant="ghost" onClick={onFermer}>
            Annuler
          </Button>
          <Button onClick={() => void handleValider()} disabled={envoiEnCours || !numeroAbonne || !nomComplet}>
            {envoiEnCours ? 'Enregistrement…' : 'Valider'}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}

function Champ({ label, children }: { label: string; children: JSX.Element }): JSX.Element {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span>{label}</span>
      {children}
    </label>
  )
}
