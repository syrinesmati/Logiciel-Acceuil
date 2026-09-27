import { useEffect, useState, type JSX } from 'react'
import { CheckCircle2 } from 'lucide-react'
import type { AbonnePourFiche, Motif } from '@shared/accueil'
import { EcranScan } from './EcranScan'
import { AvertissementDoubleScan } from './AvertissementDoubleScan'
import { FicheAbonne } from './FicheAbonne'
import { FormulaireInscriptionRapide } from './FormulaireInscriptionRapide'
import { FormulaireNonAbonne } from './FormulaireNonAbonne'
import { RechercheParNomDialog } from './RechercheParNomDialog'
import { SaisieCinDialog } from './SaisieCinDialog'
import { useRetourAutomatique } from './useRetourAutomatique'

type Etat =
  | { nom: 'scan' }
  | { nom: 'confirmationDoubleScan'; abonne: AbonnePourFiche; derniereVisite: string | null }
  | { nom: 'fiche'; abonne: AbonnePourFiche }
  | { nom: 'inscriptionRapide'; numeroAbonne: string }
  | { nom: 'inscriptionNonAbonne'; cin: string }
  | { nom: 'confirmationVisite' }

const DELAI_RETOUR_AUTO_PAR_DEFAUT_MS = 30_000

export function AccueilScreen(): JSX.Element {
  const [etat, setEtat] = useState<Etat>({ nom: 'scan' })
  const [motifs, setMotifs] = useState<Motif[]>([])
  const [compteurAujourdhui, setCompteurAujourdhui] = useState(0)
  const [chargement, setChargement] = useState(false)
  const [erreurInscription, setErreurInscription] = useState<string | null>(null)
  const [rechercheOuverte, setRechercheOuverte] = useState(false)
  const [cinDialogOuvert, setCinDialogOuvert] = useState(false)
  const [delaiRetourAutoMs, setDelaiRetourAutoMs] = useState(DELAI_RETOUR_AUTO_PAR_DEFAUT_MS)

  useEffect(() => {
    window.api.accueil.listerMotifs().then(setMotifs)
    window.api.accueil.compteurAujourdhui().then(setCompteurAujourdhui)
    window.api.accueil
      .obtenirParametres()
      .then((p) => setDelaiRetourAutoMs(p.delaiRetourAutoSecondes * 1000))
  }, [])

  useRetourAutomatique(etat.nom !== 'scan' && etat.nom !== 'confirmationVisite', delaiRetourAutoMs, () => {
    setEtat({ nom: 'scan' })
    setRechercheOuverte(false)
  })

  async function traiterNumero(numero: string, mode: 'abonne' | 'cin' = 'abonne'): Promise<void> {
    setChargement(true)
    try {
      const resultat = await window.api.accueil.rechercherNumero(numero)
      if (!resultat.trouve || !resultat.abonne) {
        setEtat(mode === 'cin' ? { nom: 'inscriptionNonAbonne', cin: numero } : { nom: 'inscriptionRapide', numeroAbonne: numero })
        return
      }
      if (resultat.avertissementDoubleScan) {
        setEtat({
          nom: 'confirmationDoubleScan',
          abonne: resultat.abonne,
          derniereVisite: resultat.derniereVisite ?? null
        })
      } else {
        setEtat({ nom: 'fiche', abonne: resultat.abonne })
      }
    } finally {
      setChargement(false)
    }
  }

  async function handleSelectionRecherche(abonne: AbonnePourFiche): Promise<void> {
    setRechercheOuverte(false)
    await traiterNumero(abonne.numeroAbonne)
  }

  async function handleValiderCin(cin: string): Promise<void> {
    setCinDialogOuvert(false)
    await traiterNumero(cin, 'cin')
  }

  async function handleCompleterSexe(sexe: 'H' | 'F'): Promise<void> {
    if (etat.nom !== 'fiche') return
    const abonne = await window.api.accueil.completerSexe({ abonneId: etat.abonne.id, sexe })
    setEtat({ nom: 'fiche', abonne })
  }

  async function handleValiderVisite(motifIds: number[]): Promise<void> {
    if (etat.nom !== 'fiche') return
    setChargement(true)
    try {
      const { compteurAujourdhui: nouveauCompteur } = await window.api.accueil.enregistrerVisite({
        abonneId: etat.abonne.id,
        motifIds
      })
      setCompteurAujourdhui(nouveauCompteur)
      setEtat({ nom: 'confirmationVisite' })
      setTimeout(() => setEtat({ nom: 'scan' }), 1400)
    } finally {
      setChargement(false)
    }
  }

  async function handleInscriptionRapide(donnees: {
    nomComplet: string
    dateNaissance: string | null
    sexe: 'H' | 'F' | null
    telephone: string | null
  }): Promise<void> {
    if (etat.nom !== 'inscriptionRapide') return
    setChargement(true)
    setErreurInscription(null)
    try {
      const resultat = await window.api.accueil.inscrireRapide({
        numeroAbonne: etat.numeroAbonne,
        ...donnees
      })
      if (resultat.succes) {
        setEtat({ nom: 'fiche', abonne: resultat.abonne })
      } else {
        setErreurInscription(resultat.erreur)
      }
    } finally {
      setChargement(false)
    }
  }

  async function handleInscriptionNonAbonne(donnees: {
    nomComplet: string
    dateNaissance: string | null
    sexe: 'H' | 'F' | null
  }): Promise<void> {
    if (etat.nom !== 'inscriptionNonAbonne') return
    setChargement(true)
    setErreurInscription(null)
    try {
      const resultat = await window.api.accueil.inscrireNonAbonne({
        cin: etat.cin,
        ...donnees
      })
      if (resultat.succes) {
        setEtat({ nom: 'fiche', abonne: resultat.abonne })
      } else {
        setErreurInscription(resultat.erreur)
      }
    } finally {
      setChargement(false)
    }
  }

  function retourScan(): void {
    setEtat({ nom: 'scan' })
    setErreurInscription(null)
  }

  return (
    <div className="relative min-h-full">
      {etat.nom === 'scan' && (
        <EcranScan
          compteurAujourdhui={compteurAujourdhui}
          chargement={chargement}
          focusActif={!rechercheOuverte && !cinDialogOuvert}
          onScanner={traiterNumero}
          onOuvrirRecherche={() => setRechercheOuverte(true)}
          onOuvrirCin={() => setCinDialogOuvert(true)}
        />
      )}

      {etat.nom === 'confirmationDoubleScan' && (
        <AvertissementDoubleScan
          abonne={etat.abonne}
          derniereVisite={etat.derniereVisite}
          onAnnuler={retourScan}
          onContinuer={() => setEtat({ nom: 'fiche', abonne: etat.abonne })}
        />
      )}

      {etat.nom === 'fiche' && (
        <FicheAbonne
          abonne={etat.abonne}
          motifs={motifs}
          chargement={chargement}
          onCompleterSexe={handleCompleterSexe}
          onValider={handleValiderVisite}
          onAnnuler={retourScan}
        />
      )}

      {etat.nom === 'inscriptionRapide' && (
        <FormulaireInscriptionRapide
          numeroAbonne={etat.numeroAbonne}
          chargement={chargement}
          erreur={erreurInscription}
          onValider={handleInscriptionRapide}
          onAnnuler={retourScan}
        />
      )}

      {etat.nom === 'inscriptionNonAbonne' && (
        <FormulaireNonAbonne
          cin={etat.cin}
          chargement={chargement}
          erreur={erreurInscription}
          onValider={handleInscriptionNonAbonne}
          onAnnuler={retourScan}
        />
      )}

      {etat.nom === 'confirmationVisite' && (
        <div className="flex min-h-full flex-col items-center justify-center gap-4">
          <CheckCircle2 className="h-24 w-24 text-emerald-500" />
          <p className="text-2xl font-semibold">Visite enregistrée</p>
        </div>
      )}

      {rechercheOuverte && (
        <RechercheParNomDialog
          onFermer={() => setRechercheOuverte(false)}
          onSelectionner={handleSelectionRecherche}
        />
      )}

      {cinDialogOuvert && (
        <SaisieCinDialog onFermer={() => setCinDialogOuvert(false)} onValider={handleValiderCin} />
      )}
    </div>
  )
}
