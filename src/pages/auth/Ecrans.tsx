import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, Lock, MailCheck, RotateCw, ShieldCheck } from 'lucide-react'
import logoCompteAsso from '@/assets/le-compte-asso-lca.jpg'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { Checkbox } from '@/components/ui/Toggle'
import { CoquilleAuth, MessageErreur } from '@/pages/auth/Coquille'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import {
  DELAI_RENVOI_SECONDES,
  formatCompteARebours,
  masquerEmail,
  niveauLabels,
  reglesMotDePasse,
  robustesse,
} from '@/lib/auth'

/* ------------------------------ Connexion ------------------------------ */

export function EcranConnexion() {
  const { connecter, chargement, verrouillage, tentativesRestantes, allerA } = useAuth()
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [visible, setVisible] = useState(false)
  const [rester, setRester] = useState(true)
  const [erreur, setErreur] = useState<string | null>(null)

  const bloque = verrouillage > 0

  const soumettre = async () => {
    setErreur(null)
    try {
      await connecter(email, motDePasse, rester)
    } catch (e) {
      setErreur((e as Error).message)
    }
  }

  return (
    <CoquilleAuth
      etape="connexion"
      titre="Connexion à votre espace"
      description="Saisissez vos identifiants. Un code de vérification vous sera ensuite demandé."
    >
      <MessageErreur message={erreur} />

      {bloque && (
        <p className="mb-4 rounded-lg border border-danger-100 bg-danger-50 px-3 py-2.5 text-[0.8125rem] leading-relaxed text-danger-700">
          <strong className="font-semibold">Compte verrouillé.</strong> Trop de tentatives infructueuses. Réessayez dans{' '}
          <span className="ac-num font-semibold">{formatCompteARebours(verrouillage)}</span>.
        </p>
      )}

      <div className="flex flex-col gap-4">
        <Field label="Adresse électronique" required>
          {(p) => (
            <Input
              {...p}
              type="email"
              autoComplete="email"
              autoFocus
              disabled={bloque}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void soumettre()}
              placeholder="prenom.nom@association.fr"
            />
          )}
        </Field>

        <Field
          label="Mot de passe"
          required
          hint={
            !bloque && tentativesRestantes < 5 ? `${tentativesRestantes} tentative(s) restante(s) avant verrouillage.` : undefined
          }
        >
          {(p) => (
            <div className="relative">
              <Input
                {...p}
                type={visible ? 'text' : 'password'}
                autoComplete="current-password"
                disabled={bloque}
                value={motDePasse}
                onChange={(e) => setMotDePasse(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && void soumettre()}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setVisible((v) => !v)}
                aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-800"
              >
                {visible ? <EyeOff aria-hidden className="h-4 w-4" /> : <Eye aria-hidden className="h-4 w-4" />}
              </button>
            </div>
          )}
        </Field>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Checkbox checked={rester} onChange={(e) => setRester(e.target.checked)} label="Rester connecté" />
          <button
            type="button"
            onClick={() => allerA('oubli')}
            className="text-[0.8125rem] font-medium text-brand-600 underline-offset-2 hover:underline"
          >
            Mot de passe oublié ?
          </button>
        </div>

        <Button
          variant="primary"
          className="w-full"
          loading={chargement}
          disabled={bloque}
          onClick={() => void soumettre()}
          iconRight={<ArrowRight aria-hidden className="h-4 w-4" />}
        >
          Se connecter
        </Button>

        <div className="flex items-center gap-3" aria-hidden>
          <span className="h-px flex-1 bg-ink-200" />
          <span className="text-2xs font-medium uppercase tracking-wide text-ink-400">ou</span>
          <span className="h-px flex-1 bg-ink-200" />
        </div>

        <Button
          variant="secondary"
          className="w-full"
          onClick={() =>
            toast({
              titre: 'Compte Asso indisponible',
              detail: "Cette fonctionnalité n'est pas encore disponible dans votre ville.",
              tone: 'danger',
            })
          }
          iconLeft={<img src={logoCompteAsso} alt="" className="h-4 w-4 rounded-sm object-contain" />}
        >
          Se connecter avec mon compte Asso
        </Button>
      </div>
    </CoquilleAuth>
  )
}

/* ---------------------------- Vérification ----------------------------- */

