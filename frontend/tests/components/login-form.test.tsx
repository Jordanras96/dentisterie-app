import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock trpc before importing the component
vi.mock('@/lib/trpc', () => ({
  trpc: {
    auth: {
      login: {
        mutate: vi.fn(),
      },
    },
  },
}))

// Mock useAuth
const mockLogin = vi.fn()
const mockLogout = vi.fn()
vi.mock('@/lib/auth', () => ({
  useAuth: () => ({
    user: null,
    token: null,
    isAuthenticated: false,
    login: mockLogin,
    logout: mockLogout,
    hydrate: vi.fn(),
  }),
}))

import LoginPage from '@/app/login/page'
import { trpc } from '@/lib/trpc'
import { toast } from 'sonner'

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render login form with username and password fields', () => {
    render(<LoginPage />)

    expect(screen.getByLabelText(/nom d'utilisateur/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/mot de passe/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /se connecter/i })).toBeInTheDocument()
  })

  it('should render the app title', () => {
    render(<LoginPage />)
    expect(screen.getByText('Dentisterie')).toBeInTheDocument()
  })

  it('should show error toast when fields are empty', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)

    await user.click(screen.getByRole('button', { name: /se connecter/i }))

    expect(toast.error).toHaveBeenCalledWith('Veuillez remplir tous les champs')
  })

  it('should show error toast when only username is filled', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)

    await user.type(screen.getByLabelText(/nom d'utilisateur/i), 'admin')
    await user.click(screen.getByRole('button', { name: /se connecter/i }))

    expect(toast.error).toHaveBeenCalledWith('Veuillez remplir tous les champs')
  })

  it('should show error toast when only password is filled', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)

    await user.type(screen.getByLabelText(/mot de passe/i), 'secret')
    await user.click(screen.getByRole('button', { name: /se connecter/i }))

    expect(toast.error).toHaveBeenCalledWith('Veuillez remplir tous les champs')
  })

  it('should call trpc login with correct credentials', async () => {
    const mockMutate = trpc.auth.login.mutate as ReturnType<typeof vi.fn>
    mockMutate.mockResolvedValueOnce({
      token: 'test-token',
      user: { id: 1, username: 'admin', role: 'ADMIN', permissions: {} },
    })

    const user = userEvent.setup()
    render(<LoginPage />)

    await user.type(screen.getByLabelText(/nom d'utilisateur/i), 'admin')
    await user.type(screen.getByLabelText(/mot de passe/i), 'password123')
    await user.click(screen.getByRole('button', { name: /se connecter/i }))

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({
        username: 'admin',
        password: 'password123',
      })
    })
  })

  it('should call login store function on successful login', async () => {
    const mockMutate = trpc.auth.login.mutate as ReturnType<typeof vi.fn>
    mockMutate.mockResolvedValueOnce({
      token: 'jwt-token',
      user: { id: 1, username: 'admin', role: 'ADMIN', permissions: { canEdit: true } },
    })

    const user = userEvent.setup()
    render(<LoginPage />)

    await user.type(screen.getByLabelText(/nom d'utilisateur/i), 'admin')
    await user.type(screen.getByLabelText(/mot de passe/i), 'pass')
    await user.click(screen.getByRole('button', { name: /se connecter/i }))

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('jwt-token', expect.objectContaining({
        id: 1,
        username: 'admin',
        role: 'ADMIN',
      }))
    })
  })

  it('should show error toast on failed login', async () => {
    const mockMutate = trpc.auth.login.mutate as ReturnType<typeof vi.fn>
    mockMutate.mockRejectedValueOnce(new Error('Identifiants invalides'))

    const user = userEvent.setup()
    render(<LoginPage />)

    await user.type(screen.getByLabelText(/nom d'utilisateur/i), 'wrong')
    await user.type(screen.getByLabelText(/mot de passe/i), 'wrong')
    await user.click(screen.getByRole('button', { name: /se connecter/i }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Identifiants invalides')
    })
  })

  it('should disable button and show loading during login', async () => {
    const mockMutate = trpc.auth.login.mutate as ReturnType<typeof vi.fn>
    let resolveLogin: (val: unknown) => void
    mockMutate.mockImplementationOnce(() => new Promise((resolve) => { resolveLogin = resolve }))

    const user = userEvent.setup()
    render(<LoginPage />)

    await user.type(screen.getByLabelText(/nom d'utilisateur/i), 'admin')
    await user.type(screen.getByLabelText(/mot de passe/i), 'pass')
    await user.click(screen.getByRole('button', { name: /se connecter/i }))

    await waitFor(() => {
      expect(screen.getByRole('button')).toBeDisabled()
    })

    resolveLogin!({
      token: 'tok',
      user: { id: 1, username: 'admin', role: 'ADMIN', permissions: {} },
    })

    await waitFor(() => {
      expect(screen.getByRole('button')).not.toBeDisabled()
    })
  })
})
