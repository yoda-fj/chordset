'use client'

import { cn } from '@/lib/utils'

/**
 * SegmentedControl — alternativa a abas para filtros curtos (ex.: status de ensaio).
 *
 * <SegmentedControl
 *   value={status}
 *   onChange={setStatus}
 *   options={[{ value: 'todos', label: 'Todos' }, { value: 'ok', label: 'OK' }]}
 * />
 */
export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  className,
  'aria-label': ariaLabel,
}: {
  value: T
  onChange: (value: T) => void
  options: { value: T; label: string }[]
  className?: string
  'aria-label'?: string
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn(
        'inline-flex items-center gap-1 rounded-lg bg-surface-overlay p-1',
        className
      )}
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          aria-pressed={value === opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            'rounded-md px-4 py-2 text-sm font-medium transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
            value === opt.value
              ? 'bg-surface-raised text-ink'
              : 'text-ink-muted hover:text-ink'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
