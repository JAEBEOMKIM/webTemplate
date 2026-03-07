'use client'

import { useRef, useEffect } from 'react'
import { useIsomorphicLayoutEffect } from './use-isomorphic-layout-effect'

/**
 * Declarative setTimeout hook.
 *
 * - Pass `null` as delay to cancel/pause the timeout.
 * - Callback ref is kept up-to-date so stale closures are not an issue.
 *
 * @example
 * // Auto-dismiss a toast after 3 s
 * useTimeout(() => setVisible(false), visible ? 3000 : null)
 */
export function useTimeout(callback: () => void, delay: number | null): void {
  const savedCallback = useRef(callback)

  // Keep the ref current without re-registering the effect
  useIsomorphicLayoutEffect(() => {
    savedCallback.current = callback
  }, [callback])

  useEffect(() => {
    if (delay === null) return

    const id = setTimeout(() => savedCallback.current(), delay)
    return () => clearTimeout(id)
  }, [delay])
}
