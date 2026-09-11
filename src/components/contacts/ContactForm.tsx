import { useState, type FormEvent } from 'react'
import { Mail, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Field } from '@/components/ui/Field'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { MultiSelect } from '@/components/ui/MultiSelect'
import { Checkbox, Switch } from '@/components/ui/Toggle'
import { AvatarUpload } from '@/components/ui/Avatar'
import { Alert } from '@/components/ui/Alert'
import { useContacts } from '@/context/ContactsContext'
import { qualiteLabels, telephoneLabels, type Contact, type Qualite, type Telephone, type TelephoneType } from '@/lib/mock'
import { uid } from '@/lib/utils'

export type ValeursContact = Omit<Contact, 'id' | 'creeLe' | 'historique' | 'documents'>

export const valeursVides: ValeursContact = {
  civilite: 'Non précisé',
  prenom: '',
  nom: '',
  dateNaissance: '',
  email: '',
  telephones: [{ id: 'tel-neuf', type: 'mobile', numero: '' }],
  adresse: { ligne1: '', ligne2: '', codePostal: '', ville: '', pays: 'France' },
  fonction: '',
  statut: 'actif',
  dateEntree: new Date().toISOString().slice(0, 10),
  qualites: ['adherent'],
  groupes: [],
  tags: [],
  communication: { email: true, sms: false, courrier: false, lettreInfo: true, convocations: true, consentementLe: null },
  notes: '',
}

type Erreurs = Partial<Record<'prenom' | 'nom' | 'email' | 'dateEntree' | 'telephone', string>>

export function valider(v: ValeursContact): Erreurs {
  const e: Erreurs = {}
  if (!v.prenom.trim()) e.prenom = 'Indiquez le prénom du contact.'
  if (!v.nom.trim()) e.nom = 'Indiquez le nom du contact.'
  if (!v.email.trim()) e.email = 'Indiquez une adresse e-mail.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email.trim()))
    e.email = 'Cette adresse e-mail n’est pas valide. Format attendu : nom@domaine.fr'
  if (!v.dateEntree) e.dateEntree = 'Indiquez la date d’entrée dans l’association.'
  if (v.telephones.some((t) => t.numero.trim() && !/^[\d\s+.-]{6,}$/.test(t.numero)))
    e.telephone = 'Un numéro contient des caractères inattendus.'
  return e
}

