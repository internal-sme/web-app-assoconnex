import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Archive, ArchiveRestore, Check, Trash2 } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Input, Textarea } from '@/components/ui/Input'
import { Switch } from '@/components/ui/Toggle'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { FormulairePage } from '@/components/formulaires/FormulairePage'
import { useFormulaires } from '@/context/FormulairesContext'
import { useToast } from '@/context/ToastContext'
import type { Formulaire, ParametresFormulaire as TypeParametres } from '@/lib/formulaires'

function CorpsParametres({ formulaire }: { formulaire: Formulaire }) {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { mettreAJourParametres, archiver, desarchiver, supprimer } = useFormulaires()

  const [params, setParams] = useState<TypeParametres>(formulaire.parametres)
  const [limiterReponses, setLimiterReponses] = useState(formulaire.parametres.limiteReponses !== null)
  const [limiterDate, setLimiterDate] = useState(formulaire.parametres.dateLimite !== null)
  const [enCours, setEnCours] = useState(false)
  const [aArchiver, setAArchiver] = useState(false)
  const [aSupprimer, setASupprimer] = useState(false)
  const idPrecedent = useRef(formulaire.id)

  useEffect(() => {
    if (idPrecedent.current !== formulaire.id) {
      idPrecedent.current = formulaire.id
      setParams(formulaire.parametres)
      setLimiterReponses(formulaire.parametres.limiteReponses !== null)
      setLimiterDate(formulaire.parametres.dateLimite !== null)
    }
  }, [formulaire])

  const executer = async (fn: () => Promise<void>, succes: { titre: string; detail: string }) => {
    setEnCours(true)
    try {
      await fn()
      toast({ ...succes, tone: 'success' })
    } catch (e) {
      toast({ titre: 'Action impossible', detail: (e as Error).message, tone: 'danger' })
    } finally {
      setEnCours(false)
    }
  }

  const enregistrer = () =>
    void executer(
      () =>
        mettreAJourParametres(formulaire.id, {
          ...params,
          limiteReponses: limiterReponses ? params.limiteReponses ?? 50 : null,
          dateLimite: limiterDate ? params.dateLimite ?? new Date().toISOString().slice(0, 10) : null,
        }),
      { titre: 'Paramètres enregistrés', detail: 'Les nouveaux réglages s’appliquent immédiatement.' },
    )

  const peutSupprimer = formulaire.statut === 'brouillon' || formulaire.statut === 'archive'

  return (
    <>
      <Card>
        <CardHeader title="Réponses" description="Ce qui limite ou encadre la collecte des réponses." />
        <CardBody className="flex flex-col gap-4">
          <Switch
            label="Limiter le nombre de réponses"
            description="Le formulaire se ferme automatiquement une fois le nombre atteint."
            checked={limiterReponses}
            onCheckedChange={setLimiterReponses}
          />
          {limiterReponses && (
            <Field label="Nombre maximal de réponses" className="max-w-xs">
              {(p) => (
                <Input
                  {...p}
                  type="number"
                  min={1}
                  value={String(params.limiteReponses ?? 50)}
                  onChange={(e) => setParams((v) => ({ ...v, limiteReponses: Number(e.target.value) || 1 }))}
                />
              )}
            </Field>
          )}
          <Switch
            label="Fermer automatiquement à une date"
            description="Aucune réponse n'est acceptée après cette date."
            checked={limiterDate}
            onCheckedChange={setLimiterDate}
          />
          {limiterDate && (
            <Field label="Date de fermeture" className="max-w-xs">
              {(p) => (
                <Input
                  {...p}
                  type="date"
                  value={params.dateLimite ?? ''}
                  onChange={(e) => setParams((v) => ({ ...v, dateLimite: e.target.value }))}
                />
              )}
            </Field>
          )}
          <Switch
            label="Une réponse par personne"
            description="Empêche un même répondant de soumettre le formulaire plusieurs fois."
            checked={params.unReponseParPersonne}
            onCheckedChange={(v) => setParams((p) => ({ ...p, unReponseParPersonne: v }))}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Confirmation" description="Ce que voit le répondant une fois sa réponse envoyée." />
        <CardBody className="flex flex-col gap-4">
          <Field label="Message de confirmation">
            {(p) => <Textarea {...p} rows={3} value={params.messageConfirmation} onChange={(e) => setParams((v) => ({ ...v, messageConfirmation: e.target.value }))} />}
          </Field>
          <Field label="Redirection après envoi" hint="Facultatif — laisse vide pour afficher le message ci-dessus.">
            {(p) => <Input {...p} type="url" value={params.redirectionUrl} onChange={(e) => setParams((v) => ({ ...v, redirectionUrl: e.target.value }))} placeholder="https://mon-association.fr/merci" />}
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Notifications" description="Qui est prévenu à chaque nouvelle réponse." />
        <CardBody>
          <Field label="E-mail de notification" hint="Un e-mail est envoyé à cette adresse dès qu'une réponse arrive.">
            {(p) => <Input {...p} type="email" value={params.emailNotification} onChange={(e) => setParams((v) => ({ ...v, emailNotification: e.target.value }))} />}
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Intégrations" description="Ce que déclenche automatiquement une réponse dans les autres modules." />
        <CardBody>
          <Switch
            label="Créer automatiquement un contact"
            description="Une fiche est créée dans Contacts à partir des réponses, si elle n'existe pas déjà."
            checked={params.creerContact}
            onCheckedChange={(v) => setParams((p) => ({ ...p, creerContact: v }))}
          />
        </CardBody>
      </Card>

      <Card className="border-danger-100">
        <CardHeader title="Zone sensible" description="Actions qui affectent la disponibilité du formulaire." />
        <CardBody className="flex flex-wrap gap-2">
          {formulaire.statut === 'archive' ? (
            <Button
              onClick={() => void executer(() => desarchiver(formulaire.id), { titre: 'Formulaire désarchivé', detail: `${formulaire.titre} est revenu en brouillon.` })}
              iconLeft={<ArchiveRestore aria-hidden className="h-4 w-4" />}
            >
              Désarchiver
            </Button>
          ) : (
            <Button onClick={() => setAArchiver(true)} iconLeft={<Archive aria-hidden className="h-4 w-4" />}>
              Archiver ce formulaire
            </Button>
          )}
          <Button
            variant="danger"
            disabled={!peutSupprimer}
            onClick={() => setASupprimer(true)}
            iconLeft={<Trash2 aria-hidden className="h-4 w-4" />}
          >
            Supprimer définitivement
          </Button>
          {!peutSupprimer && <p className="w-full text-xs text-ink-500">Un formulaire publié ou fermé doit d’abord être archivé avant de pouvoir être supprimé.</p>}
        </CardBody>
      </Card>

      <div className="sticky bottom-0 flex flex-wrap items-center justify-end gap-2 border-t border-ink-200 bg-white/90 px-1 py-3 backdrop-blur">
        <Button variant="primary" loading={enCours} onClick={enregistrer} iconLeft={<Check aria-hidden className="h-4 w-4" />}>
          Enregistrer les paramètres
        </Button>
      </div>

      <ConfirmDialog
        open={aArchiver}
        tone="primary"
        loading={enCours}
        onClose={() => setAArchiver(false)}
        onConfirm={() => {
          setAArchiver(false)
          void executer(() => archiver(formulaire.id), { titre: 'Formulaire archivé', detail: `${formulaire.titre} a été déplacé vers les archives.` })
        }}
        title="Archiver ce formulaire ?"
        description="Il ne sera plus accessible par son lien public. Ses réponses restent consultables, et vous pourrez le désarchiver à tout moment."
        confirmLabel="Archiver"
      >
        <p className="text-[0.8125rem] text-ink-600">Le lien public sera désactivé immédiatement.</p>
      </ConfirmDialog>

      <ConfirmDialog
        open={aSupprimer}
        loading={enCours}
        onClose={() => setASupprimer(false)}
        onConfirm={() => {
          setASupprimer(false)
          void executer(async () => {
            await supprimer(formulaire.id)
            navigate('/formulaires')
          }, { titre: 'Formulaire supprimé', detail: `${formulaire.titre} a été supprimé définitivement.` })
        }}
        title="Supprimer ce formulaire ?"
        description={`« ${formulaire.titre} », ses ${formulaire.reponses.length} réponse(s) et son historique seront définitivement supprimés. Cette action ne peut pas être annulée.`}
        confirmLabel="Supprimer définitivement"
      />
    </>
  )
}

export function FormulaireParametres() {
  return <FormulairePage eyebrow="Formulaires">{(f) => <CorpsParametres formulaire={f} />}</FormulairePage>
}
