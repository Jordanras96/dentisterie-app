import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const mockLogout = vi.fn()
let mockUser: { id: number; username: string; role: string; permissions: Record<string, boolean> } | null = null

vi.mock('@/lib/auth', () => ({
  useAuth: () => ({
    user: mockUser,
    logout: mockLogout,
    hydrate: vi.fn(),
  }),
}))

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

vi.mock('next/navigation', () => ({
  usePathname: () => '/patients',
}))

import { AppSidebar } from '@/components/app-sidebar'

describe('AppSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUser = null
  })

  it('should render nothing when user is null', () => {
    mockUser = null
    const { container } = render(<AppSidebar />)
    expect(container.innerHTML).toBe('')
  })

  it('should render sidebar with nav items for OPERATOR', () => {
    mockUser = { id: 1, username: 'operator1', role: 'OPERATOR', permissions: {} }
    render(<AppSidebar />)

    expect(screen.getByText('Patients')).toBeInTheDocument()
    expect(screen.getByText('Interventions')).toBeInTheDocument()
    expect(screen.getByText('Produits')).toBeInTheDocument()
    expect(screen.getByText('Factures')).toBeInTheDocument()
    expect(screen.getByText('Rendez-vous')).toBeInTheDocument()
    expect(screen.getByText('Statistiques')).toBeInTheDocument()
  })

  it('should not show admin section for OPERATOR', () => {
    mockUser = { id: 1, username: 'operator1', role: 'OPERATOR', permissions: {} }
    render(<AppSidebar />)

    expect(screen.queryByText('Administration')).not.toBeInTheDocument()
    expect(screen.queryByText('Paramètres')).not.toBeInTheDocument()
    expect(screen.queryByText('Utilisateurs')).not.toBeInTheDocument()
  })

  it('should show admin section for ADMIN', () => {
    mockUser = { id: 1, username: 'admin1', role: 'ADMIN', permissions: {} }
    render(<AppSidebar />)

    expect(screen.getByText('Administration')).toBeInTheDocument()
    expect(screen.getByText('Paramètres')).toBeInTheDocument()
    expect(screen.getByText('Utilisateurs')).toBeInTheDocument()
  })

  it('should not show Logs système for ADMIN (superAdminOnly)', () => {
    mockUser = { id: 1, username: 'admin1', role: 'ADMIN', permissions: {} }
    render(<AppSidebar />)

    expect(screen.queryByText('Logs système')).not.toBeInTheDocument()
  })

  it('should show Logs système for SUPER_ADMIN', () => {
    mockUser = { id: 1, username: 'super', role: 'SUPER_ADMIN', permissions: {} }
    render(<AppSidebar />)

    expect(screen.getByText('Logs système')).toBeInTheDocument()
  })

  it('should display the username', () => {
    mockUser = { id: 1, username: 'docteur_jean', role: 'ADMIN', permissions: {} }
    render(<AppSidebar />)

    expect(screen.getByText('docteur_jean')).toBeInTheDocument()
  })

  it('should display the role badge', () => {
    mockUser = { id: 1, username: 'admin1', role: 'ADMIN', permissions: {} }
    render(<AppSidebar />)

    expect(screen.getByText('Admin')).toBeInTheDocument()
  })

  it('should display Super Admin badge for SUPER_ADMIN', () => {
    mockUser = { id: 1, username: 'super', role: 'SUPER_ADMIN', permissions: {} }
    render(<AppSidebar />)

    expect(screen.getByText('Super Admin')).toBeInTheDocument()
  })

  it('should display Opérateur badge for OPERATOR', () => {
    mockUser = { id: 1, username: 'op', role: 'OPERATOR', permissions: {} }
    render(<AppSidebar />)

    expect(screen.getByText('Opérateur')).toBeInTheDocument()
  })

  it('should call logout when logout button is clicked', async () => {
    mockUser = { id: 1, username: 'admin1', role: 'ADMIN', permissions: {} }
    const user = userEvent.setup()
    render(<AppSidebar />)

    const logoutButtons = screen.getAllByRole('button')
    const logoutBtn = logoutButtons[logoutButtons.length - 1]
    await user.click(logoutBtn)

    expect(mockLogout).toHaveBeenCalledTimes(1)
  })

  it('should display the app branding', () => {
    mockUser = { id: 1, username: 'admin1', role: 'ADMIN', permissions: {} }
    render(<AppSidebar />)

    expect(screen.getByText('Dentisterie')).toBeInTheDocument()
    expect(screen.getByText('Hôpital Y Loterana')).toBeInTheDocument()
  })

  it('should show avatar initials from username', () => {
    mockUser = { id: 1, username: 'admin1', role: 'ADMIN', permissions: {} }
    render(<AppSidebar />)

    expect(screen.getByText('AD')).toBeInTheDocument()
  })
})
