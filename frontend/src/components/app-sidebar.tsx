'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth'
import {
  Users,
  Stethoscope,
  Package,
  FileText,
  CalendarDays,
  BarChart3,
  ClipboardList,
  Settings,
  Shield,
  LogOut,
  Activity,
  UserCog,
  DollarSign,
  Banknote,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

const navItems = [
  { href: '/patients', label: 'Patients', icon: Users },
  { href: '/interventions', label: 'Interventions', icon: Stethoscope },
  { href: '/produits', label: 'Produits', icon: Package },
  { href: '/factures', label: 'Factures', icon: FileText },
  { href: '/factures/billetage', label: 'Billetage', icon: Banknote },
  { href: '/tarifs', label: 'Tarifs', icon: DollarSign },
  { href: '/activites', label: 'Activités', icon: Activity },
  { href: '/rendez-vous', label: 'Rendez-vous', icon: CalendarDays },
  { href: '/rapports', label: 'Rapports', icon: ClipboardList },
  { href: '/statistiques', label: 'Statistiques', icon: BarChart3 },
]

const adminItems = [
  { href: '/parametres', label: 'Paramètres', icon: Settings },
  { href: '/utilisateurs', label: 'Utilisateurs', icon: UserCog },
  { href: '/logs', label: 'Logs système', icon: Shield, superAdminOnly: true },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  if (!user) return null

  const roleLabel =
    user.role === 'SUPER_ADMIN'
      ? 'Super Admin'
      : user.role === 'ADMIN'
        ? 'Admin'
        : 'Opérateur'

  const roleVariant =
    user.role === 'SUPER_ADMIN'
      ? 'destructive'
      : user.role === 'ADMIN'
        ? 'default'
        : 'secondary'

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-3 border-b px-4 py-4">
        <Image src="/images/logodt.png" alt="SyGeDe" width={36} height={36} className="rounded-lg" />
        <div className="flex flex-col">
          <span className="text-sm font-semibold">SyGeDe</span>
          <span className="text-xs text-muted-foreground">Hôpital Loterana Andranomadio</span>
        </div>
      </div>

      <ScrollArea className="flex-1 px-3 py-3">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname.startsWith(item.href)
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </div>
              </Link>
            )
          })}
        </div>

        {(user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') && (
          <>
            <Separator className="my-3" />
            <p className="mb-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Administration
            </p>
            <div className="space-y-1">
              {adminItems
                .filter((item) => !item.superAdminOnly || user.role === 'SUPER_ADMIN')
                .map((item) => {
                  const Icon = item.icon
                  const isActive = pathname.startsWith(item.href)
                  return (
                    <Link key={item.href} href={item.href}>
                      <div
                        className={cn(
                          'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                          isActive
                            ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </div>
                    </Link>
                  )
                })}
            </div>
          </>
        )}
      </ScrollArea>

      <div className="border-t p-3">
        <div className="flex items-center gap-3 rounded-md px-2 py-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">
              {user.username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-1 flex-col">
            <span className="text-sm font-medium">{user.username}</span>
            <Badge variant={roleVariant as 'default'} className="w-fit text-[10px] px-1.5 py-0">
              {roleLabel}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={logout}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  )
}