export function EcranVerification() {
  const {
    verifierCode, renvoyerCode, annulerVerification, emailEnCours,
    chargement, envoiEnCours, peremption, tentativesCodeRestantes,
  } = useAuth()

  const [chiffres, setChiffres] = useState<string[]>(Array(6).fill(''))
  const [erreur, setErreur] = useState<string | null>(null)
  const [renvoiDans, setRenvoiDans] = useState(DELAI_RENVOI_SECONDES)
  const champs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    champs.current[0]?.focus()
  }, [])

  useEffect(() => {
    if (renvoiDans <= 0) return
    const t = window.setInterval(() => setRenvoiDans((v) => Math.max(v - 1, 0)), 1000)
    return () => window.clearInterval(t)
  }, [renvoiDans])

  const code = chiffres.join('')
  const expire = peremption <= 0

  const valider = async (valeur: string) => {
    setErreur(null)
    try {
      await verifierCode(valeur)
    } catch (e) {
      setErreur((e as Error).message)
      setChiffres(Array(6).fill(''))
      champs.current[0]?.focus()
    }
  }

  const saisir = (index: number, valeur: string) => {
    const propre = valeur.replace(/\D/g, '')
    if (!propre) {
      setChiffres((c) => c.map((x, i) => (i === index ? '' : x)))
      return
    }
    // Le collage d'un code complet remplit tous les champs
    if (propre.length > 1) {
      const complet = propre.slice(0, 6).split('')
      const suivant = Array(6)
        .fill('')
        .map((_, i) => complet[i] ?? '')
      setChiffres(suivant)
      champs.current[Math.min(complet.length, 5)]?.focus()
      if (complet.length === 6) void valider(suivant.join(''))
      return
    }

    const suivant = chiffres.map((x, i) => (i === index ? propre : x))
    setChiffres(suivant)
    if (index < 5) champs.current[index + 1]?.focus()
    if (suivant.every((x) => x)) void valider(suivant.join(''))
  }

  const auClavier = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !chiffres[index] && index > 0) {
      e.preventDefault()
      champs.current[index - 1]?.focus()
      setChiffres((c) => c.map((x, i) => (i === index - 1 ? '' : x)))
    }
    if (e.key === 'ArrowLeft' && index > 0) champs.current[index - 1]?.focus()
    if (e.key === 'ArrowRight' && index < 5) champs.current[index + 1]?.focus()
  }

  return (
    <CoquilleAuth
      etape="verification"
      titre="Vérification en deux étapes"
      description={
        <>
          Un code à six chiffres a été envoyé à <strong className="font-medium text-ink-800">{masquerEmail(emailEnCours)}</strong>. Il
          est valable dix minutes.
        </>
      }
    >
      <MessageErreur message={erreur} />

      {expire && (
        <p className="mb-4 rounded-lg border border-warning-100 bg-warning-50 px-3 py-2.5 text-[0.8125rem] leading-relaxed text-warning-700">
          <strong className="font-semibold">Code expiré.</strong> Demandez-en un nouveau : ressaisir l'ancien ne
          fonctionnera pas.
        </p>
      )}

      <div className="flex flex-col gap-5">
        <fieldset disabled={expire}>
          <legend className="sr-only">Code de vérification à six chiffres</legend>
          <div className="flex justify-between gap-2">
            {chiffres.map((valeur, i) => (
              <input
                key={i}
                ref={(el) => (champs.current[i] = el)}
                type="text"
                inputMode="numeric"
                autoComplete={i === 0 ? 'one-time-code' : 'off'}
                maxLength={6}
                aria-label={`Chiffre ${i + 1} sur 6`}
                value={valeur}
                onChange={(e) => saisir(i, e.target.value)}
                onKeyDown={(e) => auClavier(i, e)}
                className={cn(
                  'ac-num h-14 w-full rounded-xl border text-center font-display text-xl font-semibold text-ink-950 transition-colors',
                  'border-ink-300 bg-white focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100',
                  'disabled:bg-ink-50 disabled:text-ink-400',
                  valeur && 'border-brand-400 bg-brand-50/40',
                )}
              />
            ))}
          </div>
        </fieldset>

        <div className="flex flex-wrap items-center justify-between gap-2 text-[0.8125rem]">
          <span className="ac-num text-ink-500">
            {expire ? 'Code expiré' : `Expire dans ${formatCompteARebours(peremption)}`}
          </span>
          {tentativesCodeRestantes < 3 && !expire && (
            <span className="text-warning-600">{tentativesCodeRestantes} essai(s) restant(s)</span>
          )}
        </div>

        <Button
          variant="primary"
          className="w-full"
          loading={chargement}
          disabled={code.length !== 6 || expire}
          onClick={() => void valider(code)}
          iconLeft={<ShieldCheck aria-hidden className="h-4 w-4" />}
        >
          Vérifier le code
        </Button>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button onClick={annulerVerification} iconLeft={<ArrowLeft aria-hidden className="h-4 w-4" />}>
            Revenir
          </Button>
          <Button
            variant="ghost"
            loading={envoiEnCours}
            disabled={renvoiDans > 0 && !expire}
            iconLeft={<RotateCw aria-hidden className="h-3.5 w-3.5" />}
            onClick={() => {
              setErreur(null)
              setChiffres(Array(6).fill(''))
              void renvoyerCode()
                .then(() => {
                  setRenvoiDans(DELAI_RENVOI_SECONDES)
                  champs.current[0]?.focus()
                })
                .catch((e) => setErreur((e as Error).message))
            }}
          >
            {renvoiDans > 0 && !expire ? `Renvoyer dans ${renvoiDans} s` : 'Renvoyer un code'}
          </Button>
        </div>
      </div>
    </CoquilleAuth>
  )
}

