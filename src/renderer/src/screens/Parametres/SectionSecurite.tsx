import { useState, type JSX } from 'react'
import type { ApercuSauvegarde } from '@shared/parametres'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@renderer/components/ui/card'
import { Dialog } from '@renderer/components/ui/dialog'

function DialogueConfirmationRestauration({
  apercu,
  onAnnuler,
  onConfirmer
}: {
  apercu: Extract<ApercuSauvegarde, { valide: true }>
  onAnnuler: () => void
  onConfirmer: () => void
}): JSX.Element {
  const [enCours, setEnCours] = useState(false)

  return (
    <Dialog ouvert onFermer={onAnnuler} titre="Confirmer la restauration" className="max-w-lg">
      <div className="flex flex-col gap-4">
        <p className="text-sm">
          Fichier choisi : <span className="font-mono">{apercu.chemin}</span>
          <br />
          Contient <strong>{apercu.nbAbonnes}</strong> abonnes et <strong>{apercu.nbVisites}</strong> visites.
        </p>
        <p className="text-sm text-destructive">
          Cette action va <strong>remplacer definitivement toutes les donnees actuelles</strong> par celles
          de ce fichier, puis redemarrer l&apos;application. Elle est irreversible.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onAnnuler} disabled={enCours}>
            Annuler
          </Button>
          <Button
            variant="destructive"
            disabled={enCours}
            onClick={() => {
              setEnCours(true)
              onConfirmer()
            }}
          >
            {enCours ? 'Restauration…' : 'Confirmer et redemarrer'}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}

function SectionSauvegarde(): JSX.Element {
  const [enCours, setEnCours] = useState(false)
  const [dernierResultat, setDernierResultat] = useState<{ chemin: string } | { erreur: string } | null>(null)
  const [apercuRestauration, setApercuRestauration] = useState<Extract<ApercuSauvegarde, { valide: true }> | null>(
    null
  )
  const [erreurRestauration, setErreurRestauration] = useState<string | null>(null)

  async function handleSauvegarder(): Promise<void> {
    setEnCours(true)
    setDernierResultat(null)
    try {
      const chemin = await window.api.parametres.sauvegarderMaintenant()
      if (chemin) setDernierResultat({ chemin })
    } catch {
      setDernierResultat({ erreur: 'Echec de la sauvegarde. Reessayez.' })
    } finally {
      setEnCours(false)
    }
  }

  async function handleChoisirFichierRestauration(): Promise<void> {
    setErreurRestauration(null)
    const apercu = await window.api.parametres.choisirFichierSauvegarde()
    if (!apercu) return
    if (!apercu.valide) {
      setErreurRestauration("Ce fichier n'est pas une sauvegarde valide de cette application.")
      return
    }
    setApercuRestauration(apercu)
  }

  function handleConfirmerRestauration(): void {
    if (!apercuRestauration) return
    // L'application se ferme et redemarre juste apres : pas de reponse a attendre ici.
    void window.api.parametres.restaurerSauvegarde(apercuRestauration.chemin)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sauvegarde de la base de donnees</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">
          Une copie automatique est faite chaque jour sur ce PC (dossier de l&apos;application) :
          elle protege contre une corruption ou une fausse manipulation, mais{' '}
          <strong>pas contre une panne du disque ou du PC</strong>. Pensez a faire regulierement
          une sauvegarde manuelle vers une cle USB ou un dossier reseau.
        </p>

        {dernierResultat && 'chemin' in dernierResultat && (
          <p className="text-sm text-emerald-600">Sauvegarde enregistree : {dernierResultat.chemin}</p>
        )}
        {dernierResultat && 'erreur' in dernierResultat && (
          <p className="text-sm text-destructive">{dernierResultat.erreur}</p>
        )}

        <Button className="w-fit" onClick={() => void handleSauvegarder()} disabled={enCours}>
          {enCours ? 'Sauvegarde…' : 'Sauvegarder maintenant…'}
        </Button>

        <div className="mt-2 border-t border-border pt-3">
          <p className="text-sm text-muted-foreground">
            En cas de changement de PC : restaurez ici une sauvegarde prise sur l&apos;ancien poste.
          </p>
          {erreurRestauration && <p className="mt-1 text-sm text-destructive">{erreurRestauration}</p>}
          <Button
            variant="outline"
            className="mt-2 w-fit"
            onClick={() => void handleChoisirFichierRestauration()}
          >
            Restaurer une sauvegarde…
          </Button>
        </div>
      </CardContent>

      {apercuRestauration && (
        <DialogueConfirmationRestauration
          apercu={apercuRestauration}
          onAnnuler={() => setApercuRestauration(null)}
          onConfirmer={handleConfirmerRestauration}
        />
      )}
    </Card>
  )
}

export function SectionSecurite(): JSX.Element {
  const [ancienPin, setAncienPin] = useState('')
  const [nouveauPin, setNouveauPin] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [erreur, setErreur] = useState<string | null>(null)
  const [succes, setSucces] = useState(false)
  const [envoiEnCours, setEnvoiEnCours] = useState(false)

  async function handleChanger(): Promise<void> {
    setErreur(null)
    setSucces(false)
    if (nouveauPin.length < 4) {
      setErreur('Le nouveau code PIN doit comporter au moins 4 chiffres.')
      return
    }
    if (nouveauPin !== confirmation) {
      setErreur('Les deux nouveaux codes PIN ne correspondent pas.')
      return
    }
    setEnvoiEnCours(true)
    try {
      const resultat = await window.api.parametres.changerPin({ ancienPin, nouveauPin })
      if (resultat.succes) {
        setSucces(true)
        setAncienPin('')
        setNouveauPin('')
        setConfirmation('')
      } else {
        setErreur(resultat.erreur)
      }
    } finally {
      setEnvoiEnCours(false)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Changer le code PIN</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span>Code PIN actuel</span>
            <Input
              type="password"
              inputMode="numeric"
              value={ancienPin}
              onChange={(e) => setAncienPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span>Nouveau code PIN</span>
            <Input
              type="password"
              inputMode="numeric"
              value={nouveauPin}
              onChange={(e) => setNouveauPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span>Confirmer le nouveau code PIN</span>
            <Input
              type="password"
              inputMode="numeric"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value.replace(/\D/g, '').slice(0, 6))}
            />
          </label>

          {erreur && <p className="text-sm text-destructive">{erreur}</p>}
          {succes && <p className="text-sm text-emerald-600">Code PIN modifie avec succes.</p>}

          <Button
            className="w-fit"
            onClick={() => void handleChanger()}
            disabled={envoiEnCours || !ancienPin || nouveauPin.length < 4}
          >
            {envoiEnCours ? 'Enregistrement…' : 'Changer le code PIN'}
          </Button>
        </CardContent>
      </Card>

      <SectionSauvegarde />
    </div>
  )
}
