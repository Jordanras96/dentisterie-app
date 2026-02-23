'use client'

import { AuthGuard } from '@/components/auth-guard'
import { AppSidebar } from '@/components/app-sidebar'
import { ErrorReportButton } from '@/components/error-report'
import { TourButton } from '@/components/tour-button'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden">
        <AppSidebar />
        <main className="flex-1 overflow-y-auto bg-background p-6">{children}</main>
        <TourButton />
        <ErrorReportButton />
      </div>
    </AuthGuard>
  )
}
