import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, Hash, LayoutTemplate, Package, Pencil, Percent, Plus } from 'lucide-react'
import { Page, PageHeader } from '@/components/layout/PageLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Field } from '@/components/ui/Field'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Switch } from '@/components/ui/Toggle'
import { EmptyState } from '@/components/ui/EmptyState'
import { Alert } from '@/components/ui/Alert'
import { StatusBadge } from '@/components/ui/Status'
import { DataGrid, type Column, type FilterDef } from '@/components/data/DataGrid'
import { FactNav, FactOutils } from '@/components/facturation/FactNav'
import { useFacturation } from '@/context/FacturationContext'
import { useToast } from '@/context/ToastContext'
import { statutFacture, totalTTC, typeClientLabels, type Client, type GrilleTarifaire, type ModeleFacture, type Produit, type TypeClient } from '@/lib/facturation'
import { formatMoney } from '@/lib/utils'

/* ------------------------------- Clients ------------------------------- */

const clientVide: Omit<Client, 'id'> = {
  nom: '', type: 'entreprise', contact: '', email: '', telephone: '', adresse: '', codePostal: '', ville: '',
  siret: '', delaiPaiement: 30, grilleTarifaire: 'gt-public', notes: '',
}

export function Clients() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { clients, factures, grilles, chargement, creerClient, modifierClient } = useFacturation()

  const [form, setForm] = useState<{ mode: 'creer' | 'modifier'; id?: string } | null>(null)
  const [valeurs, setValeurs] = useState<Omit<Client, 'id'>>(clientVide)
  const [erreurs, setErreurs] = useState<Record<string, string>>({})
  const [enCours, setEnCours] = useState(false)

  const stats = (id: string) => {
    const f = factures.filter((x) => x.clientId === id && x.type === 'facture')
    const ca = f.filter((x) => !['brouillon', 'annulee'].includes(statutFacture(x))).reduce((s, x) => s + totalTTC(x), 0)
    const retard = f.filter((x) => statutFacture(x) === 'retard').length
    return { nb: f.length, ca: Math.round(ca), retard }
  }

  const ouvrir = (mode: 'creer' | 'modifier', c?: Client) => {
    setErreurs({})
    setValeurs(c ? { ...c } : clientVide)
    setForm({ mode, id: c?.id })
  }

  const enregistrer = () => {
    const e: Record<string, string> = {}
    if (!valeurs.nom.trim()) e.nom = 'Indiquez la raison sociale.'
    if (!valeurs.email.trim()) e.email = 'Indiquez une adresse e-mail.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valeurs.email)) e.email = 'Adresse e-mail invalide.'
    setErreurs(e)
    if (Object.keys(e).length > 0) return
    setEnCours(true)
    void (async () => {
      try {
        if (form!.mode === 'creer') await creerClient(valeurs)
        else await modifierClient(form!.id!, valeurs)
        toast({ titre: form!.mode === 'creer' ? 'Client créé' : 'Client mis à jour', detail: valeurs.nom, tone: 'success' })
        setForm(null)
      } catch (err) {
        toast({ titre: 'Action impossible', detail: (err as Error).message, tone: 'danger' })
      } finally {
        setEnCours(false)
      }
    })()
  }

  const set = <K extends keyof Omit<Client, 'id'>>(k: K, v: Omit<Client, 'id'>[K]) => setValeurs((s) => ({ ...s, [k]: v }))

  const columns: Column<Client>[] = [
    {
      id: 'nom',
      header: 'Client',
      sortValue: (r) => r.nom,
      cell: (r) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-ink-900">{r.nom}</p>
          <p className="truncate text-xs text-ink-500">{r.contact} · {r.email}</p>
        </div>
      ),
    },
    { id: 'type', header: 'Type', sortValue: (r) => r.type, cell: (r) => <Badge variant="outline">{typeClientLabels[r.type]}</Badge> },
    { id: 'ville', header: 'Ville', optional: true, sortValue: (r) => r.ville, cell: (r) => r.ville },
    { id: 'grille', header: 'Grille', optional: true, cell: (r) => grilles.find((g) => g.id === r.grilleTarifaire)?.nom ?? '—' },
    { id: 'delai', header: 'Délai', align: 'right', optional: true, sortValue: (r) => r.delaiPaiement, cell: (r) => <span className="ac-num">{r.delaiPaiement} j</span> },
    { id: 'nb', header: 'Factures', align: 'right', sortValue: (r) => stats(r.id).nb, cell: (r) => <span className="ac-num">{stats(r.id).nb}</span> },
    {
      id: 'ca',
      header: 'CA TTC',
      align: 'right',
      sortValue: (r) => stats(r.id).ca,
      cell: (r) => <span className="ac-num font-medium">{formatMoney(stats(r.id).ca)}</span>,
    },
    {
      id: 'retard',
      header: 'Impayés',
      align: 'right',
      cell: (r) => (stats(r.id).retard > 0 ? <StatusBadge status="facture_retard" /> : <span className="text-ink-500">—</span>),
    },
  ]

  const filters: FilterDef<Client>[] = [
    {
      id: 'type',
      label: 'Type',
      options: (Object.keys(typeClientLabels) as TypeClient[]).map((t) => ({ value: t, label: typeClientLabels[t] })),
      match: (r, v) => r.type === v,
    },
  ]

  return (
    <Page
      header={
        <PageHeader
          eyebrow="Facturation"
          title="Clients"
          description="Les structures et personnes à qui l'association facture ses prestations. Le délai de paiement et la grille tarifaire s'appliquent automatiquement aux nouvelles factures."
          meta={<Badge variant="brand">{clients.length} clients</Badge>}
          actions={
            <>
              <FactOutils />
              <Button variant="primary" onClick={() => navigate('/facturation/clients/nouveau')} iconLeft={<Plus aria-hidden className="h-4 w-4" />}>
                Nouveau client
              </Button>
            </>
          }
        />
      }
    >
      <FactNav />

      {clients.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Building2 />}
            title="Aucun client"
            description="Créez un client pour pouvoir émettre des factures."
            action={<Button variant="primary" onClick={() => navigate('/facturation/clients/nouveau')}>Créer un client</Button>}
          />
        </Card>
      ) : (
        <DataGrid
          rows={clients}
          columns={columns}
          filters={filters}
          loading={chargement}
          caption="Liste des clients de l'association"
          searchKeys={(r) => `${r.nom} ${r.contact} ${r.email} ${r.ville} ${r.siret}`}
          searchPlaceholder="Rechercher un client, un contact, une ville…"
          getRowLabel={(r) => r.nom}
          onRowClick={(r) => navigate(`/facturation/clients/${r.id}/modifier`)}
          emptyIcon={<Building2 />}
          emptyTitle="Aucun client ne correspond"
          emptyDescription="Élargissez la recherche ou retirez un filtre."
          rowActions={[
            { label: 'Modifier la fiche', icon: <Pencil />, onSelect: (r) => navigate(`/facturation/clients/${r.id}/modifier`) },
            { label: 'Voir ses factures', icon: <Package />, onSelect: () => navigate('/facturation/factures') },
          ]}
        />
      )}

    </Page>
  )
}

