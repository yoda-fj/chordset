import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'w-full px-4 py-2 bg-surface-raised text-ink border border-ink/20 rounded-lg',
        'placeholder:text-ink-faint',
        'focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand',
        'disabled:opacity-50 disabled:pointer-events-none',
        className
      )}
      {...props}
    />
  )
)
Input.displayName = 'Input'