export function ContactForm({
  valeurs,
  onChange,
  onSubmit,
  onCancel,
  enregistrement,
  erreurGlobale,
  erreurs,
  libelleValider,
  titre,
}: {
  valeurs: ValeursContact
  onChange: (v: ValeursContact) => void
  onSubmit: (e: FormEvent) => void
  onCancel: () => void
  enregistrement: boolean
  erreurGlobale: string | null
  erreurs: Erreurs
  libelleValider: string
  titre: string
}) {
  const { groupes, tags } = useContacts()
  const [afficherNotes, setAfficherNotes] = useState(!!valeurs.notes)

  const set = <K extends keyof ValeursContact>(key: K, value: ValeursContact[K]) =>
    onChange({ ...valeurs, [key]: value })

  const setTel = (id: string, patch: Partial<Telephone>) =>
    set('telephones', valeurs.telephones.map((t) => (t.id === id ? { ...t, ...patch } : t)))

  const toggleQualite = (q: Qualite, on: boolean) =>
    set('qualites', on ? [...valeurs.qualites, q] : valeurs.qualites.filter((x) => x !== q))

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {erreurGlobale && (
        <Alert tone="danger" titre="L’enregistrement a échoué">
          {erreurGlobale} Vos saisies sont conservées : réessayez ou corrigez les champs signalés.
        </Alert>
      )}
      {Object.keys(erreurs).length > 0 && (
        <Alert tone="warning" titre={`${Object.keys(erreurs).length} champ(s) à corriger`}>
          Les champs concernés sont signalés ci-dessous avec le détail de l’erreur.
        </Alert>
      )}

      <Card>
        <CardHeader title="Identité" description="Ces informations apparaissent sur les documents adressés au contact." />
        <CardBody className="flex flex-col gap-5">
          <AvatarUpload name={`${valeurs.prenom} ${valeurs.nom}`.trim() || titre} />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Civilité">
              {(p) => (
                <Select
                  {...p}
                  value={valeurs.civilite}
                  onChange={(e) => set('civilite', e.target.value as ValeursContact['civilite'])}
                  options={[
                    { value: 'Madame', label: 'Madame' },
                    { value: 'Monsieur', label: 'Monsieur' },
                    { value: 'Non précisé', label: 'Non précisé' },
                  ]}
                />
              )}
            </Field>
            <Field label="Date de naissance" hint="Sert au calcul des tarifs jeunes et seniors.">
              {(p) => (
                <Input {...p} type="date" value={valeurs.dateNaissance} onChange={(e) => set('dateNaissance', e.target.value)} />
              )}
            </Field>
            <Field label="Prénom" required error={erreurs.prenom}>
              {(p) => <Input {...p} value={valeurs.prenom} onChange={(e) => set('prenom', e.target.value)} placeholder="Awa" />}
            </Field>
            <Field label="Nom" required error={erreurs.nom}>
              {(p) => <Input {...p} value={valeurs.nom} onChange={(e) => set('nom', e.target.value)} placeholder="Diallo" />}
            </Field>
            <Field label="Adresse e-mail" required error={erreurs.email} className="sm:col-span-2">
              {(p) => (
                <Input
                  {...p}
                  type="email"
                  iconLeft={<Mail />}
                  value={valeurs.email}
                  onChange={(e) => set('email', e.target.value)}
                  placeholder="awa.diallo@exemple.fr"
                />
              )}
            </Field>
          </div>

          <fieldset className="flex flex-col gap-3 border-t border-ink-100 pt-4">
            <legend className="sr-only">Numéros de téléphone</legend>
            <div className="flex items-center justify-between">
              <p className="text-[0.8125rem] font-medium text-ink-800">Téléphones</p>
              <Button
                size="sm"
                variant="ghost"
                iconLeft={<Plus aria-hidden className="h-3.5 w-3.5" />}
                onClick={() => set('telephones', [...valeurs.telephones, { id: uid('tel'), type: 'fixe', numero: '' }])}
              >
                Ajouter un numéro
              </Button>
            </div>
            {erreurs.telephone && (
              <p className="text-xs font-medium text-danger-600">{erreurs.telephone}</p>
            )}
            {valeurs.telephones.map((t, i) => (
              <div key={t.id} className="flex items-end gap-2">
                <Field label={`Type du numéro ${i + 1}`} className="w-40 [&>div>label]:sr-only">
                  {(p) => (
                    <Select
                      {...p}
                      value={t.type}
                      onChange={(e) => setTel(t.id, { type: e.target.value as TelephoneType })}
                      options={(Object.keys(telephoneLabels) as TelephoneType[]).map((k) => ({
                        value: k,
                        label: telephoneLabels[k],
                      }))}
                    />
                  )}
                </Field>
                <Field label={`Numéro ${i + 1}`} className="flex-1 [&>div>label]:sr-only">
                  {(p) => (
                    <Input
                      {...p}
                      type="tel"
                      value={t.numero}
                      onChange={(e) => setTel(t.id, { numero: e.target.value })}
                      placeholder="06 12 34 56 78"
                    />
                  )}
                </Field>
                <Button
                  variant="icon"
                  label={`Retirer le numéro ${i + 1}`}
                  disabled={valeurs.telephones.length === 1}
                  onClick={() => set('telephones', valeurs.telephones.filter((x) => x.id !== t.id))}
                  className="mb-0 text-ink-500 hover:text-danger-600"
                >
                  <Trash2 aria-hidden className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </fieldset>

          <fieldset className="grid gap-4 border-t border-ink-100 pt-4 sm:grid-cols-2">
            <legend className="sr-only">Adresse postale</legend>
            <Field label="Adresse" className="sm:col-span-2">
              {(p) => (
                <Input
                  {...p}
                  value={valeurs.adresse.ligne1}
                  onChange={(e) => set('adresse', { ...valeurs.adresse, ligne1: e.target.value })}
                  placeholder="12 rue des Trois-Croissants"
                />
              )}
            </Field>
            <Field label="Complément d’adresse" className="sm:col-span-2">
              {(p) => (
                <Input
                  {...p}
                  value={valeurs.adresse.ligne2}
                  onChange={(e) => set('adresse', { ...valeurs.adresse, ligne2: e.target.value })}
                  placeholder="Bâtiment B, 2ᵉ étage"
                />
              )}
            </Field>
            <Field label="Code postal">
              {(p) => (
                <Input
                  {...p}
                  inputMode="numeric"
                  value={valeurs.adresse.codePostal}
                  onChange={(e) => set('adresse', { ...valeurs.adresse, codePostal: e.target.value })}
                  placeholder="44000"
                />
              )}
            </Field>
            <Field label="Ville">
              {(p) => (
                <Input
                  {...p}
                  value={valeurs.adresse.ville}
                  onChange={(e) => set('adresse', { ...valeurs.adresse, ville: e.target.value })}
                  placeholder="Nantes"
                />
              )}
            </Field>
          </fieldset>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Association" description="Rôle du contact et rattachement aux groupes." />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Field label="Fonction" hint="Intitulé libre : Présidente, Bénévole accueil…">
            {(p) => <Input {...p} value={valeurs.fonction} onChange={(e) => set('fonction', e.target.value)} placeholder="Bénévole accueil" />}
          </Field>
          <Field label="Date d’entrée" required error={erreurs.dateEntree}>
            {(p) => (
              <Input
                {...p}
                type="date"
                value={valeurs.dateEntree.slice(0, 10)}
                onChange={(e) => set('dateEntree', e.target.value)}
              />
            )}
          </Field>

          <fieldset className="sm:col-span-2">
            <legend className="mb-2 text-[0.8125rem] font-medium text-ink-800">Qualités</legend>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {(Object.keys(qualiteLabels) as Qualite[]).map((q) => (
                <Checkbox
                  key={q}
                  label={qualiteLabels[q]}
                  checked={valeurs.qualites.includes(q)}
                  onChange={(e) => toggleQualite(q, e.target.checked)}
                />
              ))}
            </div>
          </fieldset>

          <Field label="Statut" hint="L’archivage se fait aussi depuis la fiche, avec confirmation.">
            {(p) => (
              <Select
                {...p}
                value={valeurs.statut}
                onChange={(e) => set('statut', e.target.value as ValeursContact['statut'])}
                options={[
                  { value: 'actif', label: 'Actif' },
                  { value: 'en_attente', label: 'En attente' },
                  { value: 'archive', label: 'Archivé' },
                ]}
              />
            )}
          </Field>
          <div />

          <Field label="Groupes" hint="Plusieurs choix possibles.">
            {(p) => (
              <MultiSelect
                {...p}
                value={valeurs.groupes}
                onChange={(v) => set('groupes', v)}
                options={groupes.map((g) => ({ value: g.nom, label: g.nom }))}
                placeholder="Aucun groupe"
              />
            )}
          </Field>
          <Field label="Tags">
            {(p) => (
              <MultiSelect
                {...p}
                value={valeurs.tags}
                onChange={(v) => set('tags', v)}
                options={tags.map((t) => ({ value: t.nom, label: t.nom }))}
                placeholder="Aucun tag"
              />
            )}
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Communication" description="Le contact peut refuser chaque canal indépendamment." />
        <CardBody className="flex flex-col gap-4">
          <Switch
            label="E-mails de l’association"
            description="Convocations, comptes rendus, informations pratiques."
            checked={valeurs.communication.email}
            onCheckedChange={(v) => set('communication', { ...valeurs.communication, email: v })}
          />
          <Switch
            label="SMS"
            description="Rappels de dernière minute uniquement."
            checked={valeurs.communication.sms}
            onCheckedChange={(v) => set('communication', { ...valeurs.communication, sms: v })}
          />
          <Switch
            label="Courrier postal"
            description="Envoi papier, à réserver aux contacts sans adresse e-mail."
            checked={valeurs.communication.courrier}
            onCheckedChange={(v) => set('communication', { ...valeurs.communication, courrier: v })}
          />
          <Switch
            label="Lettre d’information"
            description="Un envoi par mois."
            checked={valeurs.communication.lettreInfo}
            onCheckedChange={(v) => set('communication', { ...valeurs.communication, lettreInfo: v })}
          />
          <Switch
            label="Convocations aux assemblées"
            description="Obligatoire pour les adhérents à jour de cotisation."
            checked={valeurs.communication.convocations}
            onCheckedChange={(v) => set('communication', { ...valeurs.communication, convocations: v })}
          />

          <div className="border-t border-ink-100 pt-4">
            {afficherNotes ? (
              <Field label="Note interne" hint="Visible uniquement par l’équipe administrative.">
                {(p) => (
                  <Textarea
                    {...p}
                    value={valeurs.notes}
                    onChange={(e) => set('notes', e.target.value)}
                    placeholder="Disponibilités, contexte, points d’attention…"
                  />
                )}
              </Field>
            ) : (
              <Button size="sm" variant="ghost" iconLeft={<Plus aria-hidden className="h-3.5 w-3.5" />} onClick={() => setAfficherNotes(true)}>
                Ajouter une note interne
              </Button>
            )}
          </div>
        </CardBody>
      </Card>

      <div className="sticky bottom-0 z-10 flex items-center justify-end gap-2 border-t border-ink-200 bg-white/90 px-1 py-3 backdrop-blur">
        <p aria-live="polite" className="mr-auto text-[0.8125rem] text-ink-500">
          {enregistrement ? 'Enregistrement en cours…' : 'Les champs marqués d’un astérisque sont obligatoires.'}
        </p>
        <Button variant="ghost" onClick={onCancel} disabled={enregistrement}>
          Annuler
        </Button>
        <Button type="submit" variant="primary" loading={enregistrement}>
          {libelleValider}
        </Button>
      </div>
    </form>
  )
}
