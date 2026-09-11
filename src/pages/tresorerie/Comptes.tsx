import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Landmark, Pencil, Plus, Wallet } from 'lucide-react'
import { Page, PageHeader } from '@/components/layout/PageLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Field } from '@/components/ui/Field'
import { Input, Select } from '@/components/ui/Input'
import { Switch } from '@/components/ui/Toggle'
import { Alert } from '@/components/ui/Alert'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatusBadge } from '@/components/ui/Status'
import { LineChart } from '@/components/ui/Chart'
import { TresoNav, TresoOutils } from '@/components/tresorerie/TresoNav'
import { useTresorerie } from '@/context/TresorerieContext'
import { useToast } from '@/context/ToastContext'
import { soldeCompte, typeCompteLabels, type CompteBancaire, type TypeCompte } from '@/lib/tresorerie'
import { formatDate, formatMoney } from '@/lib/utils'

const compteVide: Omit<CompteBancaire, 'id'> = {
  nom: '', type: 'courant', banque: '', iban: '', bic: '', soldeInitial: 0,
  compteComptable: '512000', actif: true, decouvertAutorise: 0,
}

export function Comptes() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { comptes, mouvements, chargement, creerCompte, modifierCompte } = useTresorerie()

  const [form, setForm] = useState<{ mode: 'creer' | 'modifier'; id?: string } | null>(null)
  const [valeurs, setValeurs] = useState<Omit<CompteBancaire, 'id'>>(compteVide)
  const [erreurs, setErreurs] = useState<Record<string, string>>({})
  const [enCours, setEnCours] = useState(false)

  const ouvrir = (mode: 'creer' | 'modifier', c?: CompteBancaire) => {
    setErreurs({})
    setValeurs(c ? { ...c } : compteVide)
    setForm({ mode, id: c?.id })
  }

  const enregistrer = () => {
    const e: Record<string, string> = {}
    if (!valeurs.nom.trim()) e.nom = 'Indiquez le nom du compte.'
    if (valeurs.type !== 'caisse' && !valeurs.iban.trim()) e.iban = 'L’IBAN est requis pour un compte bancaire.'
    setErreurs(e)
    if (Object.keys(e).length > 0) return
    setEnCours(true)
    void (async () => {
      try {
        if (form!.mode === 'creer') await creerCompte(valeurs)
        else await modifierCompte(form!.id!, valeurs)
        toast({ titre: form!.mode === 'creer' ? 'Compte créé' : 'Compte mis à jour', detail: valeurs.nom, tone: 'success' })
        setForm(null)
      } catch (err) {
        toast({ titre: 'Action impossible', detail: (err as Error).message, tone: 'danger' })
      } finally {
        setEnCours(false)
      }
    })()
  }

  const set = <K extends keyof Omit<CompteBancaire, 'id'>>(k: K, v: Omit<CompteBancaire, 'id'>[K]) =>
    setValeurs((s) => ({ ...s, [k]: v }))

  return (
    <Page
      header={
        <PageHeader
          eyebrow="Trésorerie"
          title="Comptes bancaires"
          description="Chaque compte porte son solde initial et son compte comptable de rattachement. Le solde affiché est calculé à partir des mouvements enregistrés."
          meta={<Badge variant="brand">{comptes.length} comptes</Badge>}
          actions={
            <>
              <TresoOutils />
              <Button variant="primary" onClick={() => navigate('/tresorerie/comptes/nouveau')} iconLeft={<Plus aria-hidden className="h-4 w-4" />}>
                Nouveau compte
              </Button>
            </>
          }
        />
      }
    >
      <TresoNav />

      {comptes.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Landmark />}
            title="Aucun compte déclaré"
            description="Déclarez au moins un compte bancaire ou une caisse pour enregistrer des mouvements."
            action={<Button variant="primary" onClick={() => navigate('/tresorerie/comptes/nouveau')}>Déclarer un compte</Button>}
          />
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {comptes.map((c) => {
            const solde = soldeCompte(c, mouvements)
            const nb = mouvements.filter((m) => m.compteId === c.id).length
            const nonPointes = mouvements.filter((m) => m.compteId === c.id && !m.rapproche).length
            const alerte = solde < -c.decouvertAutorise
            return (
              <Card key={c.id}>
                <CardHeader
                  title={c.nom}
                  description={`${typeCompteLabels[c.type]} · ${c.banque}`}
                  action={
                    <div className="flex items-center gap-2">
                      <StatusBadge status={c.actif ? 'actif' : 'archive'} />
                      <Button variant="icon" size="sm" label={`Modifier ${c.nom}`} onClick={() => navigate(`/tresorerie/comptes/${c.id}/modifier`)}>
                        <Pencil aria-hidden className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  }
                />
                <CardBody className="flex flex-col gap-3">
                  <p className={`ac-num font-display text-2xl font-semibold ${alerte ? 'text-danger-600' : 'text-ink-950'}`}>
                    {formatMoney(solde)}
                  </p>
                  {alerte && (
                    <Alert tone="danger" titre="Découvert autorisé dépassé">
                      Le solde descend sous {formatMoney(-c.decouvertAutorise)}.
                    </Alert>
                  )}
                  <dl className="grid grid-cols-2 gap-y-1.5 text-xs">
                    {[
                      ['Solde initial', formatMoney(c.soldeInitial)],
                      ['Mouvements', String(nb)],
                      ['Non pointés', String(nonPointes)],
                      ['Compte comptable', c.compteComptable],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-2 pr-4">
                        <dt className="text-ink-500">{k}</dt>
                        <dd className="ac-num font-medium text-ink-800">{v}</dd>
                      </div>
                    ))}
                  </dl>
                  {c.iban && <p className="ac-num truncate text-xs text-ink-500">{c.iban}</p>}
                  <div className="flex gap-2 border-t border-ink-100 pt-3">
                    <Button size="sm" onClick={() => navigate(`/tresorerie/comptes/${c.id}`)}>
                      Ouvrir la fiche
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => navigate('/tresorerie/rapprochement')}>
                      Rapprocher
                    </Button>
                  </div>
                </CardBody>
              </Card>
            )
          })}
        </div>
      )}

      <span className="sr-only" aria-live="polite">{chargement ? 'Chargement' : ''}</span>
    </Page>
  )
}

