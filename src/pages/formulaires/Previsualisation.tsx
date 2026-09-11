import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Laptop, LayoutTemplate, Smartphone } from 'lucide-react'
import { Card, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { EmptyState } from '@/components/ui/EmptyState'
import { cn } from '@/lib/utils'
import { FormulairePage } from '@/components/formulaires/FormulairePage'
import { ChampRendu } from '@/components/formulaires/ChampRendu'
import { champVisible, champsSaisissables, type Champ, type Formulaire } from '@/lib/formulaires'

function CorpsApercu({ formulaire }: { formulaire: Formulaire }) {
  const navigate = useNavigate()
  const [mobile, setMobile] = useState(false)
  const [valeurs, setValeurs] = useState<Record<string, string | string[]>>({})

  if (champsSaisissables(formulaire).length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<LayoutTemplate />}
          title="Ce formulaire n’a encore aucun champ"
          description="Ajoutez des questions dans l’éditeur pour voir apparaître un aperçu."
          action={<Button variant="primary" onClick={() => navigate(`/formulaires/${formulaire.id}/editeur`)}>Ouvrir l’éditeur</Button>}
        />
      </Card>
    )
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Alert tone="neutral" titre="Ceci est un aperçu" className="flex-1">
          Les réponses saisies ici ne sont ni transmises ni conservées.
        </Alert>
        <div role="group" aria-label="Appareil de prévisualisation" className="flex items-center gap-0.5 rounded-lg border border-ink-200 p-0.5">
          <button
            type="button"
            aria-pressed={!mobile}
            onClick={() => setMobile(false)}
            className={cn('flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors', !mobile ? 'bg-ink-900 text-white' : 'text-ink-600 hover:bg-ink-100')}
          >
            <Laptop aria-hidden className="h-3.5 w-3.5" />
            Ordinateur
          </button>
          <button
            type="button"
            aria-pressed={mobile}
            onClick={() => setMobile(true)}
            className={cn('flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors', mobile ? 'bg-ink-900 text-white' : 'text-ink-600 hover:bg-ink-100')}
          >
            <Smartphone aria-hidden className="h-3.5 w-3.5" />
            Mobile
          </button>
        </div>
      </div>

      <div className="flex justify-center rounded-2xl border border-ink-200 bg-ink-100 p-4 sm:p-8">
        <div className={cn('w-full transition-[max-width]', mobile ? 'max-w-sm' : 'max-w-2xl')}>
          <Card>
            <CardBody className="flex flex-col gap-5">
              <div className="border-b border-ink-100 pb-4">
                <h2 className="font-display text-lg font-semibold text-ink-950">{formulaire.titre || 'Sans titre'}</h2>
                {formulaire.description && <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-ink-500">{formulaire.description}</p>}
              </div>

              {formulaire.champs
                .filter((c) => champVisible(c, valeurs))
                .map((champ: Champ) => (
                  <ChampRendu
                    key={champ.id}
                    champ={champ}
                    valeur={valeurs[champ.id]}
                    onChange={(v) => setValeurs((vs) => ({ ...vs, [champ.id]: v }))}
                  />
                ))}

              <Button variant="primary" disabled className="self-start">
                Envoyer (aperçu uniquement)
              </Button>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  )
}

export function Previsualisation() {
  return <FormulairePage eyebrow="Formulaires">{(f) => <CorpsApercu formulaire={f} />}</FormulairePage>
}
