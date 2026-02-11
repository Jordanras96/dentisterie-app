import { useCallback, useRef, useState } from 'react'

/**
 * Hook to debounce a value.
 * Returns the debounced value after the specified delay.
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>()

  if (timeoutRef.current) {
    clearTimeout(timeoutRef.current)
  }

  timeoutRef.current = setTimeout(() => {
    setDebouncedValue(value)
  }, delay)

  return debouncedValue
}

/**
 * Hook to debounce a callback function.
 * Prevents multiple rapid clicks on buttons.
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number = 500
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>()
  const isBlockedRef = useRef(false)

  return useCallback(
    (...args: Parameters<T>) => {
      if (isBlockedRef.current) return

      isBlockedRef.current = true
      callback(...args)

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        isBlockedRef.current = false
      }, delay)
    },
    [callback, delay]
  )
}

/**
 * Hook that provides a loading-aware submit function.
 * Prevents double submission of forms.
 */
export function useSafeSubmit<T>(
  submitFn: () => Promise<T>
): { submit: () => Promise<T | undefined>; isSubmitting: boolean } {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const submit = useCallback(async () => {
    if (isSubmitting) return undefined
    setIsSubmitting(true)
    try {
      const result = await submitFn()
      return result
    } finally {
      setIsSubmitting(false)
    }
  }, [submitFn, isSubmitting])

  return { submit, isSubmitting }
}
