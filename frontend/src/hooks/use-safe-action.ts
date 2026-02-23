import { useState, useCallback, useRef } from 'react'

/**
 * Hook that wraps an async action with loading state and double-click prevention.
 * Use this for all form submissions and destructive actions.
 */
export function useSafeAction<TArgs extends unknown[], TResult>(
  action: (...args: TArgs) => Promise<TResult>,
  options?: { cooldownMs?: number }
) {
  const [loading, setLoading] = useState(false)
  const lastCallRef = useRef(0)
  const cooldown = options?.cooldownMs ?? 500

  const execute = useCallback(
    async (...args: TArgs): Promise<TResult | undefined> => {
      const now = Date.now()
      if (loading || now - lastCallRef.current < cooldown) {
        return undefined
      }
      lastCallRef.current = now
      setLoading(true)
      try {
        return await action(...args)
      } finally {
        setLoading(false)
      }
    },
    [action, loading, cooldown]
  )

  return { execute, loading }
}
