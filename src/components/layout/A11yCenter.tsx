import { Contrast, Focus, RotateCcw, Type, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useA11y, type TextSize } from '@/context/A11yContext'
import { Drawer } from '@/components/ui/Drawer'
import { Button } from '@/components/ui/Button'
import { Switch } from '@/components/ui/Toggle'

const sizes: { value: TextSize; label: string; sample: string }[] = [
  { value: 'sm', label: 'Petit', sample: 'text-xs' },
  { value: 'md', label: 'Normal', sample: 'text-sm' },
  { value: 'lg', label: 'Grand', sample: 'text-base' },
  { value: 'xl', label: 'Très grand', sample: 'text-lg' },
]

function Section({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof Type
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section className="border-b border-ink-100 py-4 first:pt-0 last:border-0">
      <div className="mb-3 flex items-start gap-2.5">
        <Icon aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
        <div>
          <h3 className="text-[0.8125rem] font-semibold text-ink-900">{title}</h3>
          <p className="mt-0.5 text-xs leading-relaxed text-ink-500">{description}</p>
        </div>
      </div>
      {children}
    </section>
  )
}

export function A11yCenter({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { prefs, set, reset } = useA11y()

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Accessibilité"
      description="Ces réglages s'appliquent à toute l'application."
      footer={
        <>
          <Button variant="ghost" iconLeft={<RotateCcw aria-hidden className="h-4 w-4" />} onClick={reset}>
            Rétablir les valeurs par défaut
          </Button>
          <Button variant="primary" onClick={onClose}>
            Terminé
          </Button>
        </>
      }
    >
      <Section icon={Type} title="Taille du texte" description="Agrandit l'ensemble de l'interface, pas seulement le texte.">
        <div role="radiogroup" aria-label="Taille du texte" className="grid grid-cols-4 gap-2">
          {sizes.map((s) => (
            <button
              key={s.value}
              type="button"
              role="radio"
              aria-checked={prefs.textSize === s.value}
              onClick={() => set('textSize', s.value)}
              className={cn(
                'flex flex-col items-center gap-1 rounded-lg border py-3 transition-colors',
                prefs.textSize === s.value
                  ? 'border-brand-500 bg-brand-50 text-brand-700 ring-1 ring-brand-500'
                  : 'border-ink-200 text-ink-600 hover:border-ink-300 hover:bg-ink-50',
              )}
            >
              <span aria-hidden className={cn('font-display font-semibold', s.sample)}>
                Aa
              </span>
              <span className="text-2xs font-medium">{s.label}</span>
            </button>
          ))}
        </div>
      </Section>

      <Section
        icon={Contrast}
        title="Contraste renforcé"
        description="Assombrit les textes secondaires et renforce les bordures."
      >
        <Switch
          label="Activer le contraste renforcé"
          description="Rapport de contraste minimum AAA sur le texte courant."
          checked={prefs.contrast === 'high'}
          onCheckedChange={(v) => set('contrast', v ? 'high' : 'normal')}
        />
      </Section>

      <Section icon={Zap} title="Animations" description="Supprime les transitions et les apparitions animées.">
        <Switch
          label="Réduire les animations"
          description="Suit aussi automatiquement le réglage de votre système."
          checked={prefs.motion === 'reduced'}
          onCheckedChange={(v) => set('motion', v ? 'reduced' : 'full')}
        />
      </Section>

      <Section icon={Focus} title="Focus clavier" description="Épaissit l'indicateur de focus et ajoute un halo.">
        <Switch
          label="Focus renforcé"
          description="Utile pour la navigation exclusivement au clavier."
          checked={prefs.focus === 'strong'}
          onCheckedChange={(v) => set('focus', v ? 'strong' : 'default')}
        />
      </Section>

      <div className="mt-4 rounded-lg border border-ink-200 bg-ink-25 p-3">
        <p className="text-xs font-semibold text-ink-800">Toujours actif</p>
        <ul className="mt-1.5 space-y-1 text-xs leading-relaxed text-ink-500">
          <li>Contraste AA minimum sur tous les textes et composants.</li>
          <li>Navigation complète au clavier, avec lien d'évitement.</li>
          <li>Un statut n'est jamais porté par la couleur seule : texte + icône + couleur.</li>
        </ul>
      </div>
    </Drawer>
  )
}
