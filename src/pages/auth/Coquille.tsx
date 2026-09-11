import { useEffect, useRef, type ReactNode } from 'react'
import { FlaskConical } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Menu } from '@/components/ui/Menu'
import { Chip } from '@/components/ui/Badge'
import { useAuth, type ModeDemoAuth } from '@/context/AuthContext'
import logo from '@/assets/logo.png'

const modes: { value: ModeDemoAuth; label: string }[] = [
  { value: 'normal', label: 'Données normales' },
  { value: 'identifiants', label: 'Identifiants incorrects' },
  { value: 'verrouille', label: 'Compte verrouillé' },
  { value: 'code-expire', label: 'Code expiré' },
  { value: 'echec-envoi', label: 'Échec d’envoi du code' },
  { value: 'indisponible', label: 'Service indisponible' },
]

export function OutilsAuth() {
  const { mode, setMode } = useAuth()
  return (
    <div className="flex items-center gap-2">
      {mode !== 'normal' && (
        <Chip icon={<FlaskConical aria-hidden className="h-3 w-3 text-ink-500" />}>
          {modes.find((m) => m.value === mode)?.label}
        </Chip>
      )}
      <Menu
        label="États de démonstration"
        width="w-60"
        items={modes.map((m) => ({ label: (mode === m.value ? '✓ ' : '') + m.label, onSelect: () => setMode(m.value) }))}
        trigger={({ toggle, open, ref }) => (
          <Button ref={ref} size="sm" onClick={toggle} aria-expanded={open} aria-haspopup="menu" iconLeft={<FlaskConical aria-hidden className="h-3.5 w-3.5" />}>
            États
          </Button>
        )}
      />
    </div>
  )
}

/**
 * Coquille des écrans d'authentification : formulaire à gauche, panneau de
 * marque à droite. Le focus se déplace et s'annonce à chaque changement d'étape.
 */
export function CoquilleAuth({
  etape,
  titre,
  description,
  children,
  pied,
}: {
  /** Sert de clé au déplacement du focus. */
  etape: string
  titre: string
  description: ReactNode
  children: ReactNode
  pied?: ReactNode
}) {
  const ref = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    ref.current?.focus()
  }, [etape])

  return (
    <div className="flex h-full min-h-0 bg-white">
      {/* Formulaire */}
      <div className="ac-scroll flex min-h-0 w-full flex-col overflow-y-auto lg:w-[46rem] lg:shrink-0">
        <header className="flex items-center justify-between px-6 py-5 sm:px-10">
          <span className="flex items-center gap-2.5">
            <img src={logo} alt="AssoConnex" className="h-[1.35rem] w-auto object-contain" />
          </span>
          <OutilsAuth />
        </header>

        <main className="flex flex-1 items-center px-6 pb-10 sm:px-10">
          <div className="mx-auto w-full max-w-[26rem]">
            <h1
              ref={ref}
              tabIndex={-1}
              className="font-display text-[1.75rem] font-semibold leading-tight tracking-tight text-ink-950 outline-none"
            >
              {titre}
            </h1>
            <div className="mt-2 text-[0.875rem] leading-relaxed text-ink-500">{description}</div>
            <div className="mt-7">{children}</div>
            {pied && <div className="mt-7 border-t border-ink-100 pt-5">{pied}</div>}
          </div>
        </main>

      </div>

      {/* Panneau de marque */}
      <aside
        aria-hidden
        className="relative hidden min-h-0 flex-1 overflow-hidden bg-ink-950 lg:block"
      >
        <span className="absolute -right-24 -top-24 h-[28rem] w-[28rem] rounded-full bg-brand-500/25 blur-3xl" />
        <span className="absolute -bottom-32 -left-16 h-[24rem] w-[24rem] rounded-full bg-brand-700/30 blur-3xl" />
        <span
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        <div className="relative flex h-full flex-col justify-between p-12 xl:p-16">
          <span className="font-display text-lg font-semibold tracking-tight text-white">
            AssoConnex<span className="text-brand-400">°</span>
          </span>

          <div className="max-w-[26rem]">
            <p className="font-display text-[2rem] font-semibold leading-[1.15] tracking-tight text-white">
              La gestion associative, et ce que les autres oublient : travailler ensemble.
            </p>
            <p className="mt-5 text-[0.9375rem] leading-relaxed text-white/60">
              Adhérents, comptabilité, projets, agenda et planning dans un même produit. Et des salons partagés avec les
              associations de votre ville, parce qu'une action se mène rarement seul.
            </p>

            <ul className="mt-8 flex flex-col gap-2.5">
              {['Vingt-deux modules pensés pour le quotidien associatif', 'Collaboration inter-associations native', 'Accessible, sobre, en français'].map((t) => (
                <li key={t} className="flex items-center gap-2.5 text-[0.8125rem] text-white/70">
                  <span aria-hidden className="h-1 w-1 rounded-full bg-brand-400" />
                  {t}
                </li>
              ))}
            </ul>
          </div>

        </div>
      </aside>
    </div>
  )
}

/** Bandeau d'erreur, annoncé aux lecteurs d'écran. */
export function MessageErreur({ message }: { message: string | null }) {
  return (
    <div role="alert" aria-live="assertive" className={cn(!message && 'sr-only')}>
      {message && (
        <p className="mb-4 rounded-lg border border-danger-100 bg-danger-50 px-3 py-2.5 text-[0.8125rem] leading-relaxed text-danger-700">
          {message}
        </p>
      )}
    </div>
  )
}
