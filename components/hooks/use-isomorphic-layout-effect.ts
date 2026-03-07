'use client'

import { useLayoutEffect, useEffect } from 'react'

/**
 * useLayoutEffect on the client, useEffect on the server.
 * Prevents SSR warnings when useLayoutEffect is needed.
 */
export const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect
