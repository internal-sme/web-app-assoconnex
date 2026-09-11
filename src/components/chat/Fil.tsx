import { useState } from 'react'
import { AlertTriangle, CornerUpLeft, Loader2, Paperclip, Pencil, Pin, RotateCw, Send, SmilePlus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Input'
import { Menu } from '@/components/ui/Menu'
import { AvatarPresence, ContenuMessage, PastilleAssociation } from '@/components/chat/Pieces'
import {
  MOI_CHAT,
  estExterne,
  heureCourte,
  jourRelatif,
  membre,
  reponsesDe,
  type MessageChat,
  type Salon,
} from '@/lib/chat'

const EMOJIS = ['👍', '🙏', '🎉', '👏', '❤️', '😊']

export function Message({
  message,
  salon,
  messages,
  montrerAuteur,
  onRepondre,
  onReagir,
  onEpingler,
  onModifier,
  onSupprimer,
  onReessayer,
  compact = false,
}: {
  message: MessageChat
  salon: Salon
  messages: MessageChat[]
  montrerAuteur: boolean
  onRepondre?: (m: MessageChat) => void
  onReagir: (id: string, emoji: string) => void
  onEpingler: (m: MessageChat) => void
  onModifier: (m: MessageChat) => void
  onSupprimer: (m: MessageChat) => void
  onReessayer: (m: MessageChat) => void
  compact?: boolean
}) {
  const auteur = membre(message.auteurId)
  const estMoi = message.auteurId === MOI_CHAT
  const reponses = reponsesDe(message.id, messages)
  const externe = estExterne(message.auteurId)

  if (message.supprime) {
    return (
      <div className="flex gap-2.5 px-3 py-1.5">
        <span className="w-8 shrink-0" />
        <p className="text-xs italic text-ink-500">Message supprimé par son auteur.</p>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'group relative px-3 py-1.5 transition-colors hover:bg-ink-25',
        message.epingle && 'bg-warning-50/40',
        message.statutEnvoi === 'echec' && 'bg-danger-50/50',
      )}
    >
      <div className="flex gap-2.5">
        <span className="w-8 shrink-0">
          {montrerAuteur && auteur && <AvatarPresence personne={auteur} size="sm" />}
        </span>

        <div className="min-w-0 flex-1">
          {montrerAuteur && (
            <p className="flex flex-wrap items-baseline gap-2">
              <span className="text-[0.8125rem] font-semibold text-ink-900">{auteur?.nom}</span>
              {externe && <PastilleAssociation membreId={message.auteurId} />}
              <span className="ac-num text-2xs text-ink-500">{heureCourte(message.quand)}</span>
              {message.epingle && (
                <span className="inline-flex items-center gap-1 text-2xs text-warning-700">
                  <Pin aria-hidden className="h-2.5 w-2.5" />
                  Épinglé
                </span>
              )}
            </p>
          )}

          <ContenuMessage contenu={message.contenu} mentions={message.mentions} />

          {message.modifieLe && <span className="text-[0.5rem] text-ink-500">(modifié)</span>}

          {message.piecesJointes.length > 0 && (
            <ul className="mt-1.5 flex flex-col gap-1">
              {message.piecesJointes.map((p) => (
                <li key={p.id} className="flex w-fit items-center gap-2 rounded-lg border border-ink-200 bg-white px-2.5 py-1.5">
                  <Paperclip aria-hidden className="h-3.5 w-3.5 shrink-0 text-ink-500" />
                  <span className="text-2xs font-medium text-ink-900">{p.nom}</span>
                  <span className="ac-num text-[0.5rem] text-ink-500">{p.taille}</span>
                </li>
              ))}
            </ul>
          )}

          {message.reactions.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {message.reactions.map((r) => {
                const jeReagis = r.membresIds.includes(MOI_CHAT)
                return (
                  <button
                    key={r.emoji}
                    type="button"
                    onClick={() => onReagir(message.id, r.emoji)}
                    aria-pressed={jeReagis}
                    title={r.membresIds.map((id) => membre(id)?.nom).join(', ')}
                    className={cn(
                      'flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-2xs transition-colors',
                      jeReagis ? 'border-brand-300 bg-brand-50 text-brand-700' : 'border-ink-200 bg-white text-ink-600 hover:bg-ink-50',
                    )}
                  >
                    <span aria-hidden>{r.emoji}</span>
                    <span className="ac-num">{r.membresIds.length}</span>
                  </button>
                )
              })}
            </div>
          )}

          {message.statutEnvoi === 'en_cours' && (
            <p className="mt-1 flex items-center gap-1.5 text-2xs text-ink-500">
              <Loader2 aria-hidden className="h-3 w-3 animate-spin" />
              Envoi en cours…
            </p>
          )}

          {message.statutEnvoi === 'echec' && (
            <p className="mt-1 flex flex-wrap items-center gap-2 text-2xs text-danger-700">
              <AlertTriangle aria-hidden className="h-3 w-3" />
              Le message n'est pas parti.
              <Button size="sm" variant="ghost" onClick={() => onReessayer(message)} iconLeft={<RotateCw aria-hidden className="h-3 w-3" />}>
                Réessayer
              </Button>
              <Button size="sm" variant="ghost" className="text-ink-500" onClick={() => onSupprimer(message)}>
                Abandonner
              </Button>
            </p>
          )}

          {!compact && reponses.length > 0 && (
            <button
              type="button"
              onClick={() => onRepondre?.(message)}
              className="mt-1.5 flex items-center gap-1.5 text-2xs font-medium text-brand-600 underline-offset-2 hover:underline"
            >
              <CornerUpLeft aria-hidden className="h-3 w-3" />
              {reponses.length} réponse{reponses.length > 1 ? 's' : ''} — voir le fil
            </button>
          )}
        </div>

        {/* Actions au survol */}
        {!salon.archive && message.statutEnvoi === 'envoye' && (
          <div className="absolute right-3 top-1 flex items-center gap-0.5 rounded-lg border border-ink-200 bg-white p-0.5 opacity-0 shadow-xs transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
            <Menu
              label="Réagir au message"
              width="w-auto"
              items={EMOJIS.map((e) => ({ label: e, onSelect: () => onReagir(message.id, e) }))}
              trigger={({ toggle, open, ref }) => (
                <Button ref={ref} variant="icon" size="sm" label="Réagir" aria-expanded={open} aria-haspopup="menu" onClick={toggle}>
                  <SmilePlus aria-hidden className="h-3.5 w-3.5" />
                </Button>
              )}
            />
            {!compact && onRepondre && (
              <Button variant="icon" size="sm" label="Répondre dans un fil" onClick={() => onRepondre(message)}>
                <CornerUpLeft aria-hidden className="h-3.5 w-3.5" />
              </Button>
            )}
            <Menu
              label="Autres actions sur le message"
              items={[
                { label: message.epingle ? 'Désépingler' : 'Épingler dans le salon', icon: <Pin />, onSelect: () => onEpingler(message) },
                ...(estMoi ? [{ label: 'Modifier', icon: <Pencil />, onSelect: () => onModifier(message) }] : []),
                { type: 'separator' as const },
                {
                  label: estMoi ? 'Supprimer mon message' : 'Supprimer ce message',
                  icon: <Trash2 />,
                  danger: true,
                  onSelect: () => onSupprimer(message),
                },
              ]}
              trigger={({ toggle, open, ref }) => (
                <Button ref={ref} variant="icon" size="sm" label="Autres actions" aria-expanded={open} aria-haspopup="menu" onClick={toggle}>
                  <span aria-hidden className="text-sm leading-none">⋯</span>
                </Button>
              )}
            />
          </div>
        )}
      </div>
    </div>
  )
}

