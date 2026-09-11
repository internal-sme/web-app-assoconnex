import { useRef, useState } from 'react'
import { AlertTriangle, CheckCircle2, RotateCw, Upload, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { useDocuments } from '@/context/DocumentsContext'
import { TAILLE_MAX, formatTaille } from '@/lib/documents'

/** Quelques fichiers fictifs pour la démonstration, dont un trop volumineux. */
const echantillons = [
  { nom: 'Compte rendu réunion.pdf', taille: 320_000 },
  { nom: 'Budget révisé.xlsx', taille: 480_000 },
  { nom: 'Photo de groupe.jpg', taille: 2_800_000 },
  { nom: 'Captation intégrale du festival.mp4', taille: 68_000_000 },
]

export function ZoneDepot({ dossierId }: { dossierId: string }) {
  const { televerser, televersements, reessayerTeleversement, retirerTeleversement } = useDocuments()
  const [survol, setSurvol] = useState(false)
  const compteur = useRef(0)

  const deposerEchantillon = (multiple: boolean) => {
    compteur.current += 1
    televerser(multiple ? echantillons : [echantillons[compteur.current % echantillons.length]], dossierId)
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setSurvol(true)
        }}
        onDragLeave={() => setSurvol(false)}
        onDrop={(e) => {
          e.preventDefault()
          setSurvol(false)
          const fichiers = Array.from(e.dataTransfer.files).map((f) => ({ nom: f.name, taille: f.size }))
          if (fichiers.length > 0) televerser(fichiers, dossierId)
          else deposerEchantillon(true)
        }}
        className={cn(
          'rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors',
          survol ? 'border-brand-500 bg-brand-50' : 'border-ink-300 bg-ink-25',
        )}
      >
        <Upload aria-hidden className={cn('mx-auto h-7 w-7', survol ? 'text-brand-600' : 'text-ink-500')} />
        <p className="mt-2 text-[0.8125rem] font-medium text-ink-900">
          {survol ? 'Relâchez pour importer' : 'Glissez vos fichiers ici'}
        </p>
        <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-ink-500">
          Un ou plusieurs fichiers à la fois. Taille maximale : {formatTaille(TAILLE_MAX)} par fichier.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Button size="sm" onClick={() => deposerEchantillon(false)}>
            Importer un fichier
          </Button>
          <Button size="sm" onClick={() => deposerEchantillon(true)}>
            Importer plusieurs fichiers
          </Button>
        </div>
      </div>

      {televersements.length > 0 && (
        <ul className="flex flex-col gap-2" aria-live="polite">
          {televersements.map((t) => (
            <li key={t.id} className="flex items-center gap-3 rounded-lg border border-ink-200 bg-white p-3">
              <span
                aria-hidden
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border',
                  t.statut === 'termine' && 'border-success-100 bg-success-50 text-success-600',
                  t.statut === 'echec' && 'border-danger-100 bg-danger-50 text-danger-600',
                  t.statut === 'en_cours' && 'border-ink-200 bg-ink-50 text-ink-600',
                )}
              >
                {t.statut === 'termine' ? <CheckCircle2 className="h-4 w-4" /> : t.statut === 'echec' ? <AlertTriangle className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[0.8125rem] font-medium text-ink-900">{t.nom}</p>
                {t.statut === 'en_cours' && (
                  <>
                    <div
                      role="progressbar"
                      aria-valuenow={t.progression}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`Import de ${t.nom}`}
                      className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-ink-100"
                    >
                      <div className="h-full rounded-full bg-brand-500 transition-[width] duration-200" style={{ width: `${t.progression}%` }} />
                    </div>
                    <p className="ac-num mt-1 text-xs text-ink-500">
                      {t.progression} % · {formatTaille(t.taille)}
                    </p>
                  </>
                )}
                {t.statut === 'termine' && (
                  <p className="ac-num text-xs text-success-600">Import terminé · {formatTaille(t.taille)}</p>
                )}
                {t.statut === 'echec' && <p className="text-xs text-danger-600">{t.erreur}</p>}
              </div>
              {t.statut === 'echec' && t.taille <= TAILLE_MAX && (
                <Button size="sm" variant="ghost" onClick={() => reessayerTeleversement(t.id)} iconLeft={<RotateCw aria-hidden className="h-3.5 w-3.5" />}>
                  Réessayer
                </Button>
              )}
              <Button variant="icon" size="sm" label={`Retirer ${t.nom} de la liste`} onClick={() => retirerTeleversement(t.id)}>
                <X aria-hidden className="h-3.5 w-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
