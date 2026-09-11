import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Landmark } from 'lucide-react'
import { Page, PageHeader } from '@/components/layout/PageLayout'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Field } from '@/components/ui/Field'
import { Input, Select } from '@/components/ui/Input'
import { Switch } from '@/components/ui/Toggle'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageFormulaire } from '@/components/forms/PageFormulaire'
import { TresoNav } from '@/components/tresorerie/TresoNav'
import { useTresorerie } from '@/context/TresorerieContext'
import { useToast } from '@/context/ToastContext'
import { typeCompteLabels, type CompteBancaire, type TypeCompte } from '@/lib/tresorerie'

const compteVide: Omit<CompteBancaire, 'id'> = {
  nom: '', type: 'courant', banque: '', iban: '', bic: '', soldeInitial: 0, compteComptable: '512', actif: true, decouvertAutorise: 0,
}

export function CompteForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { comptes, creerCompte, modifierCompte } = useTresorerie()

  const source = id ? comptes.find((c) => c.id === id) : undefined
  const [valeurs, setValeurs] = useState<Omit<CompteBancaire, 'id'>>(source ? { ...source } : compteVide)
  const [erreurs, setErreurs] = useState<Record<string, string>>({})
  const [enCours, setEnCours] = useState(false)

  if (id && !source) {
    return (
      <Page header={<PageHeader eyebrow="Trésorerie" title="Compte introuvable" />}>
        <TresoNav />
        <Card>
          <EmptyState
            icon={<Landmark />}
            title="Ce compte n'existe plus"
            description="Il a peut-être été supprimé."
            action={<Button variant="primary" onClick={() => navigate('/tresorerie/comptes')}>Retour aux comptes</Button>}
          />
        </Card>
      </Page>
    )
  }

  const set = <K extends keyof Omit<CompteBancaire, 'id'>>(k: K, v: Omit<CompteBancaire, 'id'>[K]) =>
    setValeurs((s) => ({ ...s, [k]: v }))

  const enregistrer = () => {
    const e: Record<string, string> = {}
    if (!valeurs.nom.trim()) e.nom = 'Donnez un nom au compte.'
    if (valeurs.iban && !/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/i.test(valeurs.iban.replace(/\s/g, ''))) {
      e.iban = "Cet IBAN ne respecte pas le format attendu."
    }
    if (valeurs.decouvertAutorise < 0) e.decouvertAutorise = 'Indiquez le découvert en valeur positive.'
    setErreurs(e)
    if (Object.keys(e).length > 0) return

    setEnCours(true)
    void (async () => {
      try {
        if (source) await modifierCompte(source.id, valeurs)
        else await creerCompte(valeurs)
        toast({ titre: source ? 'Compte mis à jour' : 'Compte créé', detail: valeurs.nom, tone: 'success' })
        navigate('/tresorerie/comptes')
      } catch (err) {
        toast({ titre: 'Action impossible', detail: (err as Error).message, tone: 'danger' })
      } finally {
        setEnCours(false)
      }
    })()
  }

  return (
    <PageFormulaire
      eyebrow="Trésorerie"
      titre={source ? `Modifier ${source.nom}` : 'Nouveau compte bancaire'}
      description="Les comptes portent les mouvements de trésorerie et alimentent le rapprochement bancaire."
      nav={<TresoNav />}
      onAnnuler={() => navigate('/tresorerie/comptes')}
      onEnregistrer={enregistrer}
      libelleEnregistrer={source ? 'Enregistrer' : 'Créer le compte'}
      enCours={enCours}
      etat={source ? 'Le solde initial ne peut plus être modifié une fois des mouvements enregistrés.' : undefined}
      sections={[
        {
          titre: 'Identité du compte',
          description: 'Ce qui permet de le reconnaître dans les listes et les rapprochements.',
          contenu: (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nom du compte" required error={erreurs.nom} className="sm:col-span-2">
                {(p) => <Input {...p} value={valeurs.nom} onChange={(e) => set('nom', e.target.value)} placeholder="Compte courant principal" />}
              </Field>
              <Field label="Type">
                {(p) => (
                  <Select
                    {...p}
                    value={valeurs.type}
                    onChange={(e) => set('type', e.target.value as TypeCompte)}
                    options={(Object.keys(typeCompteLabels) as TypeCompte[]).map((t) => ({ value: t, label: typeCompteLabels[t] }))}
                  />
                )}
              </Field>
              <Field label="Banque">
                {(p) => <Input {...p} value={valeurs.banque} onChange={(e) => set('banque', e.target.value)} placeholder="Crédit Mutuel" />}
              </Field>
            </div>
          ),
        },
        {
          titre: 'Coordonnées bancaires',
          description: "Utilisées pour les virements et l'import des relevés.",
          contenu: (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="IBAN" error={erreurs.iban} className="sm:col-span-2">
                {(p) => <Input {...p} value={valeurs.iban} onChange={(e) => set('iban', e.target.value)} placeholder="FR76 3000 4000 0300 0000 0000 143" />}
              </Field>
              <Field label="BIC">
                {(p) => <Input {...p} value={valeurs.bic} onChange={(e) => set('bic', e.target.value)} placeholder="CMCIFRPP" />}
              </Field>
            </div>
          ),
        },
        {
          titre: 'Comptabilité et seuils',
          description: 'Le rattachement comptable et le point à partir duquel la trésorerie alerte.',
          contenu: (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Compte comptable" hint="Racine 512 pour les banques, 530 pour la caisse.">
                {(p) => <Input {...p} value={valeurs.compteComptable} onChange={(e) => set('compteComptable', e.target.value)} placeholder="512" />}
              </Field>
              <Field label="Solde initial">
                {(p) => (
                  <Input {...p} type="number" step="0.01" suffix="€" value={String(valeurs.soldeInitial)} onChange={(e) => set('soldeInitial', Number(e.target.value) || 0)} />
                )}
              </Field>
              <Field label="Découvert autorisé" error={erreurs.decouvertAutorise} hint="En valeur positive. Zéro si aucun découvert n’est accordé.">
                {(p) => (
                  <Input {...p} type="number" min={0} step="0.01" suffix="€" value={String(valeurs.decouvertAutorise)} onChange={(e) => set('decouvertAutorise', Number(e.target.value) || 0)} />
                )}
              </Field>
              <div className="sm:col-span-2">
                <Switch
                  label="Compte actif"
                  description="Un compte inactif conserve son historique mais n’est plus proposé à la saisie."
                  checked={valeurs.actif}
                  onCheckedChange={(v) => set('actif', v)}
                />
              </div>
            </div>
          ),
        },
      ]}
    />
  )
}
