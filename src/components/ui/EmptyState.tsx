import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Button } from './Button'

/**
 * Empty state padrão (Fase 1.9): ícone + título + descrição + CTA primário
 * (+ secundário opcional). Usar em todas as listas vazias.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
}: {
  icon: ReactNode
  title: string
  description?: string
  action?: { label: string; onClick?: () => void; href?: string }
  secondaryAction?: { label: string; onClick?: () => void; href?: string }
  className?: string
}) {
  return (
    <div
      className={cn(
        'text-center py-16 px-6 bg-surface-raised border border-ink/10 rounded-xl2',
        className
      )}
    >
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-surface-overlay text-ink-faint [&_svg]:h-7 [&_svg]:w-7">
        {icon}
      </div>
      <h3 className="text-lg font-semibold font-display text-ink mb-1">{title}</h3>
      {description && <p className="text-ink-muted mb-6 max-w-sm mx-auto">{description}</p>}
      {(action || secondaryAction) && (
        <div className="flex items-center justify-center gap-3">
          {action && (
            action.href ? (
              <a href={action.href}>
                <Button>{action.label}</Button>
              </a>
            ) : (
              <Button onClick={action.onClick}>{action.label}</Button>
            )
          )}
          {secondaryAction && (
            secondaryAction.href ? (
              <a href={secondaryAction.href}>
                <Button variant="secondary">{secondaryAction.label}</Button>
              </a>
            ) : (
              <Button variant="secondary" onClick={secondaryAction.onClick}>
                {secondaryAction.label}
              </Button>
            )
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Estado de erro padrão (Fase 1.9): erro calmo com retry.
 */
export function ErrorState({
  message,
  onRetry,
  className,
}: {
  message: string
  onRetry?: () => void
  className?: string
}) {
  return (
    <div className={cn('text-center py-12', className)}>
      <p className="text-danger mb-4">{message}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Tentar novamente
        </Button>
      )}
    </div>
  )
}