/* ------------------------- Produits et services ------------------------- */

const produitVide: Omit<Produit, 'id'> = {
  reference: '', nom: '', description: '', categorie: 'Prestation', prixHT: 0, tva: 20, unite: 'unité', actif: true,
}

export function Produits() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { produits, creerProduit, modifierProduit } = useFacturation()
  const [form, setForm] = useState<{ mode: 'creer' | 'modifier'; id?: string } | null>(null)
  const [valeurs, setValeurs] = useState<Omit<Produit, 'id'>>(produitVide)
  const [erreurs, setErreurs] = useState<Record<string, string>>({})
  const [enCours, setEnCours] = useState(false)

  const categories = Array.from(new Set(produits.map((p) => p.categorie)))

  const ouvrir = (mode: 'creer' | 'modifier', p?: Produit) => {
    setErreurs({})
    setValeurs(p ? { ...p } : produitVide)
    setForm({ mode, id: p?.id })
  }

  const enregistrer = () => {
    const e: Record<string, string> = {}
    if (!valeurs.nom.trim()) e.nom = 'Indiquez le nom de la prestation.'
    if (valeurs.prixHT < 0) e.prixHT = 'Le prix ne peut pas être négatif.'
    setErreurs(e)
    if (Object.keys(e).length > 0) return
    setEnCours(true)
    void (async () => {
      try {
        if (form!.mode === 'creer') await creerProduit(valeurs)
        else await modifierProduit(form!.id!, valeurs)
        toast({ titre: form!.mode === 'creer' ? 'Prestation créée' : 'Prestation mise à jour', detail: valeurs.nom, tone: 'success' })
        setForm(null)
      } catch (err) {
        toast({ titre: 'Action impossible', detail: (err as Error).message, tone: 'danger' })
      } finally {
        setEnCours(false)
      }
    })()
  }

  const set = <K extends keyof Omit<Produit, 'id'>>(k: K, v: Omit<Produit, 'id'>[K]) => setValeurs((s) => ({ ...s, [k]: v }))

  return (
    <Page
      header={
        <PageHeader
          eyebrow="Facturation"
          title="Produits et services"
          description="Le catalogue des prestations facturables. Les prix servent de base : ils sont ajustés par la grille tarifaire du client, puis modifiables ligne par ligne."
          meta={<Badge variant="brand">{produits.length} prestations</Badge>}
          actions={
            <>
              <FactOutils />
              <Button variant="primary" onClick={() => navigate('/facturation/produits/nouveau')} iconLeft={<Plus aria-hidden className="h-4 w-4" />}>
                Nouvelle prestation
              </Button>
            </>
          }
        />
      }
    >
      <FactNav />

      {categories.map((cat) => (
        <Card key={cat}>
          <CardHeader title={cat} description={`${produits.filter((p) => p.categorie === cat).length} prestation(s)`} />
          <ul className="divide-y divide-ink-100">
            {produits
              .filter((p) => p.categorie === cat)
              .map((p) => (
                <li key={p.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                  <span className="ac-num w-24 shrink-0 text-xs text-ink-500">{p.reference}</span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 text-[0.8125rem] font-medium text-ink-900">
                      {p.nom}
                      {!p.actif && <StatusBadge status="archive" />}
                    </p>
                    <p className="text-xs leading-relaxed text-ink-500">{p.description}</p>
                  </div>
                  <Badge variant="outline">TVA {p.tva} %</Badge>
                  <span className="ac-num w-28 text-right text-[0.8125rem] font-semibold text-ink-900">
                    {formatMoney(p.prixHT)}
                    <span className="ml-1 text-xs font-normal text-ink-500">/ {p.unite}</span>
                  </span>
                  <Button variant="icon" size="sm" label={`Modifier ${p.nom}`} onClick={() => navigate(`/facturation/produits/${p.id}/modifier`)}>
                    <Pencil aria-hidden className="h-3.5 w-3.5" />
                  </Button>
                </li>
              ))}
          </ul>
        </Card>
      ))}

    </Page>
  )
}

