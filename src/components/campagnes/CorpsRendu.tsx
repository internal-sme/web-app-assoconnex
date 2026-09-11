import { personnaliser } from '@/lib/campagnes'

/** Rendu minimal du Markdown léger produit par l'éditeur. */
export function CorpsRendu({ texte, className }: { texte: string; className?: string }) {
  if (!texte.trim()) return <p className="text-[0.8125rem] text-ink-500">Corps vide.</p>
  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ''}`}>
      {texte.split('\n').map((ligne, i) => {
        const puce = /^[-*]\s+/.test(ligne)
        const numerotee = /^\d+\.\s+/.test(ligne)
        const contenu = ligne.replace(/^[-*]\s+/, '').replace(/^\d+\.\s+/, '')
        const morceaux = contenu.split(/(\*\*[^*]+\*\*|\*[^*]+\*|__[^_]+__)/g).filter(Boolean)
        const rendu = morceaux.map((m, k) => {
          if (m.startsWith('**') && m.endsWith('**')) return <strong key={k} className="font-semibold text-ink-900">{m.slice(2, -2)}</strong>
          if (m.startsWith('__') && m.endsWith('__')) return <span key={k} className="underline">{m.slice(2, -2)}</span>
          if (m.startsWith('*') && m.endsWith('*')) return <em key={k}>{m.slice(1, -1)}</em>
          return <span key={k}>{m}</span>
        })
        if (!ligne.trim()) return <span key={i} aria-hidden className="h-2" />
        if (puce || numerotee) {
          return (
            <p key={i} className="flex gap-2.5 pl-1 text-[0.8125rem] leading-relaxed text-ink-700">
              <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
              <span>{rendu}</span>
            </p>
          )
        }
        return <p key={i} className="text-[0.8125rem] leading-relaxed text-ink-700">{rendu}</p>
      })}
    </div>
  )
}