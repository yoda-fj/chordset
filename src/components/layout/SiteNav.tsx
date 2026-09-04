'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { Music, Calendar, LayoutTemplate, Drum, Guitar } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/ritmos', label: 'Ritmos', icon: Drum },
  { href: '/eventos', label: 'Eventos', icon: Calendar },
  { href: '/templates', label: 'Templates', icon: LayoutTemplate },
  { href: '/musicas', label: 'Músicas', icon: Music },
  { href: '/ensaios', label: 'Ensaios', icon: Guitar },
]

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + '/')
}

export function SiteNav() {
  const pathname = usePathname()

  return (
    <>
      {/* Navbar desktop */}
      <nav
        aria-label="Navegação principal"
        className="hidden md:block bg-surface-raised border-b border-ink/10 site-nav"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold font-display text-brand">
                ChordSet
              </Link>
            </div>
            <div className="flex items-center space-x-1">
              {NAV_ITEMS.map(({ href, label }) => {
                const active = isActive(pathname, href)
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'relative px-3 py-2 rounded-md text-sm font-medium transition-colors',
                      active ? 'text-brand' : 'text-ink-muted hover:text-ink'
                    )}
                  >
                    {label}
                    {active && (
                      <motion.span
                        layoutId="nav-underline"
                        className="absolute inset-x-2 -bottom-[13px] h-0.5 rounded-full bg-brand"
                        transition={{ type: 'spring', bounce: 0.25, duration: 0.5 }}
                      />
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </nav>

      {/* Bottom tab bar mobile */}
      <nav
        aria-label="Navegação principal"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-surface-raised border-t border-ink/10 pb-[env(safe-area-inset-bottom)] site-nav"
      >
        <div className="grid grid-cols-5">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href)
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className="relative flex flex-col items-center gap-1 py-2.5"
              >
                {active && (
                  <motion.span
                    layoutId="tab-pill"
                    className="absolute inset-x-2 inset-y-1 rounded-xl2 bg-brand/15"
                    transition={{ type: 'spring', bounce: 0.25, duration: 0.5 }}
                  />
                )}
                <Icon
                  size={22}
                  className={cn('relative', active ? 'text-brand' : 'text-ink-faint')}
                />
                <span
                  className={cn(
                    'relative text-[11px] font-medium',
                    active ? 'text-brand' : 'text-ink-faint'
                  )}
                >
                  {label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
