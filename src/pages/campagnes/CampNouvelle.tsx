import { usePageTitle } from '@/hooks/usePageTitle'
import { useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AtSign, CalendarClock, Send, Sparkles } from 'lucide-react'
import { Page, PageHeader } from '@/components/layout/PageLayout'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Field } from '@/components/ui/Field'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { Switch } from '@/components/ui/Toggle'
import { Alert } from '@/components/ui/Alert'
import { FormulaireEtapes } from '@/components/ui/FormulaireEtapes'
import { CampNav, CampOutils } from '@/components/campagnes/CampNav'
import { DefinitionEditeur } from '@/components/campagnes/Definition'
import { CorpsRendu } from '@/components/campagnes/CorpsRendu'
import { useCampagnes, type SaisieCampagne } from '@/context/CampagnesContext'
import { useToast } from '@/context/ToastContext'
import {
  champsPersonnalisation,
  cibleDefinition,
  cibleNom,
  decompteSegment,
  definitionVide,
  personnaliser,
  type CibleCampagne,
} from '@/lib/campagnes'
import { cn, toInputDate } from '@/lib/utils'

export function CampNouvelle() {
  usePageTitle('Nouvelle campagne')

  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { campagnes, modeles, segments, desinscritsIds, envoyer, programmer, envoyerTest } = useCampagnes()
  const { toast } = useToast()

  const brouillonId = params.get('brouillon') ?? undefined
  const modeleId = params.get('modele') ?? undefined

  const brouillon = useMemo(() => (brouillonId ? campagnes.find((c) => c.id === brouillonId) : undefined), [campagnes, brouillonId])
  const modele = useMemo(() => (modeleId ? modeles.find((m) => m.id === modeleId) : undefined), [modeles, modeleId])

  const [nom, setNom] = useState(brouillon?.nom ?? '')
  const [objet, setObjet] = useState(brouillon?.objet ?? modele?.objet ?? '')
  const [previsualisation, setPrevisualisation] = useState(brouillon?.previsualisation ?? modele?.previsualisation ?? '')
  const [corps, setCorps] = useState(brouillon?.corps ?? modele?.corps ?? '')
  const [expediteurNom, setExpediteurNom] = useState(brouillon?.expediteurNom ?? 'Les Amis du Vieux Moulin')
  const [adresseReponse, setAdresseReponse] = useState(brouillon?.adresseReponse ?? 'contact@vieuxmoulin.fr')

  const [cible, setCible] = useState<CibleCampagne>(() =>
    brouillon?.cible ??
    (segments[0] ? { type: 'segment', segmentId: segments[0].id, nom: segments[0].nom, definition: segments[0].definition } : { type: 'libre', definition: definitionVide() }),
  )
  const [immediat, setImmediat] = useState(brouillon?.immediat ?? true)
  const jourDefaut = toInputDate(new Date().toISOString())
  const [dateValeur, setDateValeur] = useState(brouillon?.programmeeLe?.slice(0, 10) ?? jourDefaut)
  const [heureValeur, setHeureValeur] = useState(brouillon?.programmeeLe?.slice(11, 16) ?? '10:00')

  const [erreurs, setErreurs] = useState<Record<string, string>>({})
  const [global, setGlobal] = useState<string | null>(null)
  const [enCours, setEnCours] = useState(false)
  const [testEnCours, setTestEnCours] = useState(false)
  const texteRef = useRef<HTMLTextAreaElement>(null)

  const programmeeLe = `${dateValeur}T${heureValeur}:00.000Z`

  const saisieCourante = (): SaisieCampagne => ({
    nom, objet, previsualisation, corps, expediteurNom, adresseReponse, cible, immediat,
    programmeeLe: immediat ? null : programmeeLe,
    brouillonId,
  })

  const decompte = decompteSegment(cibleDefinition(cible), desinscritsIds)

  const insererChamp = (champ: string) => {
    const el = texteRef.current
    const debut = el?.selectionStart ?? corps.length
    const fin = el?.selectionEnd ?? corps.length
    const suivant = corps.slice(0, debut) + champ + corps.slice(fin)
    setCorps(suivant)
    window.setTimeout(() => {
      el?.focus()
      const pos = debut + champ.length
      el?.setSelectionRange(pos, pos)
    }, 0)
  }

  const validerContenu = () => {
    const e: Record<string, string> = {}
    if (!objet.trim()) e.objet = "Un e-mail sans objet a peu de chances d'être lu. Donnez-lui un titre."
    setErreurs(e)
    return e
  }

  const validerEnvoi = () => {
    const e: Record<string, string> = {}
    if (immediat && decompte.joignables === 0) e.cible = 'Cette sélection ne retient personne de joignable : ajustez les critères.'
    setErreurs(e)
    return e
  }

  const terminer = async () => {
    const s = { ...saisieCourante(), objet: objet.trim() }
    if (!s.objet.trim()) {
      setErreurs({ objet: "Un e-mail sans objet a peu de chances d'être lu. Donnez-lui un titre." })
      return
    }
    setGlobal(null)
    setEnCours(true)
    try {
      if (immediat) {
        const id = await envoyer(s)
        toast({ titre: 'Campagne envoyée', detail: 'Le message est parti vers ses destinataires.', tone: 'success' })
        navigate(`/campagnes-emailing/${id}`)
      } else {
        const id = await programmer(s, programmeeLe)
        toast({ titre: 'Campagne programmée', detail: `Départ prévu le ${dateValeur} à ${heureValeur}.`, tone: 'success' })
        navigate(`/campagnes-emailing/${id}`)
      }
    } catch (err) {
      setGlobal(err instanceof Error ? err.message : "L'opération a échoué.")
    } finally {
      setEnCours(false)
    }
  }

  const envoyerTestPresse = async () => {
    setGlobal(null)
    setTestEnCours(true)
    try {
      const s = saisieCourante()
      await envoyerTest(s)
      toast({ titre: 'E-mail de test envoyé', detail: 'Vérifiez la réception dans votre boîte de réception.', tone: 'success' })
    } catch (err) {
      setGlobal(err instanceof Error ? err.message : "L'envoi du test a échoué.")
    } finally {
      setTestEnCours(false)
    }
  }

  return (
    <Page
      width="narrow"
      header={
        <PageHeader
          eyebrow="Campagne d’emailing"
          title={brouillon ? `Reprendre — ${brouillon.nom}` : modele ? `Composer depuis « ${modele.nom} »` : 'Nouvelle campagne'}
          description="Quatre étapes : choisir les destinataires, rédiger, vérifier le rendu, envoyer."
          actions={<CampOutils />}
        />
      }
    >
      <CampNav />

      {global && <Alert tone="danger" titre="Opération impossible">{global}</Alert>}

      <FormulaireEtapes
        labelFil="Étapes de création de la campagne"
        onAnnuler={() => navigate('/campagnes-emailing/liste')}
        onTerminer={terminer}
        libelleTerminer={immediat ? 'Envoyer maintenant' : 'Programmer l’envoi'}
        enCours={enCours}
        onErreurs={setErreurs}
        resume={enCours ? undefined : (immediat ? 'Départ immédiat' : `Départ le ${dateValeur} à ${heureValeur}`)}
        etapes={[
          {
            titre: 'Destinataires',
            description: "Le public de l'envoi : un segment existant ou une sélection construite à la volée.",
            contenu: (
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      { valeur: false as const, label: 'Un segment existant' },
                      { valeur: true as const, label: 'Une sélection à la volée' },
                    ] as const
                  ).map((opt) => {
                    const actif = (cible.type === 'libre') === opt.valeur
                    return (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => {
                          if (opt.valeur) {
                            setCible({ type: 'libre', definition: definitionVide() })
                          } else if (!cible || cible.type === 'libre') {
                            const s = segments[0]
                            setCible(s ? { type: 'segment', segmentId: s.id, nom: s.nom, definition: s.definition } : { type: 'libre', definition: definitionVide() })
                          }
                        }}
                        className={cn(
                          'rounded-lg border px-3 py-2 text-[0.8125rem] font-medium transition-colors',
                          actif ? 'border-brand-500 bg-brand-50 text-brand-800' : 'border-ink-200 text-ink-600 hover:border-ink-300',
                        )}
                      >
                        {opt.label}
                      </button>
                    )
                  })}
                </div>

                {cible.type === 'segment' ? (
                  <Field label="Segment" error={erreurs.cible} hint="Le segment conserve sa définition ; vos modifications ne l'altèrent pas.">
                    {(props) => (
                      <Select
                        {...props}
                        value={cible.segmentId}
                        onChange={(e) => {
                          const s = segments.find((x) => x.id === e.target.value)
                          if (s) setCible({ type: 'segment', segmentId: s.id, nom: s.nom, definition: s.definition })
                        }}
                        options={segments.map((s) => ({ value: s.id, label: s.nom }))}
                      />
                    )}
                  </Field>
                ) : null}

                <Card className="p-4">
                  <p className="mb-3 text-[0.8125rem] font-medium text-ink-800">
                    {cible.type === 'segment' ? 'Réglage des critères du segment ciblé' : 'Définissez le périmètre de l’envoi'}
                  </p>
                  <DefinitionEditeur
                    definition={cibleDefinition(cible)}
                    onChange={(d) => setCible((c) => ({ ...c, definition: d }))}
                  />
                </Card>
              </div>
            ),
          },
          {
            titre: 'Contenu',
            description: "L'objet et le corps du message. Sauf indication, l'expéditeur est celui de l'association.",
            valider: validerContenu,
            contenu: (
              <div className="flex flex-col gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Nom interne" hint="Visible par l'équipe, jamais envoyé.">
                    {(props) => <Input {...props} value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex. Lettre d'information d'octobre" />}
                  </Field>
                  <Field label="Objet" required error={erreurs.objet}>
                    {(props) => <Input {...props} value={objet} onChange={(e) => setObjet(e.target.value)} placeholder="Ce que verront vos destinataires" />}
                  </Field>
                </div>

                <Field label="Prévisualisation" hint={`Le texte sous l'objet. ${previsualisation.length}/140 caractères.`}>
                  {(props) => (
                    <Input
                      {...props}
                      value={previsualisation}
                      onChange={(e) => setPrevisualisation(e.target.value)}
                      maxLength={140}
                      placeholder="Résumez le contenu pour inciter à l'ouverture…"
                    />
                  )}
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Nom d'expéditeur">
                    {(props) => <Input {...props} value={expediteurNom} onChange={(e) => setExpediteurNom(e.target.value)} />}
                  </Field>
                  <Field label="Adresse de réponse">
                    {(props) => <Input {...props} type="email" value={adresseReponse} onChange={(e) => setAdresseReponse(e.target.value)} />}
                  </Field>
                </div>

                <Field
                  label="Corps du message"
                  hint="Personnalisez avec les champs ci-dessous. Rendu léger Markdown : **gras**, *italique*, __souligné__, puces."
                  labelSuffix={
                    <span className="flex flex-wrap items-center gap-1">
                      {champsPersonnalisation.map((c) => (
                        <button
                          key={c.valeur}
                          type="button"
                          onClick={() => insererChamp(c.valeur)}
                          className="inline-flex items-center gap-1 rounded-md border border-ink-200 bg-white px-1.5 py-0.5 text-2xs font-medium text-ink-700 transition-colors hover:border-brand-400 hover:text-brand-700"
                        >
                          <AtSign aria-hidden className="h-3 w-3" />
                          {c.label}
                        </button>
                      ))}
                    </span>
                  }
                >
                  {(props) => (
                    <Textarea
                      ref={texteRef}
                      {...props}
                      rows={9}
                      value={corps}
                      onChange={(e) => setCorps(e.target.value)}
                      placeholder={'Bonjour {{prenom}},\n\n…'}
                    />
                  )}
                </Field>
              </div>
            ),
          },
          {
            titre: 'Aperçu',
            description: "Le message tel qu'il arrivera, avec les champs personnalisés remplacés pour un exemple.",
            contenu: (
              <div className="grid gap-4 lg:grid-cols-2">
                <div>
                  <p className="mb-2 text-[0.8125rem] font-medium text-ink-800">Message</p>
                  <div className="rounded-xl border border-ink-200 p-4">
                    <p className="text-xs text-ink-500">
                      {expediteurNom.trim() || 'Les Amis du Vieux Moulin'} &lt;{adresseReponse || 'contact@vieuxmoulin.fr'}&gt;
                    </p>
                    <p className="mt-1 text-sm font-semibold text-ink-900">{objet || 'Sans objet'}</p>
                    {previsualisation && <p className="mt-0.5 text-xs text-ink-500">{previsualisation}</p>}
                    <div className="mt-3 border-t border-ink-100 pt-3">
                      <CorpsRendu texte={personnaliser(corps, { prenom: 'Amina', nom: 'Benali' })} />
                    </div>
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-[0.8125rem] font-medium text-ink-800">
                    Destinataires — {cibleNom(cible)}
                  </p>
                  <div className="rounded-xl border border-ink-200 p-4">
                    <p className="text-[0.8125rem] font-semibold text-ink-900">
                      {decompte.joignables.toLocaleString('fr-FR')} personne{decompte.joignables > 1 ? 's' : ''} joignable{decompte.joignables > 1 ? 's' : ''}
                    </p>
                    <p className="mt-0.5 text-xs text-ink-500">
                      {decompte.total} retenu{decompte.total > 1 ? 's' : ''} au total, avant exclusions (consentements, désinscriptions, adresses invalides).
                    </p>
                    {decompte.personnes.length > 0 ? (
                      <ul className="mt-3 flex flex-col gap-1.5">
                        {decompte.personnes.slice(0, 6).map((p) => (
                          <li key={p.id} className="text-[0.8125rem] text-ink-700">
                            {p.prenom} {p.nom} <span className="text-ink-500">· {p.email}</span>
                          </li>
                        ))}
                        {decompte.personnes.length > 6 && (
                          <li className="text-xs text-ink-500">… et {decompte.personnes.length - 6} autres.</li>
                        )}
                      </ul>
                    ) : (
                      <p className="mt-3 text-[0.8125rem] text-ink-500">Aucune personne joignable sur ce périmètre.</p>
                    )}
                  </div>
                </div>
              </div>
            ),
          },
          {
            titre: 'Envoi',
            description: "Le départ immédiat ou programmé. Un test permet de valider la réception avant l'envoi.",
            valider: validerEnvoi,
            contenu: (
              <div className="flex flex-col gap-4">
                <div className="rounded-xl border border-ink-200 p-4">
                  <Switch
                    checked={!immediat}
                    onCheckedChange={(v) => setImmediat(!v)}
                    label="Programmer le départ"
                    description="Choisissez une date et une heure pour lancer l'envoi."
                  />
                </div>

                {!immediat ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Date" required error={erreurs.date}>
                      {(props) => <Input {...props} type="date" min={jourDefaut} value={dateValeur} onChange={(e) => setDateValeur(e.target.value)} />}
                    </Field>
                    <Field label="Heure" required>
                      {(props) => <Input {...props} type="time" value={heureValeur} onChange={(e) => setHeureValeur(e.target.value)} />}
                    </Field>
                  </div>
                ) : (
                  <p className="flex items-center gap-1.5 text-[0.8125rem] text-ink-500">
                    <CalendarClock aria-hidden className="h-4 w-4 text-ink-400" />
                    L'envoi partira dès la validation. Sous quelques secondes, la campagne passera à « envoyée ».
                  </p>
                )}

                <div className="rounded-xl border border-ink-200 p-4">
                  <p className="flex items-center gap-1.5 text-[0.8125rem] font-medium text-ink-800">
                    <Sparkles aria-hidden className="h-4 w-4 text-brand-500" />
                    Tester avant de partir
                  </p>
                  <p className="mt-0.5 text-xs text-ink-500">
                    Un exemplaire du message sera envoyé à votre propre adresse, sans affecter le décompte des destinataires.
                  </p>
                  <Button className="mt-3" onClick={envoyerTestPresse} loading={testEnCours} iconLeft={<Send aria-hidden className="h-4 w-4" />}>
                    Envoyer un e-mail de test
                  </Button>
                </div>
              </div>
            ),
          },
        ]}
      />
    </Page>
  )
}