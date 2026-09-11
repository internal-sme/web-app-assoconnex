import { useRef, useState } from 'react'
import { AlertTriangle, Bold, Italic, Link2, List, ListOrdered, Paperclip, Send, Trash2, Underline } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Input, Select } from '@/components/ui/Input'
import { Checkbox } from '@/components/ui/Toggle'
import { MultiSelect } from '@/components/ui/MultiSelect'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useEmailInterne, type SaisieMessage } from '@/context/EmailInterneContext'
import { useToast } from '@/context/ToastContext'
import {
  correspondants,
  formatTaillePJ,
  rattachementLabels,
  type PieceJointeMail,
  type Rattachement,
  type TypeRattachement,
} from '@/lib/emailInterne'

const SEUIL_DESTINATAIRES = 20

/** Éditeur enrichi produisant du Markdown, comme celui des actions. */
function EditeurCorps({ valeur, onChange }: { valeur: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLTextAreaElement>(null)

  const appliquer = (avant: string, apres = avant, prefixeLigne = false) => {
    const el = ref.current
    if (!el) return
    const debut = el.selectionStart
    const fin = el.selectionEnd
    const selection = valeur.slice(debut, fin)
    const remplacement = prefixeLigne
      ? (selection || 'Élément').split('\n').map((l, i) => `${avant.replace('{n}', String(i + 1))}${l}`).join('\n')
      : `${avant}${selection || 'texte'}${apres}`
    const nouveau = valeur.slice(0, debut) + remplacement + valeur.slice(fin)
    onChange(nouveau)
    window.requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(debut, debut + remplacement.length)
    })
  }

  const outils = [
    { label: 'Gras', icone: Bold, action: () => appliquer('**') },
    { label: 'Italique', icone: Italic, action: () => appliquer('*') },
    { label: 'Souligné', icone: Underline, action: () => appliquer('__') },
    { separateur: true },
    { label: 'Liste à puces', icone: List, action: () => appliquer('- ', '', true) },
    { label: 'Liste numérotée', icone: ListOrdered, action: () => appliquer('{n}. ', '', true) },
    { separateur: true },
    { label: 'Insérer un lien', icone: Link2, action: () => appliquer('[', '](https://)') },
  ] as const

  return (
    <div className="overflow-hidden rounded-lg border border-ink-300 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100">
      <div role="toolbar" aria-label="Mise en forme du message" className="flex items-center gap-0.5 border-b border-ink-200 bg-ink-25 px-1.5 py-1">
        {outils.map((o, i) =>
          'separateur' in o ? (
            <span key={i} aria-hidden className="mx-1 h-4 w-px bg-ink-200" />
          ) : (
            <Button key={o.label} variant="icon" size="sm" label={o.label} onClick={o.action}>
              <o.icone aria-hidden className="h-3.5 w-3.5" />
            </Button>
          ),
        )}
      </div>
      <textarea
        ref={ref}
        value={valeur}
        onChange={(e) => onChange(e.target.value)}
        rows={10}
        aria-label="Corps du message"
        placeholder="Écrivez votre message…"
        className="ac-scroll w-full resize-y bg-white px-3 py-2 text-[0.8125rem] leading-relaxed text-ink-900 outline-none placeholder:text-ink-400"
      />
    </div>
  )
}

export type ValeursComposition = SaisieMessage

export const compositionVide: ValeursComposition = {
  destinatairesIds: [],
  copieIds: [],
  copieCacheeIds: [],
  objet: '',
  corps: '',
  piecesJointes: [],
  rattachement: null,
  important: false,
  accuseDemande: false,
}

const piecesEchantillon = [
  { nom: 'Compte-rendu.pdf', taille: 240_000 },
  { nom: 'Budget-detaille.xlsx', taille: 480_000 },
  { nom: 'Photos-evenement.zip', taille: 18_400_000 },
]

