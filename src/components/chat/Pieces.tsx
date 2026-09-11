import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui/Avatar'
import { associationDe, associationsChat, estExterne, membre, type MembreChat } from '@/lib/chat'

/** Pastille de l'association d'origine : indispensable dans les salons inter-associations. */
export function PastilleAssociation({ membreId, compact = false }: { membreId: string; compact?: boolean }) {
  const asso = associationDe(membreId)
  if (!asso) return null
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 font-medium',
        compact ? 'text-[0.5rem]' : 'text-2xs',
      )}
      style={{ backgroundColor: `${asso.couleur}18`, color: asso.couleur }}
      title={asso.nom}
    >
      <span aria-hidden className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: asso.couleur }} />
      {asso.courte}
    </span>
  )
}

/** Avatar surmonté d'un point de présence. */
export function AvatarPresence({ personne, size = 'sm' }: { personne: MembreChat; size?: 'xs' | 'sm' | 'md' }) {
  return (
    <span className="relative inline-flex shrink-0">
      <Avatar name={personne.nom} size={size} />
      <span
        aria-hidden
        className={cn(
          'absolute -bottom-0.5 -right-0.5 rounded-full ring-2 ring-white',
          size === 'xs' ? 'h-2 w-2' : 'h-2.5 w-2.5',
          personne.enLigne ? 'bg-success-500' : 'bg-ink-300',
        )}
      />
      <span className="sr-only">{personne.enLigne ? 'En ligne' : 'Hors ligne'}</span>
    </span>
  )
}

/** Contenu du message, mentions mises en valeur. */
export function ContenuMessage({ contenu, mentions }: { contenu: string; mentions: string[] }) {
  const nomsMentionnes = mentions.map((id) => membre(id)?.nom).filter(Boolean) as string[]
  const morceaux = contenu.split(/(@[^@]+?)(?=\s{1}[a-zà-ÿ]|\s*$|[,.?!])/g).filter(Boolean)

  return (
    <p className="whitespace-pre-wrap text-[0.8125rem] leading-relaxed text-ink-800">
      {morceaux.map((m, i) => {
        const nettoye = m.trim().replace(/^@/, '')
        const estMention = m.trim().startsWith('@') && nomsMentionnes.some((n) => nettoye.startsWith(n))
        if (!estMention) return <span key={i}>{m}</span>
        return (
          <span key={i} className="rounded bg-brand-50 px-1 font-medium text-brand-700">
            {m}
          </span>
        )
      })}
    </p>
  )
}

export function ListeAssociations({ ids }: { ids: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {ids.map((id) => {
        const a = associationsChat.find((x) => x.id === id)
        if (!a) return null
        return (
          <span
            key={id}
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-2xs font-medium"
            style={{ backgroundColor: `${a.couleur}14`, color: a.couleur }}
          >
            <span aria-hidden className="h-2 w-2 rounded-full" style={{ backgroundColor: a.couleur }} />
            {a.nom}
            {a.interne && <span className="text-ink-500">· la vôtre</span>}
          </span>
        )
      })}
    </div>
  )
}

export { estExterne }
