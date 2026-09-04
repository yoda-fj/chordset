'use client'

import { MotionConfig } from 'framer-motion'
import { ToastProvider } from './Toast'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <ToastProvider>{children}</ToastProvider>
    </MotionConfig>
  )
}
