import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, FileText, Plus, Send, Trash2 } from 'lucide-react'
import { Page, PageHeader } from '@/components/layout/PageLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Field } from '@/components/ui/Field'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { EmptyState } from '@/components/ui/EmptyState'
import { FactNav } from '@/components/facturation/FactNav'
import { useFacturation, type BrouillonFacture } from '@/context/FacturationContext'
import { useToast } from '@/context/ToastContext'
import { grillesInitiales, ligneHT, type LigneFacture } from '@/lib/facturation'
import { formatMoney, toInputDate, uid } from '@/lib/utils'

const arrondi = (n: number) => Math.round(n * 100) / 100

function ligneVide(): LigneFacture {
  return { id: uid('lf'), produitId: null, designation: '', quantite: 1, unite: 'unité', prixHT: 0, tva: 20, remise: 0 }
}

export function FactureForm({ mode }: { mode: 'creation' | 'modification' | 'avoir' }) {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { factureParId, clients, produits, modeles, grilles, prochainNumero, creerFacture, modifierFacture, creerAvoir, envoyer } =
    useFacturation()

  const source = mode === 'creation' ? undefined : factureParId(id)
  const avoir = mode === 'avoir'

  const modeleDefaut = modeles.find((m) => m.defaut)?.id ?? modeles[0]?.id ?? ''
  const aujourdhui = new Date().toISOString().slice(0, 10)

  const [clientId, setClientId] = useState(source?.clientId ?? clients[0]?.id ?? '')
  const [modeleId, setModeleId] = useState(source?.modeleId ?? modeleDefaut)
  const [date, setDate] = useState(toInputDate(source?.date ?? new Date().toISOString()))
  const [echeance, setEcheance] = useState(
    toInputDate(source?.echeance ?? new Date(Date.now() + 30 * 86400000).toISOString()),
  )
  const [objet, setObjet] = useState(avoir ? `Avoir sur la facture ${source?.numero ?? ''}` : (source?.objet ?? ''))
  const [reference, setReference] = useState(avoir ? (source?.numero ?? '') : (source?.reference ?? ''))
  const [notes, setNotes] = useState(source?.notes ?? '')
  const [motifAvoir, setMotifAvoir] = useState('')
  const [lignes, setLignes] = useState<LigneFacture[]>(
    mode === 'modification' ? (source?.lignes ?? []) : avoir ? (source?.lignes.map((l) => ({ ...l, id: uid('lav') })) ?? []) : [],
  )
  const [erreurs, setErreurs] = useState<Record<string, string>>({})
  const [erreurGlobale, setErreurGlobale] = useState<string | null>(null)
  const [enCours, setEnCours] = useState(false)

  const client = clients.find((c) => c.id === clientId)
  const grille = grilles.find((g) => g.id === client?.grilleTarifaire) ?? grillesInitiales[0]

  const totalHTCourant = arrondi(lignes.reduce((s, l) => s + ligneHT(l), 0))
  const totalTVACourant = arrondi(lignes.reduce((s, l) => s + ligneHT(l) * (l.tva / 100), 0))
  const totalTTCCourant = arrondi(totalHTCourant + totalTVACourant)

  if (mode !== 'creation' && !source) {
    return (
      <Page header={<PageHeader title="Document introuvable" />}>
        <Card>
          <EmptyState
            icon={<FileText />}
            title="Ce document n'existe plus"
            description="Il a peut-être été supprimé depuis un autre onglet."
            action={<Button variant="primary" onClick={() => navigate('/facturation/factures')}>Retour aux factures</Button>}
          />
        </Card>
      </Page>
    )
  }

  const majLigne = (ligneId: string, patch: Partial<LigneFacture>) =>
    setLignes((l) => l.map((x) => (x.id === ligneId ? { ...x, ...patch } : x)))

  const ajouterDepuisProduit = (produitId: string) => {
    const p = produits.find((x) => x.id === produitId)
    if (!p) return
    setLignes((l) => [
      ...l,
      {
        id: uid('lf'),
        produitId: p.id,
        designation: p.nom,
        quantite: 1,
        unite: p.unite,
        prixHT: arrondi(p.prixHT * grille.coefficient),
        tva: p.tva,
        remise: 0,
      },
    ])
  }

  const valider = () => {
    const e: Record<string, string> = {}
    if (!clientId) e.clientId = 'Choisissez un client.'
    if (!objet.trim()) e.objet = 'Indiquez l’objet du document.'
    if (!date) e.date = 'Indiquez la date d’émission.'
    if (!echeance) e.echeance = 'Indiquez la date d’échéance.'
    else if (echeance < date) e.echeance = 'L’échéance ne peut pas précéder la date d’émission.'
    if (avoir && lignes.length === 0) e.lignes = 'Un avoir doit porter au moins une ligne.'
    if (lignes.some((l) => !l.designation.trim())) e.lignes = 'Chaque ligne doit porter une désignation.'
    setErreurs(e)
    return Object.keys(e).length === 0
  }

  const enregistrer = async (puisEnvoyer: boolean) => {
    if (!valider()) return
    setErreurGlobale(null)
    setEnCours(true)
    try {
      if (avoir) {
        const nouveau = await creerAvoir(source!.id, lignes, motifAvoir)
        toast({ titre: 'Avoir créé', detail: `${nouveau.numero} adossé à ${source!.numero}.`, tone: 'success' })
        navigate(`/facturation/factures/${nouveau.id}`)
        return
      }

      const donnees: BrouillonFacture = {
        type: 'facture',
        clientId,
        modeleId,
        date: new Date(date).toISOString(),
        echeance: new Date(echeance).toISOString(),
        objet: objet.trim(),
        reference: reference.trim(),
        lignes,
        notes,
        factureOrigineId: null,
      }

      if (mode === 'creation') {
        const creee = await creerFacture(donnees)
        if (puisEnvoyer) await envoyer(creee.id)
        toast({
          titre: puisEnvoyer ? 'Facture créée et envoyée' : 'Brouillon enregistré',
          detail: `${creee.numero} — ${formatMoney(totalTTCCourant)} TTC.`,
          tone: 'success',
        })
        navigate(`/facturation/factures/${creee.id}`)
      } else {
        await modifierFacture(source!.id, donnees)
        if (puisEnvoyer) await envoyer(source!.id)
        toast({
          titre: puisEnvoyer ? 'Facture envoyée' : 'Modifications enregistrées',
          detail: `${source!.numero} — ${formatMoney(totalTTCCourant)} TTC.`,
          tone: 'success',
        })
        navigate(`/facturation/factures/${source!.id}`)
      }
    } catch (err) {
      setErreurGlobale((err as Error).message)
      toast({ titre: 'Enregistrement impossible', detail: (err as Error).message, tone: 'danger' })
    } finally {
      setEnCours(false)
    }
  }

  const titre =
    mode === 'creation' ? 'Nouvelle facture' : avoir ? `Créer un avoir sur ${source!.numero}` : `Modifier ${source!.numero}`

  return (
    <Page
      header={
        <PageHeader
          eyebrow="Facturation"
          title={titre}
          description={
            avoir
              ? "L'avoir reprend les lignes à créditer. Ajustez les quantités pour un avoir partiel."
              : `Le document sera numéroté ${mode === 'creation' ? prochainNumero('facture') : source!.numero}. Un brouillon peut être enregistré incomplet.`
          }
          actions={
            <Button
              onClick={() => navigate(mode === 'creation' ? '/facturation/factures' : `/facturation/factures/${id}`)}
              iconLeft={<ArrowLeft aria-hidden className="h-4 w-4" />}
            >
              Annuler
            </Button>
          }
        />
      }
    >
      <FactNav />

      {erreurGlobale && (
        <Alert tone="danger" titre="Enregistrement impossible">
          {erreurGlobale} Vos saisies sont conservées.
        </Alert>
      )}

      {avoir && source && (
        <Alert tone="neutral" titre={`Avoir adossé à ${source.numero}`}>
          Le numéro d'avoir sera {prochainNumero('avoir')}. La facture d'origine reste inchangée : l'avoir vient s'y
          adosser, conformément aux règles de facturation.
        </Alert>
      )}

      <Card>
        <CardHeader title="En-tête" />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Field label="Client" required error={erreurs.clientId}>
            {(p) => (
              <Select
                {...p}
                value={clientId}
                disabled={avoir}
                onChange={(e) => {
                  setClientId(e.target.value)
                  const c = clients.find((x) => x.id === e.target.value)
                  if (c) setEcheance(new Date(Date.now() + c.delaiPaiement * 86400000).toISOString().slice(0, 10))
                }}
                options={clients.map((c) => ({ value: c.id, label: c.nom }))}
              />
            )}
          </Field>
          <Field label="Modèle de facture" hint="Détermine les mentions et conditions imprimées.">
            {(p) => (
              <Select
                {...p}
                value={modeleId}
                onChange={(e) => setModeleId(e.target.value)}
                options={modeles.filter((m) => m.actif).map((m) => ({ value: m.id, label: m.nom }))}
              />
            )}
          </Field>
          <Field label="Objet" required error={erreurs.objet} className="sm:col-span-2">
            {(p) => <Input {...p} value={objet} onChange={(e) => setObjet(e.target.value)} placeholder="Location de salle et régie" />}
          </Field>
          <Field label="Date d’émission" required error={erreurs.date}>
            {(p) => <Input {...p} type="date" value={date} onChange={(e) => setDate(e.target.value)} />}
          </Field>
          <Field label="Échéance" required error={erreurs.echeance} hint={client ? `Délai contractuel : ${client.delaiPaiement} jours.` : undefined}>
            {(p) => <Input {...p} type="date" value={echeance} onChange={(e) => setEcheance(e.target.value)} />}
          </Field>
          <Field label="Référence" hint="Bon de commande ou numéro d’engagement.">
            {(p) => <Input {...p} value={reference} onChange={(e) => setReference(e.target.value)} placeholder="BC-742" />}
          </Field>
          {avoir ? (
            <Field label="Motif de l’avoir" required className="sm:col-span-2">
              {(p) => <Textarea {...p} rows={2} value={motifAvoir} onChange={(e) => setMotifAvoir(e.target.value)} placeholder="Prestation partiellement annulée par le client." />}
            </Field>
          ) : (
            <Field label="Note interne" className="sm:col-span-2" hint="Non imprimée sur le document.">
              {(p) => <Textarea {...p} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Convention signée en annexe." />}
            </Field>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Lignes"
          description={
            client
              ? `Grille appliquée : ${grille.nom}${grille.coefficient !== 1 ? ` (coefficient ${grille.coefficient})` : ''}.`
              : 'Choisissez d’abord un client.'
          }
          action={
            <div className="flex items-center gap-2">
              <Select
                aria-label="Ajouter une prestation du catalogue"
                value=""
                onChange={(e) => e.target.value && ajouterDepuisProduit(e.target.value)}
                placeholder="Depuis le catalogue…"
                className="h-8 w-56 text-[0.8125rem]"
                options={produits.filter((p) => p.actif).map((p) => ({ value: p.id, label: `${p.nom} — ${p.prixHT} €` }))}
              />
              <Button size="sm" onClick={() => setLignes((l) => [...l, ligneVide()])} iconLeft={<Plus aria-hidden className="h-3.5 w-3.5" />}>
                Ligne libre
              </Button>
            </div>
          }
        />
        <CardBody className="flex flex-col gap-3">
          {erreurs.lignes && (
            <p role="alert" className="rounded-lg border border-danger-100 bg-danger-50 p-2.5 text-[0.8125rem] text-danger-700">
              {erreurs.lignes}
            </p>
          )}

          {lignes.length === 0 ? (
            <div className="rounded-lg border border-dashed border-ink-300 bg-ink-25 px-4 py-8 text-center">
              <p className="text-[0.8125rem] font-medium text-ink-800">Aucune ligne pour l’instant</p>
              <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-ink-500">
                Une facture sans ligne peut être enregistrée en brouillon, mais ne pourra pas être envoyée au client.
                Ajoutez une prestation du catalogue ou une ligne libre.
              </p>
            </div>
          ) : (
            lignes.map((l, i) => (
              <div key={l.id} className="grid gap-2 rounded-lg border border-ink-200 p-3 lg:grid-cols-[minmax(0,3fr)_5rem_6rem_5rem_5rem_auto] lg:items-end">
                <Field label={`Désignation de la ligne ${i + 1}`} className="[&>div>label]:sr-only">
                  {(p) => <Input {...p} value={l.designation} onChange={(e) => majLigne(l.id, { designation: e.target.value })} placeholder="Désignation" />}
                </Field>
                <Field label={`Quantité ligne ${i + 1}`} className="[&>div>label]:sr-only">
                  {(p) => <Input {...p} type="number" min={0} step="0.5" value={String(l.quantite)} onChange={(e) => majLigne(l.id, { quantite: Number(e.target.value) || 0 })} placeholder="Qté" />}
                </Field>
                <Field label={`Prix unitaire ligne ${i + 1}`} className="[&>div>label]:sr-only">
                  {(p) => <Input {...p} type="number" min={0} step="0.01" suffix="€" value={String(l.prixHT)} onChange={(e) => majLigne(l.id, { prixHT: Number(e.target.value) || 0 })} />}
                </Field>
                <Field label={`Remise ligne ${i + 1}`} className="[&>div>label]:sr-only">
                  {(p) => <Input {...p} type="number" min={0} max={100} suffix="%" value={String(l.remise)} onChange={(e) => majLigne(l.id, { remise: Number(e.target.value) || 0 })} />}
                </Field>
                <Field label={`TVA ligne ${i + 1}`} className="[&>div>label]:sr-only">
                  {(p) => (
                    <Select
                      {...p}
                      value={String(l.tva)}
                      onChange={(e) => majLigne(l.id, { tva: Number(e.target.value) })}
                      options={[0, 5.5, 10, 20].map((t) => ({ value: String(t), label: `${t} %` }))}
                    />
                  )}
                </Field>
                <div className="flex items-center gap-2">
                  <span className="ac-num min-w-[5rem] text-right text-[0.8125rem] font-medium text-ink-900">{formatMoney(ligneHT(l))}</span>
                  <Button
                    variant="icon"
                    label={`Supprimer la ligne ${i + 1}`}
                    onClick={() => setLignes((x) => x.filter((y) => y.id !== l.id))}
                    className="text-ink-500 hover:text-danger-600"
                  >
                    <Trash2 aria-hidden className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}

          <div className="flex flex-wrap items-center justify-end gap-x-8 gap-y-2 rounded-lg border border-ink-200 bg-ink-25 p-3 text-[0.8125rem]">
            <span className="ac-num text-ink-600">
              Total HT <strong className="text-ink-900">{formatMoney(totalHTCourant)}</strong>
            </span>
            <span className="ac-num text-ink-600">
              TVA <strong className="text-ink-900">{formatMoney(totalTVACourant)}</strong>
            </span>
            <span className="ac-num text-ink-600">
              Total TTC <strong className="text-ink-900">{formatMoney(totalTTCCourant)}</strong>
            </span>
          </div>
        </CardBody>
      </Card>

      <div className="sticky bottom-0 flex flex-wrap items-center justify-end gap-2 border-t border-ink-200 bg-white/90 px-1 py-3 backdrop-blur">
        <p aria-live="polite" className="mr-auto text-[0.8125rem] text-ink-500">
          {enCours
            ? 'Enregistrement en cours…'
            : lignes.length === 0
              ? 'Sans ligne, le document ne pourra pas être envoyé.'
              : `${lignes.length} ligne(s) · ${formatMoney(totalTTCCourant)} TTC`}
        </p>
        <Button variant="ghost" onClick={() => navigate('/facturation/factures')} disabled={enCours}>
          Annuler
        </Button>
        {!avoir && (
          <Button loading={enCours} onClick={() => void enregistrer(false)}>
            Enregistrer en brouillon
          </Button>
        )}
        <Button
          variant="primary"
          loading={enCours}
          disabled={!avoir && lignes.length === 0}
          onClick={() => void enregistrer(!avoir)}
          iconLeft={avoir ? undefined : <Send aria-hidden className="h-4 w-4" />}
        >
          {avoir ? 'Créer l’avoir' : 'Enregistrer et envoyer'}
        </Button>
      </div>
    </Page>
  )
}