/* -------------------------------- Tarifs -------------------------------- */

export function Tarifs() {
  const { toast } = useToast()
  const { grilles, produits, clients, creerGrille, modifierGrille } = useFacturation()
  const [form, setForm] = useState<{ mode: 'creer' | 'modifier'; id?: string } | null>(null)
  const [valeurs, setValeurs] = useState<Omit<GrilleTarifaire, 'id'>>({ nom: '', description: '', coefficient: 1, actif: true })
  const [enCours, setEnCours] = useState(false)

  const ouvrir = (mode: 'creer' | 'modifier', g?: GrilleTarifaire) => {
    setValeurs(g ? { ...g } : { nom: '', description: '', coefficient: 1, actif: true })
    setForm({ mode, id: g?.id })
  }

  const enregistrer = () => {
    if (!valeurs.nom.trim()) {
      toast({ titre: 'Nom manquant', detail: 'Indiquez le nom de la grille.', tone: 'warning' })
      return
    }
    setEnCours(true)
    void (async () => {
      try {
        if (form!.mode === 'creer') await creerGrille(valeurs)
        else await modifierGrille(form!.id!, valeurs)
        toast({ titre: form!.mode === 'creer' ? 'Grille créée' : 'Grille mise à jour', detail: valeurs.nom, tone: 'success' })
        setForm(null)
      } catch (err) {
        toast({ titre: 'Action impossible', detail: (err as Error).message, tone: 'danger' })
      } finally {
        setEnCours(false)
      }
    })()
  }

  return (
    <Page
      header={
        <PageHeader
          eyebrow="Facturation"
          title="Tarifs"
          description="Chaque grille applique un coefficient au prix catalogue. Elle est rattachée au client et s'applique automatiquement lors de la saisie d'une facture."
          meta={<Badge variant="brand">{grilles.length} grilles</Badge>}
          actions={
            <>
              <FactOutils />
              <Button variant="primary" onClick={() => ouvrir('creer')} iconLeft={<Plus aria-hidden className="h-4 w-4" />}>
                Nouvelle grille
              </Button>
            </>
          }
        />
      }
    >
      <FactNav />

      <div className="grid gap-4 lg:grid-cols-2">
        {grilles.map((g) => (
          <Card key={g.id}>
            <CardHeader
              title={g.nom}
              description={g.description}
              action={
                <div className="flex items-center gap-2">
                  <StatusBadge status={g.actif ? 'actif' : 'archive'} />
                  <Button variant="icon" size="sm" label={`Modifier ${g.nom}`} onClick={() => ouvrir('modifier', g)}>
                    <Pencil aria-hidden className="h-3.5 w-3.5" />
                  </Button>
                </div>
              }
            />
            <CardBody className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="outline">Coefficient {g.coefficient}</Badge>
                <Badge variant="outline">
                  {g.coefficient === 1 ? 'Prix catalogue' : `Remise de ${Math.round((1 - g.coefficient) * 100)} %`}
                </Badge>
                <Badge>{clients.filter((c) => c.grilleTarifaire === g.id).length} client(s)</Badge>
              </div>
              <div className="ac-scroll overflow-x-auto">
                <table className="w-full text-left">
                  <caption className="sr-only">Prix appliqués par la grille {g.nom}</caption>
                  <thead>
                    <tr className="border-b border-ink-100">
                      <th scope="col" className="py-1.5 text-2xs font-semibold uppercase tracking-wide text-ink-500">Prestation</th>
                      <th scope="col" className="py-1.5 text-right text-2xs font-semibold uppercase tracking-wide text-ink-500">Catalogue</th>
                      <th scope="col" className="py-1.5 text-right text-2xs font-semibold uppercase tracking-wide text-ink-500">Prix appliqué</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100">
                    {produits.filter((p) => p.actif).slice(0, 5).map((p) => (
                      <tr key={p.id}>
                        <td className="py-1.5 pr-3 text-[0.8125rem] text-ink-800">{p.nom}</td>
                        <td className="ac-num py-1.5 text-right text-[0.8125rem] text-ink-500">{formatMoney(p.prixHT)}</td>
                        <td className="ac-num py-1.5 text-right text-[0.8125rem] font-medium text-ink-900">
                          {formatMoney(Math.round(p.prixHT * g.coefficient * 100) / 100)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <Modal
        open={!!form}
        onClose={() => setForm(null)}
        title={form?.mode === 'creer' ? 'Nouvelle grille tarifaire' : `Modifier ${valeurs.nom}`}
        description="Le coefficient s'applique au prix catalogue de chaque prestation."
        footer={
          <>
            <Button variant="ghost" onClick={() => setForm(null)} disabled={enCours}>Annuler</Button>
            <Button variant="primary" loading={enCours} onClick={enregistrer}>
              {form?.mode === 'creer' ? 'Créer la grille' : 'Enregistrer'}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4 py-2">
          <Field label="Nom de la grille" required>
            {(p) => <Input {...p} value={valeurs.nom} onChange={(e) => setValeurs((s) => ({ ...s, nom: e.target.value }))} placeholder="Tarif adhérent" />}
          </Field>
          <Field label="Description">
            {(p) => <Textarea {...p} rows={2} value={valeurs.description} onChange={(e) => setValeurs((s) => ({ ...s, description: e.target.value }))} />}
          </Field>
          <Field label="Coefficient" required hint="1 = prix catalogue. 0,8 = remise de 20 %.">
            {(p) => (
              <Input
                {...p}
                type="number"
                min={0}
                max={2}
                step="0.05"
                value={String(valeurs.coefficient)}
                onChange={(e) => setValeurs((s) => ({ ...s, coefficient: Number(e.target.value) || 0 }))}
              />
            )}
          </Field>
          <Switch
            label="Grille active"
            description="Une grille inactive reste appliquée aux clients qui la portent, mais n’est plus proposée."
            checked={valeurs.actif}
            onCheckedChange={(v) => setValeurs((s) => ({ ...s, actif: v }))}
          />
        </div>
      </Modal>
    </Page>
  )
}

/* ------------------------------- Modèles -------------------------------- */

const modeleVide: Omit<ModeleFacture, 'id'> = {
  nom: '', description: '', mentions: '', conditions: '', pied: '', defaut: false, actif: true,
}

export function Modeles() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { modeles, factures, creerModele, modifierModele } = useFacturation()
  const [form, setForm] = useState<{ mode: 'creer' | 'modifier'; id?: string } | null>(null)
  const [valeurs, setValeurs] = useState<Omit<ModeleFacture, 'id'>>(modeleVide)
  const [enCours, setEnCours] = useState(false)

  const ouvrir = (mode: 'creer' | 'modifier', m?: ModeleFacture) => {
    setValeurs(m ? { ...m } : modeleVide)
    setForm({ mode, id: m?.id })
  }

  const enregistrer = () => {
    if (!valeurs.nom.trim()) {
      toast({ titre: 'Nom manquant', detail: 'Indiquez le nom du modèle.', tone: 'warning' })
      return
    }
    setEnCours(true)
    void (async () => {
      try {
        if (form!.mode === 'creer') await creerModele(valeurs)
        else await modifierModele(form!.id!, valeurs)
        toast({ titre: form!.mode === 'creer' ? 'Modèle créé' : 'Modèle mis à jour', detail: valeurs.nom, tone: 'success' })
        setForm(null)
      } catch (err) {
        toast({ titre: 'Action impossible', detail: (err as Error).message, tone: 'danger' })
      } finally {
        setEnCours(false)
      }
    })()
  }

  const set = <K extends keyof Omit<ModeleFacture, 'id'>>(k: K, v: Omit<ModeleFacture, 'id'>[K]) =>
    setValeurs((s) => ({ ...s, [k]: v }))

  return (
    <Page
      header={
        <PageHeader
          eyebrow="Facturation"
          title="Modèles de facture"
          description="Chaque modèle porte ses mentions légales, ses conditions de règlement et son pied de page. Le modèle est choisi à la création de la facture."
          meta={<Badge variant="brand">{modeles.length} modèles</Badge>}
          actions={
            <>
              <FactOutils />
              <Button variant="primary" onClick={() => navigate('/facturation/modeles/nouveau')} iconLeft={<Plus aria-hidden className="h-4 w-4" />}>
                Nouveau modèle
              </Button>
            </>
          }
        />
      }
    >
      <FactNav />

      {modeles.map((m) => (
        <Card key={m.id}>
          <CardHeader
            title={m.nom}
            description={m.description}
            action={
              <div className="flex items-center gap-2">
                {m.defaut && <Badge variant="brand">Par défaut</Badge>}
                <StatusBadge status={m.actif ? 'actif' : 'archive'} />
                <Badge variant="outline">{factures.filter((f) => f.modeleId === m.id).length} documents</Badge>
                <Button variant="icon" size="sm" label={`Modifier ${m.nom}`} onClick={() => navigate(`/facturation/modeles/${m.id}/modifier`)}>
                  <Pencil aria-hidden className="h-3.5 w-3.5" />
                </Button>
              </div>
            }
          />
          <CardBody className="flex flex-col gap-3 text-[0.8125rem] leading-relaxed">
            <div>
              <p className="text-2xs font-semibold uppercase tracking-wide text-ink-500">Mentions</p>
              <p className="mt-1 text-ink-700">{m.mentions}</p>
            </div>
            <div className="border-t border-ink-100 pt-3">
              <p className="text-2xs font-semibold uppercase tracking-wide text-ink-500">Conditions de règlement</p>
              <p className="mt-1 text-ink-700">{m.conditions}</p>
            </div>
            <div className="border-t border-ink-100 pt-3">
              <p className="text-2xs font-semibold uppercase tracking-wide text-ink-500">Pied de page</p>
              <p className="mt-1 text-ink-500">{m.pied}</p>
            </div>
          </CardBody>
        </Card>
      ))}

    </Page>
  )
}

/* ----------------------------- Numérotation ----------------------------- */

export function NumerotationPage() {
  const { toast } = useToast()
  const { numerotation, modifierNumerotation, prochainNumero } = useFacturation()
  const [enCours, setEnCours] = useState<string | null>(null)

  const appliquer = (id: 'facture' | 'avoir', patch: Record<string, unknown>) => {
    setEnCours(id)
    void (async () => {
      try {
        await modifierNumerotation(id, patch)
        toast({ titre: 'Numérotation mise à jour', detail: 'Les prochains documents suivront ce format.', tone: 'success' })
      } catch (err) {
        toast({ titre: 'Action impossible', detail: (err as Error).message, tone: 'danger' })
      } finally {
        setEnCours(null)
      }
    })()
  }

  return (
    <Page
      width="narrow"
      header={
        <PageHeader
          eyebrow="Facturation"
          title="Numérotation"
          description="Les numéros de facture et d'avoir doivent former une séquence continue, sans trou ni doublon. Modifier le compteur engage votre responsabilité."
          actions={<FactOutils />}
        />
      }
    >
      <FactNav />

      <Alert tone="warning" titre="Une séquence sans trou">
        Une facture annulée conserve son numéro : le document reste conservé et la séquence ne comporte aucun trou.
        Reculer le compteur exposerait à des doublons.
      </Alert>

      {numerotation.map((n) => (
        <Card key={n.id}>
          <CardHeader
            title={n.libelle}
            description={`Prochain numéro attribué : ${prochainNumero(n.id)}`}
            action={<Badge variant="outline">{n.format}</Badge>}
          />
          <CardBody className="grid gap-4 sm:grid-cols-2">
            <Field label="Préfixe" hint="Deux ou trois lettres au maximum.">
              {(p) => (
                <Input
                  {...p}
                  value={n.prefixe}
                  maxLength={3}
                  onChange={(e) => appliquer(n.id, { prefixe: e.target.value.toUpperCase() })}
                />
              )}
            </Field>
            <Field label="Longueur du compteur" hint="Nombre de chiffres, complété par des zéros.">
              {(p) => (
                <Select
                  {...p}
                  value={String(n.longueur)}
                  onChange={(e) => appliquer(n.id, { longueur: Number(e.target.value) })}
                  options={[3, 4, 5, 6].map((l) => ({ value: String(l), label: `${l} chiffres` }))}
                />
              )}
            </Field>
            <Field label="Prochain numéro" hint="Ne reculez ce compteur qu’en connaissance de cause.">
              {(p) => (
                <Input
                  {...p}
                  type="number"
                  min={1}
                  value={String(n.prochain)}
                  onChange={(e) => appliquer(n.id, { prochain: Number(e.target.value) || 1 })}
                />
              )}
            </Field>
            <div className="flex items-end pb-1">
              <Switch
                label="Remise à zéro annuelle"
                description="Le compteur repart à 1 au 1ᵉʳ janvier."
                checked={n.remiseAZeroAnnuelle}
                onCheckedChange={(v) => appliquer(n.id, { remiseAZeroAnnuelle: v })}
                className="w-full"
              />
            </div>
            <div className="sm:col-span-2 rounded-lg border border-ink-200 bg-ink-25 p-3">
              <p className="flex items-center gap-2 text-[0.8125rem] text-ink-700">
                <Hash aria-hidden className="h-4 w-4 text-brand-500" />
                Aperçu de la séquence :{' '}
                <span className="ac-num font-semibold text-ink-900">
                  {[0, 1, 2]
                    .map((k) => `${n.prefixe}-${new Date().getFullYear()}-${String(n.prochain + k).padStart(n.longueur, '0')}`)
                    .join(' · ')}
                </span>
              </p>
              {enCours === n.id && <p className="mt-1 text-xs text-ink-500" aria-live="polite">Enregistrement en cours…</p>}
            </div>
          </CardBody>
        </Card>
      ))}

      <Card>
        <CardHeader title="Où s’applique la numérotation" />
        <CardBody>
          <ul className="flex flex-col gap-2 text-[0.8125rem] leading-relaxed text-ink-700">
            <li className="flex gap-2.5">
              <Percent aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
              Le numéro est attribué à la création du brouillon, pas à l'envoi.
            </li>
            <li className="flex gap-2.5">
              <LayoutTemplate aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
              Les avoirs suivent leur propre séquence, distincte de celle des factures.
            </li>
            <li className="flex gap-2.5">
              <Hash aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
              Une duplication consomme un numéro : la copie est un document distinct.
            </li>
          </ul>
        </CardBody>
      </Card>
    </Page>
  )
}