/* -------------------------- Mot de passe oublié ------------------------ */

export function EcranOubli() {
  const { demanderReinitialisation, envoiEnCours, allerA } = useAuth()
  const [email, setEmail] = useState('')
  const [erreur, setErreur] = useState<string | null>(null)

  const soumettre = async () => {
    setErreur(null)
    try {
      await demanderReinitialisation(email)
    } catch (e) {
      setErreur((e as Error).message)
    }
  }

  return (
    <CoquilleAuth
      etape="oubli"
      titre="Mot de passe oublié"
      description="Indiquez votre adresse électronique. Si un compte y est associé, vous recevrez un lien de réinitialisation."
    >
      <MessageErreur message={erreur} />

      <div className="flex flex-col gap-4">
        <Field label="Adresse électronique" required>
          {(p) => (
            <Input
              {...p}
              type="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void soumettre()}
              placeholder="prenom.nom@association.fr"
            />
          )}
        </Field>

        <Button variant="primary" className="w-full" loading={envoiEnCours} onClick={() => void soumettre()}>
          Envoyer le lien de réinitialisation
        </Button>

        <Button variant="ghost" className="w-full" onClick={() => allerA('connexion')} iconLeft={<ArrowLeft aria-hidden className="h-4 w-4" />}>
          Revenir à la connexion
        </Button>
      </div>
    </CoquilleAuth>
  )
}

export function EcranOubliConfirme() {
  const { emailEnCours, demanderReinitialisation, envoiEnCours, allerA } = useAuth()
  const [erreur, setErreur] = useState<string | null>(null)

  return (
    <CoquilleAuth
      etape="oubli-confirme"
      titre="Vérifiez votre boîte de réception"
      description={
        <>
          Si un compte est associé à <strong className="font-medium text-ink-800">{emailEnCours}</strong>, un message
          contenant un lien de réinitialisation vient d'être envoyé. Le lien est valable une heure.
        </>
      }
    >
      <MessageErreur message={erreur} />

      <div className="flex flex-col gap-5">
        <div className="flex items-start gap-3 rounded-xl border border-ink-200 bg-ink-25 p-4">
          <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-brand-600 ring-1 ring-ink-200">
            <MailCheck className="h-4 w-4" />
          </span>
          <p className="text-[0.8125rem] leading-relaxed text-ink-600">
            Nous n'indiquons jamais si une adresse est connue de nos services : c'est ce qui empêche de deviner qui
            possède un compte.
          </p>
        </div>

        <Button
          variant="primary"
          className="w-full"
          onClick={() => allerA('reinitialisation')}
          iconRight={<ArrowRight aria-hidden className="h-4 w-4" />}
        >
          Ouvrir le lien reçu
        </Button>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button variant="ghost" onClick={() => allerA('connexion')} iconLeft={<ArrowLeft aria-hidden className="h-4 w-4" />}>
            Revenir à la connexion
          </Button>
          <Button
            variant="ghost"
            loading={envoiEnCours}
            onClick={() => {
              setErreur(null)
              void demanderReinitialisation(emailEnCours).catch((e) => setErreur((e as Error).message))
            }}
            iconLeft={<RotateCw aria-hidden className="h-3.5 w-3.5" />}
          >
            Renvoyer le message
          </Button>
        </div>
      </div>
    </CoquilleAuth>
  )
}