/** Séparateur de jour dans le fil. */
export function SeparateurJour({ quand }: { quand: string }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2">
      <span aria-hidden className="h-px flex-1 bg-ink-100" />
      <span className="text-2xs font-medium text-ink-500">{jourRelatif(quand)}</span>
      <span aria-hidden className="h-px flex-1 bg-ink-100" />
    </div>
  )
}

/** Zone de saisie, avec mentions et pièces jointes. */
export function Composeur({
  salon,
  placeholder,
  onEnvoyer,
  membresMentionnables,
}: {
  salon: Salon
  placeholder: string
  onEnvoyer: (contenu: string, mentions: string[], pieces: { nom: string; taille: string }[]) => void
  membresMentionnables: { id: string; nom: string }[]
}) {
  const [contenu, setContenu] = useState('')
  const [pieces, setPieces] = useState<{ nom: string; taille: string }[]>([])
  const [suggestions, setSuggestions] = useState<typeof membresMentionnables>([])
  const [mentions, setMentions] = useState<string[]>([])

  if (salon.archive) {
    return (
      <div className="border-t border-ink-200 bg-ink-25 px-4 py-3 text-center text-[0.8125rem] text-ink-600">
        Ce salon est archivé : il reste consultable, mais on ne peut plus y écrire.
      </div>
    )
  }

  const surSaisie = (v: string) => {
    setContenu(v)
    const dernier = v.split(/\s/).pop() ?? ''
    if (dernier.startsWith('@') && dernier.length > 1) {
      const q = dernier.slice(1).toLowerCase()
      setSuggestions(membresMentionnables.filter((m) => m.nom.toLowerCase().includes(q)).slice(0, 5))
    } else {
      setSuggestions([])
    }
  }

  const choisirMention = (m: { id: string; nom: string }) => {
    const morceaux = contenu.split(/(\s)/)
    for (let i = morceaux.length - 1; i >= 0; i--) {
      if (morceaux[i].startsWith('@')) {
        morceaux[i] = `@${m.nom}`
        break
      }
    }
    setContenu(`${morceaux.join('')} `)
    setMentions((l) => (l.includes(m.id) ? l : [...l, m.id]))
    setSuggestions([])
  }

  const envoyer = () => {
    if (!contenu.trim() && pieces.length === 0) return
    onEnvoyer(contenu, mentions, pieces)
    setContenu('')
    setPieces([])
    setMentions([])
    setSuggestions([])
  }

  return (
    <div className="relative border-t border-ink-200 bg-white p-3">
      {suggestions.length > 0 && (
        <ul className="absolute bottom-full left-3 mb-1 w-64 overflow-hidden rounded-lg border border-ink-200 bg-white shadow-md">
          {suggestions.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => choisirMention(m)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[0.8125rem] text-ink-800 hover:bg-ink-50"
              >
                <span className="flex-1 truncate">{m.nom}</span>
                <PastilleAssociation membreId={m.id} compact />
              </button>
            </li>
          ))}
        </ul>
      )}

      {pieces.length > 0 && (
        <ul className="mb-2 flex flex-wrap gap-1.5">
          {pieces.map((p, i) => (
            <li key={i} className="flex items-center gap-2 rounded-lg border border-ink-200 bg-ink-25 px-2 py-1">
              <Paperclip aria-hidden className="h-3 w-3 text-ink-500" />
              <span className="text-2xs text-ink-800">{p.nom}</span>
              <button type="button" onClick={() => setPieces((l) => l.filter((_, k) => k !== i))} aria-label={`Retirer ${p.nom}`}>
                <Trash2 aria-hidden className="h-3 w-3 text-ink-500 hover:text-danger-600" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-end gap-2">
        <Textarea
          rows={2}
          value={contenu}
          onChange={(e) => surSaisie(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              envoyer()
            }
          }}
          placeholder={placeholder}
          aria-label="Écrire un message"
          className="flex-1"
        />
        <div className="flex flex-col gap-1">
          <Button
            variant="icon"
            label="Joindre un fichier"
            onClick={() => setPieces((l) => [...l, { nom: `Document-${l.length + 1}.pdf`, taille: '128 Ko' }])}
          >
            <Paperclip aria-hidden className="h-4 w-4" />
          </Button>
          <Button variant="primary" size="sm" onClick={envoyer} disabled={!contenu.trim() && pieces.length === 0} iconLeft={<Send aria-hidden className="h-3.5 w-3.5" />}>
            Envoyer
          </Button>
        </div>
      </div>
      <p className="mt-1.5 text-[0.5rem] text-ink-500">
        Entrée pour envoyer, Maj + Entrée pour aller à la ligne. Tapez @ pour mentionner quelqu'un.
      </p>
    </div>
  )
}