/* ---------------------------- Fiche de compte ---------------------------- */

export function CompteFicheTreso() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { comptes, mouvements, categorieParId } = useTresorerie()
  const compte = comptes.find((c) => c.id === id)

  if (!compte) {
    return (
      <Page header={<PageHeader title="Compte introuvable" />}>
        <Card>
          <EmptyState
            icon={<Landmark />}
            title="Ce compte n'existe pas"
            description="Il a peut-être été supprimé."
            action={<Button variant="primary" onClick={() => navigate('/tresorerie/comptes')}>Retour aux comptes</Button>}
          />
        </Card>
      </Page>
    )
  }

  const lignes = mouvements
    .filter((m) => m.compteId === compte.id)
    .sort((a, b) => (a.date < b.date ? -1 : 1))

  let cumul = compte.soldeInitial
  const avecCumul = lignes.map((m) => {
    cumul += m.sens === 'entree' ? m.montant : -m.montant
    return { ...m, cumul: Math.round(cumul * 100) / 100 }
  })

  const points = avecCumul.slice(-24).map((m) => ({ label: formatDate(m.date), valeur: Math.round(m.cumul) }))
  const solde = soldeCompte(compte, mouvements)
  const entrees = lignes.filter((m) => m.sens === 'entree').reduce((s, m) => s + m.montant, 0)
  const sorties = lignes.filter((m) => m.sens === 'sortie').reduce((s, m) => s + m.montant, 0)

  return (
    <Page
      header={
        <PageHeader
          eyebrow="Trésorerie"
          title={compte.nom}
          description={`${typeCompteLabels[compte.type]} · ${compte.banque} · compte comptable ${compte.compteComptable}`}
          meta={
            <>
              <StatusBadge status={compte.actif ? 'actif' : 'archive'} />
              {compte.iban && <Badge variant="outline">{compte.iban}</Badge>}
            </>
          }
          actions={
            <>
              <TresoOutils />
              <Button onClick={() => navigate('/tresorerie/comptes')} iconLeft={<ArrowLeft aria-hidden className="h-4 w-4" />}>
                Comptes
              </Button>
              <Button variant="primary" onClick={() => navigate('/tresorerie/mouvements/nouveau')} iconLeft={<Plus aria-hidden className="h-4 w-4" />}>
                Nouvelle transaction
              </Button>
            </>
          }
        />
      }
    >
      <TresoNav />

      <div className="grid gap-3 sm:grid-cols-4">
        {[
          ['Solde actuel', formatMoney(solde)],
          ['Total des entrées', formatMoney(entrees)],
          ['Total des sorties', formatMoney(sorties)],
          ['Mouvements', String(lignes.length)],
        ].map(([k, v]) => (
          <Card key={k} className="p-4">
            <p className="text-[0.8125rem] text-ink-500">{k}</p>
            <p className="ac-num mt-1.5 font-display text-xl font-semibold text-ink-900">{v}</p>
          </Card>
        ))}
      </div>

      {points.length > 1 && (
        <Card>
          <CardHeader title="Évolution du solde" description="Vingt-quatre derniers mouvements." />
          <CardBody>
            <LineChart points={points} titre={`Évolution du solde du compte ${compte.nom}`} unite=" €" />
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader title="Mouvements" description="Du plus récent au plus ancien." />
        {avecCumul.length === 0 ? (
          <EmptyState icon={<Wallet />} title="Aucun mouvement" description="Ce compte n'a pas encore été mouvementé." compact />
        ) : (
          <div className="ac-scroll overflow-x-auto">
            <table className="w-full text-left">
              <caption className="sr-only">Mouvements du compte {compte.nom}</caption>
              <thead>
                <tr className="border-b border-ink-100 bg-ink-25">
                  {['Date', 'Libellé', 'Catégorie', 'Entrée', 'Sortie', 'Solde', 'Pointage'].map((h, i) => (
                    <th key={h} scope="col" className={`px-4 py-2 text-2xs font-semibold uppercase tracking-wide text-ink-500 ${i >= 3 && i <= 5 ? 'text-right' : ''}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {[...avecCumul].reverse().slice(0, 40).map((m) => (
                  <tr key={m.id} className="transition-colors hover:bg-ink-25">
                    <td className="ac-num px-4 py-2 text-[0.8125rem] text-ink-700">{formatDate(m.date)}</td>
                    <td className="px-4 py-2 text-[0.8125rem] text-ink-900">
                      {m.libelle}
                      <span className="ac-num block text-xs text-ink-500">{m.tiers} · {m.reference}</span>
                    </td>
                    <td className="px-4 py-2">
                      {m.categorieId ? (
                        <Badge variant="outline">{categorieParId(m.categorieId)?.nom}</Badge>
                      ) : (
                        <StatusBadge status="non_categorise" />
                      )}
                    </td>
                    <td className="ac-num px-4 py-2 text-right text-[0.8125rem] text-success-600">
                      {m.sens === 'entree' ? formatMoney(m.montant) : '—'}
                    </td>
                    <td className="ac-num px-4 py-2 text-right text-[0.8125rem] text-danger-600">
                      {m.sens === 'sortie' ? formatMoney(m.montant) : '—'}
                    </td>
                    <td className="ac-num px-4 py-2 text-right text-[0.8125rem] font-medium text-ink-900">{formatMoney(m.cumul)}</td>
                    <td className="px-4 py-2"><StatusBadge status={m.rapproche ? 'rapproche' : 'non_rapproche'} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </Page>
  )
}
