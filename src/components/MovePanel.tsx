/** @jsxImportSource preact */
import { useEffect, useRef } from 'preact/hooks'
import { TYPE_COLORS, type PokemonType } from '@/lib/types'
import { fmt, localName, type Dictionary, type Locale } from '@/lib/i18n'
import type { PokemonEntry } from '@/lib/pokemonIndex'
import { PokeSprite } from './PokeSprite'

const base = import.meta.env.BASE_URL

interface Props {
  point: { type: PokemonType; label: string; lines: string[] }
  mons: PokemonEntry[] | null
  loading: boolean
  loadErr: boolean
  shadowLocked: boolean
  locale: Locale
  dict: Dictionary
  detailHref?: string
  onRetry: () => void
  onClose: () => void
}

// Move → "who uses it" panel. Owns its focus management (focus on open, restore on
// close, Escape, Tab trap) for the lifetime it's mounted.
export function MovePanel({ point, mons, loading, loadErr, shadowLocked, locale, dict, detailHref, onRetry, onClose }: Props) {
  const panelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    const t = setTimeout(() => panelRef.current?.querySelector<HTMLElement>('.panel-close')?.focus(), 0)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      clearTimeout(t)
      window.removeEventListener('keydown', onKey)
      prev?.focus?.()
    }
  }, [])

  const name = (m: PokemonEntry) => localName(locale, m)

  return (
    <div class="panel-backdrop" onClick={onClose}>
      <div
        class="move-panel"
        role="dialog"
        aria-modal="true"
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key !== 'Tab') return
          const els = panelRef.current?.querySelectorAll<HTMLElement>('a[href], button')
          if (!els || !els.length) return
          const first = els[0]
          const last = els[els.length - 1]
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault()
            last.focus()
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault()
            first.focus()
          }
        }}
      >
        <button class="panel-close" onClick={onClose} aria-label={dict.panel.close}>
          ×
        </button>
        <div class="panel-head">
          <span class="panel-dot" style={{ background: TYPE_COLORS[point.type] }} />
          <strong>{point.label}</strong>
        </div>
        <div class="panel-stats">
          {point.lines.map((line, i) => (
            <span key={i}>{line}</span>
          ))}
        </div>
        {detailHref && (
          <a class="panel-details" href={detailHref}>
            {dict.panel.details} →
          </a>
        )}
        <div class="panel-sub">
          <span>{dict.panel.usedBy}</span>
          {mons && <span class="panel-count">{fmt(dict.panel.count, { n: mons.length })}</span>}
        </div>
        {loadErr ? (
          <div class="panel-msg">
            {dict.common.error}{' '}
            <button class="retry-btn" onClick={onRetry}>
              {dict.common.retry}
            </button>
          </div>
        ) : loading ? (
          <div class="panel-msg">{dict.panel.loading}</div>
        ) : mons && mons.length === 0 ? (
          <div class="panel-msg">{shadowLocked ? dict.panel.shadowOnly : dict.panel.none}</div>
        ) : (
          <div class="poke-grid scroll-hidden">
            {mons!.map((m) => (
              <a key={m.id} class="poke-card" href={`${base}${locale}/pokemon?p=${m.id}`} title={name(m)}>
                <PokeSprite mon={m} />
                <span class="poke-name static-text">{name(m)}</span>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
