'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, hydrate } = useAuth()
  const router = useRouter()
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    hydrate()
    setIsHydrated(true)
  }, [hydrate])

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.replace('/login')
    }
  }, [isHydrated, isAuthenticated, router])

  if (!isHydrated || !isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return <>{children}</>
}