export function FenetreComposition({
  open,
  onClose,
  valeurs,
  onChange,
  titre = 'Nouveau message',
}: {
  open: boolean
  onClose: () => void
  valeurs: ValeursComposition
  onChange: (v: Partial<ValeursComposition>) => void
  titre?: string
}) {
  const { toast } = useToast()
  const { envoyer, enregistrerBrouillon, envoiEnCours, modeles, verifierPieceJointe } = useEmailInterne()
  const [copiesVisibles, setCopiesVisibles] = useState(valeurs.copieIds.length > 0 || valeurs.copieCacheeIds.length > 0)
  const [confirmationMasse, setConfirmationMasse] = useState(false)
  const [abandonOuvert, setAbandonOuvert] = useState(false)
  const [erreurPiece, setErreurPiece] = useState<string | null>(null)

  const total = [...valeurs.destinatairesIds, ...valeurs.copieIds, ...valeurs.copieCacheeIds]
  const modifie = !!(valeurs.objet.trim() || valeurs.corps.trim() || total.length > 0)

  const options = correspondants.map((c) => ({ value: c.id, label: `${c.nom} — ${c.role}` }))

  const partir = async () => {
    try {
      await envoyer(valeurs)
      toast({ titre: 'Message envoyé', detail: `${total.length} destinataire(s).`, tone: 'success' })
      onClose()
    } catch (e) {
      toast({ titre: 'Envoi impossible', detail: (e as Error).message, tone: 'danger' })
    }
  }

  const tenterEnvoi = () => {
    if (total.length > SEUIL_DESTINATAIRES) {
      setConfirmationMasse(true)
      return
    }
    void partir()
  }

  const fermer = () => {
    if (modifie) {
      setAbandonOuvert(true)
      return
    }
    onClose()
  }

  const joindre = (p: { nom: string; taille: number }) => {
    setErreurPiece(null)
    try {
      verifierPieceJointe(p.taille)
      const piece: PieceJointeMail = { id: `pjm-${Date.now()}`, ...p }
      onChange({ piecesJointes: [...valeurs.piecesJointes, piece] })
    } catch (e) {
      setErreurPiece((e as Error).message)
    }
  }

  return (
    <>
      <Modal
        open={open}
        onClose={fermer}
        size="xl"
        title={titre}
        description="Les échanges internes restent entre membres de votre association."
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                void enregistrerBrouillon(valeurs)
                  .then(() => {
                    toast({ titre: 'Brouillon enregistré', detail: 'Vous le retrouverez dans le dossier Brouillons.', tone: 'success' })
                    onClose()
                  })
                  .catch((e) => toast({ titre: 'Action impossible', detail: (e as Error).message, tone: 'danger' }))
              }}
            >
              Enregistrer en brouillon
            </Button>
            <Button variant="primary" loading={envoiEnCours} onClick={tenterEnvoi} iconLeft={<Send aria-hidden className="h-4 w-4" />}>
              Envoyer
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4 py-2">
          <Field
            label="Destinataires"
            required
            hint={total.length > SEUIL_DESTINATAIRES ? `${total.length} destinataires : une confirmation vous sera demandée.` : undefined}
          >
            {(p) => (
              <MultiSelect
                {...p}
                value={valeurs.destinatairesIds}
                onChange={(ids) => onChange({ destinatairesIds: ids })}
                options={options}
                placeholder="Choisir les destinataires"
              />
            )}
          </Field>

          {!copiesVisibles ? (
            <button
              type="button"
              onClick={() => setCopiesVisibles(true)}
              className="self-start text-[0.8125rem] font-medium text-brand-600 underline-offset-2 hover:underline"
            >
              Ajouter une copie ou une copie cachée
            </button>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Copie" hint="Les destinataires voient qui est en copie.">
                {(p) => (
                  <MultiSelect {...p} value={valeurs.copieIds} onChange={(ids) => onChange({ copieIds: ids })} options={options} placeholder="Personne" />
                )}
              </Field>
              <Field label="Copie cachée" hint="Ces personnes reçoivent le message sans que les autres le sachent.">
                {(p) => (
                  <MultiSelect {...p} value={valeurs.copieCacheeIds} onChange={(ids) => onChange({ copieCacheeIds: ids })} options={options} placeholder="Personne" />
                )}
              </Field>
            </div>
          )}

          <Field label="Objet" required>
            {(p) => <Input {...p} value={valeurs.objet} onChange={(e) => onChange({ objet: e.target.value })} placeholder="Convocation — réunion du bureau" />}
          </Field>

          <Field
            label="Message"
            required
            hint="La mise en forme est enregistrée en Markdown."
          >
            {() => <EditeurCorps valeur={valeurs.corps} onChange={(v) => onChange({ corps: v })} />}
          </Field>

          <div className="flex flex-wrap items-center gap-2">
            <Select
              aria-label="Insérer un modèle"
              value=""
              className="h-8 w-56 text-[0.8125rem]"
              placeholder="Insérer un modèle"
              onChange={(e) => {
                const m = modeles.find((x) => x.id === e.target.value)
                if (m) onChange({ objet: valeurs.objet || m.objet, corps: m.corps })
              }}
              options={modeles.map((m) => ({ value: m.id, label: m.nom }))}
            />
            <Select
              aria-label="Joindre un fichier"
              value=""
              className="h-8 w-52 text-[0.8125rem]"
              placeholder="Joindre un fichier"
              onChange={(e) => {
                const p = piecesEchantillon.find((x) => x.nom === e.target.value)
                if (p) joindre(p)
              }}
              options={piecesEchantillon.map((p) => ({ value: p.nom, label: `${p.nom} — ${formatTaillePJ(p.taille)}` }))}
            />
          </div>

          {erreurPiece && (
            <p role="alert" className="flex gap-2 rounded-lg border border-danger-100 bg-danger-50 p-2.5 text-[0.8125rem] leading-relaxed text-danger-700">
              <AlertTriangle aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {erreurPiece}
            </p>
          )}

          {valeurs.piecesJointes.length > 0 && (
            <ul className="flex flex-wrap gap-1.5">
              {valeurs.piecesJointes.map((p) => (
                <li key={p.id} className="flex items-center gap-2 rounded-lg border border-ink-200 bg-ink-25 px-2.5 py-1.5">
                  <Paperclip aria-hidden className="h-3 w-3 text-ink-500" />
                  <span className="text-2xs font-medium text-ink-900">{p.nom}</span>
                  <span className="ac-num text-[0.5rem] text-ink-500">{formatTaillePJ(p.taille)}</span>
                  <button
                    type="button"
                    onClick={() => onChange({ piecesJointes: valeurs.piecesJointes.filter((x) => x.id !== p.id) })}
                    aria-label={`Retirer ${p.nom}`}
                  >
                    <Trash2 aria-hidden className="h-3 w-3 text-ink-500 hover:text-danger-600" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="grid gap-4 border-t border-ink-100 pt-4 sm:grid-cols-2">
            <Field label="Rattacher à un dossier" hint="Le message sera retrouvable depuis la fiche concernée.">
              {(p) => (
                <Select
                  {...p}
                  value={valeurs.rattachement?.type ?? ''}
                  onChange={(e) => {
                    const t = e.target.value as TypeRattachement | ''
                    if (!t) return onChange({ rattachement: null })
                    const exemples: Record<TypeRattachement, Rattachement> = {
                      adherent: { type: 'adherent', libelle: 'Hugo Fournier — adhésion 2026', cible: '/adherents' },
                      facture: { type: 'facture', libelle: 'F-2026-0041 — Coopérative Grand Ouest', cible: '/facturation' },
                      document: { type: 'document', libelle: 'Convention pluriannuelle d’objectifs.pdf', cible: '/documents' },
                    }
                    onChange({ rattachement: exemples[t] })
                  }}
                  placeholder="Aucun rattachement"
                  options={(Object.keys(rattachementLabels) as TypeRattachement[]).map((t) => ({ value: t, label: rattachementLabels[t] }))}
                />
              )}
            </Field>

            <div className="flex flex-col gap-2 pt-6">
              <Checkbox checked={valeurs.important} onChange={(e) => onChange({ important: e.target.checked })} label="Marquer comme important" />
              <Checkbox
                checked={valeurs.accuseDemande}
                onChange={(e) => onChange({ accuseDemande: e.target.checked })}
                label="Demander un accusé de lecture"
              />
            </div>
          </div>

          {valeurs.rattachement && (
            <Badge variant="outline">
              {rattachementLabels[valeurs.rattachement.type]} · {valeurs.rattachement.libelle}
            </Badge>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmationMasse}
        tone="primary"
        loading={envoiEnCours}
        onClose={() => setConfirmationMasse(false)}
        onConfirm={() => {
          setConfirmationMasse(false)
          void partir()
        }}
        title={`Envoyer à ${total.length} destinataires ?`}
        description="Au-delà de vingt destinataires, il s'agit plutôt d'un envoi groupé. Le module Campagne d'emailing gère les consentements et les désinscriptions, ce que l'email interne ne fait pas."
        confirmLabel="Envoyer quand même"
      >
        <div className="rounded-lg border border-warning-100 bg-warning-50 p-3 text-[0.8125rem] text-warning-700">
          Les destinataires verront l'adresse des autres, sauf ceux placés en copie cachée.
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={abandonOuvert}
        onClose={() => setAbandonOuvert(false)}
        onConfirm={() => {
          setAbandonOuvert(false)
          onClose()
        }}
        title="Abandonner ce message ?"
        description="Le message n'a pas été enregistré. Fermer maintenant en perdra le contenu."
        confirmLabel="Abandonner"
      >
        <div className="flex flex-col gap-2">
          <Button
            onClick={() => {
              void enregistrerBrouillon(valeurs)
                .then(() => {
                  toast({ titre: 'Brouillon enregistré', detail: 'Vous le retrouverez dans le dossier Brouillons.', tone: 'success' })
                  setAbandonOuvert(false)
                  onClose()
                })
                .catch((e) => toast({ titre: 'Action impossible', detail: (e as Error).message, tone: 'danger' }))
            }}
          >
            Enregistrer comme brouillon plutôt
          </Button>
        </div>
      </ConfirmDialog>
    </>
  )
}

export { SEUIL_DESTINATAIRES }
