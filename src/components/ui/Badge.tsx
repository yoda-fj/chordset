import type { HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border font-medium',
  {
    variants: {
      variant: {
        default: 'bg-surface-overlay text-ink border-ink/20',
        brand: 'bg-brand/15 text-brand border-brand/30',
        success: 'bg-success/15 text-success border-success/40',
        danger: 'bg-danger/15 text-danger border-danger/40',
        section: 'bg-section/15 text-section border-section/30',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-1 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'sm',
    },
  }
)

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)} {...props} />
  )
}

export { badgeVariants }