/* --------------------------- Réinitialisation -------------------------- */

export function EcranReinitialisation() {
  const { reinitialiser, chargement, allerA } = useAuth()
  const [nouveau, setNouveau] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [visible, setVisible] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  const force = robustesse(nouveau)
  const niveau = niveauLabels[force.niveau]

  const soumettre = async () => {
    setErreur(null)
    try {
      await reinitialiser(nouveau, confirmation)
    } catch (e) {
      setErreur((e as Error).message)
    }
  }

  return (
    <CoquilleAuth
      etape="reinitialisation"
      titre="Nouveau mot de passe"
      description="Choisissez un mot de passe que vous n'utilisez nulle part ailleurs."
    >
      <MessageErreur message={erreur} />

      <div className="flex flex-col gap-4">
        <Field label="Nouveau mot de passe" required>
          {(p) => (
            <div className="relative">
              <Input
                {...p}
                type={visible ? 'text' : 'password'}
                autoComplete="new-password"
                autoFocus
                value={nouveau}
                onChange={(e) => setNouveau(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setVisible((v) => !v)}
                aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-800"
              >
                {visible ? <EyeOff aria-hidden className="h-4 w-4" /> : <Eye aria-hidden className="h-4 w-4" />}
              </button>
            </div>
          )}
        </Field>

        {nouveau && (
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-3">
              <span aria-hidden className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-100">
                <span
                  className="block h-full rounded-full transition-[width]"
                  style={{ width: `${force.pourcentage}%`, backgroundColor: niveau.couleur }}
                />
              </span>
              <span className="text-2xs font-medium" style={{ color: niveau.couleur }}>
                {niveau.libelle}
              </span>
            </div>

            <ul className="grid grid-cols-2 gap-1.5">
              {reglesMotDePasse.map((r) => {
                const ok = r.satisfaite(nouveau)
                return (
                  <li key={r.cle} className={cn('flex items-center gap-1.5 text-2xs', ok ? 'text-success-700' : 'text-ink-500')}>
                    <span
                      aria-hidden
                      className={cn(
                        'flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full',
                        ok ? 'bg-success-500 text-white' : 'border border-ink-300',
                      )}
                    >
                      {ok && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
                    </span>
                    {r.libelle}
                    <span className="sr-only">{ok ? ' — satisfaite' : ' — non satisfaite'}</span>
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        <Field
          label="Confirmer le mot de passe"
          required
          error={confirmation && confirmation !== nouveau ? 'Les deux mots de passe ne correspondent pas.' : undefined}
        >
          {(p) => (
            <Input
              {...p}
              type={visible ? 'text' : 'password'}
              autoComplete="new-password"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void soumettre()}
            />
          )}
        </Field>

        <Button
          variant="primary"
          className="w-full"
          loading={chargement}
          disabled={force.satisfaites < force.total || nouveau !== confirmation}
          onClick={() => void soumettre()}
          iconLeft={<Lock aria-hidden className="h-4 w-4" />}
        >
          Enregistrer le nouveau mot de passe
        </Button>

        <Button variant="ghost" className="w-full" onClick={() => allerA('connexion')} iconLeft={<ArrowLeft aria-hidden className="h-4 w-4" />}>
          Revenir à la connexion
        </Button>
      </div>
    </CoquilleAuth>
  )
}

/* ------------------------------ La porte ------------------------------- */

export function PorteAuth({ children }: { children: React.ReactNode }) {
  const { session, etape } = useAuth()

  if (session) return <>{children}</>

  if (etape === 'verification') return <EcranVerification />
  if (etape === 'oubli') return <EcranOubli />
  if (etape === 'oubli-confirme') return <EcranOubliConfirme />
  if (etape === 'reinitialisation') return <EcranReinitialisation />
  return <EcranConnexion />
}
