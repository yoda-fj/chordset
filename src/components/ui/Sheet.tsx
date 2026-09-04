'use client'

import { Drawer } from 'vaul'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * Sheet — drawer mobile (vaul). Uso:
 * <Sheet><SheetTrigger asChild><Button>Abrir</Button></SheetTrigger>
 * <SheetContent>…</SheetContent></Sheet>
 */
export const Sheet = Drawer.Root
export const SheetTrigger = Drawer.Trigger
export const SheetClose = Drawer.Close

export function SheetContent({
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<typeof Drawer.Content> & { children?: ReactNode }) {
  return (
    <Drawer.Portal>
      <Drawer.Overlay className="fixed inset-0 z-50 bg-black/60" />
      <Drawer.Content
        className={cn(
          'fixed inset-x-0 bottom-0 z-50 mt-24 flex flex-col rounded-t-xl2',
          'bg-surface-raised border-t border-ink/10',
          className
        )}
        {...props}
      >
        <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-ink/20" />
        <div className="p-6 overflow-y-auto">{children}</div>
      </Drawer.Content>
    </Drawer.Portal>
  )
}

export function SheetTitle({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof Drawer.Title>) {
  return (
    <Drawer.Title
      className={cn('text-lg font-semibold font-display text-ink mb-2', className)}
      {...props}
    />
  )
}
