import { useNavigate } from 'react-router-dom'
import { Building2, Hash, Lock, Pin, Search, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/Input'
import { AvatarPresence, PastilleAssociation } from '@/components/chat/Pieces'
import {
  dernierMessage,
  horodatageCourt,
  interlocuteurDirect,
  membre,
  nomSalon,
  nonLus,
  type MessageChat,
  type Salon,
} from '@/lib/chat'

const groupes: { cle: Salon['type']; titre: string }[] = [
  { cle: 'association', titre: 'Salons de l’association' },
  { cle: 'inter', titre: 'Salons inter-associations' },
  { cle: 'direct', titre: 'Messages directs' },
]

export function ListeSalons({
  salons,
  messages,
  courant,
  filtre,
  onFiltre,
}: {
  salons: Salon[]
  messages: MessageChat[]
  courant: string | null
  filtre: string
  onFiltre: (v: string) => void
}) {
  const navigate = useNavigate()

  const correspond = (s: Salon) => {
    const q = filtre.trim().toLowerCase()
    if (!q) return true
    return `${nomSalon(s)} ${s.description}`.toLowerCase().includes(q)
  }

  const visibles = salons.filter(correspond)
  const epingles = visibles.filter((s) => s.epingle && !s.archive)

  const rendre = (s: Salon) => {
    const actif = s.id === courant
    const n = nonLus(s.id, messages)
    const dernier = dernierMessage(s.id, messages)
    const interlocuteur = interlocuteurDirect(s)
    const auteur = dernier ? membre(dernier.auteurId) : undefined

    return (
      <li key={s.id}>
        <button
          type="button"
          onClick={() => navigate(`/chat-collaboratif/${s.id}`)}
          aria-current={actif ? 'true' : undefined}
          className={cn(
            'flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors',
            actif ? 'bg-white shadow-xs ring-1 ring-ink-200' : 'hover:bg-white/70',
          )}
        >
          {s.type === 'direct' && interlocuteur ? (
            <AvatarPresence personne={interlocuteur} size="xs" />
          ) : (
            <span
              aria-hidden
              className={cn(
                'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded text-ink-500',
                s.type === 'inter' ? 'bg-success-50 text-success-700' : 'bg-ink-100',
              )}
            >
              {s.type === 'inter' ? <Building2 className="h-3 w-3" /> : s.visibilite === 'invitation' ? <Lock className="h-3 w-3" /> : <Hash className="h-3 w-3" />}
            </span>
          )}

          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5">
              <span className={cn('min-w-0 flex-1 truncate text-[0.8125rem]', n > 0 ? 'font-semibold text-ink-900' : 'font-medium text-ink-800')}>
                {nomSalon(s)}
              </span>
              {s.epingle && <Pin aria-hidden className="h-3 w-3 shrink-0 text-ink-400" />}
              {dernier && <span className="ac-num shrink-0 text-[0.5rem] text-ink-500">{horodatageCourt(dernier.quand)}</span>}
            </span>
            <span className="mt-0.5 flex items-center gap-1.5">
              <span className={cn('min-w-0 flex-1 truncate text-2xs', n > 0 ? 'text-ink-700' : 'text-ink-500')}>
                {dernier ? `${auteur?.nom.split(' ')[0]} : ${dernier.contenu || 'pièce jointe'}` : 'Aucun message'}
              </span>
              {n > 0 && (
                <span className="ac-num flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-brand-500 px-1 text-[0.5rem] font-bold text-white">
                  {n}
                </span>
              )}
            </span>
            {s.type === 'direct' && interlocuteur && interlocuteur.associationId !== 'org-1' && (
              <span className="mt-1 block">
                <PastilleAssociation membreId={interlocuteur.id} compact />
              </span>
            )}
            {s.archive && <span className="mt-1 block text-[0.5rem] font-medium uppercase tracking-wide text-warning-600">Archivé</span>}
          </span>
        </button>
      </li>
    )
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <Input
        type="search"
        value={filtre}
        onChange={(e) => onFiltre(e.target.value)}
        placeholder="Filtrer les conversations"
        aria-label="Filtrer les conversations"
        iconLeft={<Search />}
        className="h-8 text-[0.8125rem]"
      />

      <div className="ac-scroll flex-1 overflow-y-auto pr-1">
        {epingles.length > 0 && (
          <div className="mb-3">
            <p className="px-2.5 pb-1 text-[0.5rem] font-semibold uppercase tracking-wide text-ink-500">Épinglés</p>
            <ul className="flex flex-col gap-0.5">{epingles.map(rendre)}</ul>
          </div>
        )}

        {groupes.map((g) => {
          const liste = visibles.filter((s) => s.type === g.cle && !s.epingle)
          const archives = liste.filter((s) => s.archive)
          const actifs = liste.filter((s) => !s.archive)
          if (liste.length === 0) return null
          return (
            <div key={g.cle} className="mb-3">
              <p className="flex items-center gap-1.5 px-2.5 pb-1 text-[0.5rem] font-semibold uppercase tracking-wide text-ink-500">
                {g.cle === 'inter' && <Building2 aria-hidden className="h-2.5 w-2.5" />}
                {g.cle === 'direct' && <Users aria-hidden className="h-2.5 w-2.5" />}
                {g.titre}
              </p>
              <ul className="flex flex-col gap-0.5">{[...actifs, ...archives].map(rendre)}</ul>
            </div>
          )
        })}

        {visibles.length === 0 && (
          <p className="px-2.5 py-6 text-center text-xs text-ink-500">Aucune conversation ne correspond à ce filtre.</p>
        )}
      </div>
    </div>
  )
}
