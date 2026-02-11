import { describe, it, expect, beforeEach } from 'vitest'
import { useAuth } from '@/lib/auth'

describe('useAuth (Zustand auth store)', () => {
  beforeEach(() => {
    localStorage.clear()
    useAuth.setState({ user: null, token: null, isAuthenticated: false })
  })

  describe('initial state', () => {
    it('should start unauthenticated', () => {
      const state = useAuth.getState()
      expect(state.user).toBeNull()
      expect(state.token).toBeNull()
      expect(state.isAuthenticated).toBe(false)
    })
  })

  describe('login', () => {
    it('should set user and token on login', () => {
      const user = { id: 1, username: 'admin', role: 'ADMIN' as const, permissions: {} }
      useAuth.getState().login('test-token', user)

      const state = useAuth.getState()
      expect(state.user).toEqual(user)
      expect(state.token).toBe('test-token')
      expect(state.isAuthenticated).toBe(true)
    })

    it('should persist to localStorage on login', () => {
      const user = { id: 1, username: 'admin', role: 'ADMIN' as const, permissions: {} }
      useAuth.getState().login('test-token', user)

      expect(localStorage.getItem('token')).toBe('test-token')
      expect(localStorage.getItem('user')).toBe(JSON.stringify(user))
    })
  })

  describe('logout', () => {
    it('should clear state on logout', () => {
      const user = { id: 1, username: 'admin', role: 'ADMIN' as const, permissions: {} }
      useAuth.getState().login('test-token', user)
      useAuth.getState().logout()

      const state = useAuth.getState()
      expect(state.user).toBeNull()
      expect(state.token).toBeNull()
      expect(state.isAuthenticated).toBe(false)
    })

    it('should clear localStorage on logout', () => {
      const user = { id: 1, username: 'admin', role: 'ADMIN' as const, permissions: {} }
      useAuth.getState().login('test-token', user)
      useAuth.getState().logout()

      expect(localStorage.getItem('token')).toBeNull()
      expect(localStorage.getItem('user')).toBeNull()
    })
  })

  describe('hydrate', () => {
    it('should restore state from localStorage', () => {
      const user = { id: 1, username: 'admin', role: 'ADMIN' as const, permissions: { canEdit: true } }
      localStorage.setItem('token', 'stored-token')
      localStorage.setItem('user', JSON.stringify(user))

      useAuth.getState().hydrate()

      const state = useAuth.getState()
      expect(state.user).toEqual(user)
      expect(state.token).toBe('stored-token')
      expect(state.isAuthenticated).toBe(true)
    })

    it('should not authenticate if token is missing', () => {
      localStorage.setItem('user', JSON.stringify({ id: 1, username: 'admin' }))

      useAuth.getState().hydrate()

      const state = useAuth.getState()
      expect(state.isAuthenticated).toBe(false)
    })

    it('should not authenticate if user JSON is invalid', () => {
      localStorage.setItem('token', 'some-token')
      localStorage.setItem('user', 'not-valid-json')

      useAuth.getState().hydrate()

      const state = useAuth.getState()
      expect(state.isAuthenticated).toBe(false)
      expect(localStorage.getItem('token')).toBeNull()
      expect(localStorage.getItem('user')).toBeNull()
    })

    it('should not authenticate if both are missing', () => {
      useAuth.getState().hydrate()

      const state = useAuth.getState()
      expect(state.isAuthenticated).toBe(false)
    })
  })

  describe('role-based access patterns', () => {
    it('should handle SUPER_ADMIN role', () => {
      const user = { id: 1, username: 'super', role: 'SUPER_ADMIN' as const, permissions: {} }
      useAuth.getState().login('token', user)

      expect(useAuth.getState().user?.role).toBe('SUPER_ADMIN')
    })

    it('should handle OPERATOR role', () => {
      const user = { id: 2, username: 'op', role: 'OPERATOR' as const, permissions: { canRead: true } }
      useAuth.getState().login('token', user)

      expect(useAuth.getState().user?.role).toBe('OPERATOR')
      expect(useAuth.getState().user?.permissions.canRead).toBe(true)
    })
  })
})
