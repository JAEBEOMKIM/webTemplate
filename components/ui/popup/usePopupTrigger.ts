'use client'

import { useState, useEffect, useCallback, useRef, type RefObject } from 'react'
import type { PopupConfig } from './types'

// 모듈 레벨: 동시에 1개만 열리도록 보장
let currentOpenKey: string | null = null

export function usePopupTriggers(
  componentId: string,
  popups: PopupConfig[] | undefined,
  containerRef: RefObject<HTMLElement | null>,
): {
  activePopup: PopupConfig | null
  close: () => void
} {
  const [activePopupId, setActivePopupId] = useState<string | null>(null)
  const touchFiredRef = useRef<Set<string>>(new Set())
  const items = popups ?? []

  const openPopup = useCallback((popupId: string) => {
    const key = `${componentId}:${popupId}`
    if (currentOpenKey && currentOpenKey !== key) return // 다른 팝업 열려있으면 무시
    currentOpenKey = key
    setActivePopupId(popupId)
  }, [componentId])

  const close = useCallback(() => {
    if (activePopupId) {
      const key = `${componentId}:${activePopupId}`
      if (currentOpenKey === key) currentOpenKey = null
    }
    setActivePopupId(null)
  }, [componentId, activePopupId])

  // Load 트리거
  useEffect(() => {
    const loadPopups = items.filter(p => p.trigger === 'load')
    if (loadPopups.length === 0) return

    const timers: ReturnType<typeof setTimeout>[] = []
    for (const p of loadPopups) {
      const key = `popup-shown-${componentId}-${p.id}`
      if (sessionStorage.getItem(key)) continue

      const timer = setTimeout(() => {
        sessionStorage.setItem(key, '1')
        openPopup(p.id)
      }, p.triggerDelay ?? 0)
      timers.push(timer)
    }

    return () => timers.forEach(clearTimeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [componentId, items.length, openPopup])

  // Click 트리거 (이벤트 위임)
  useEffect(() => {
    const clickPopups = items.filter(p => p.trigger === 'click')
    if (clickPopups.length === 0) return
    const el = containerRef.current
    if (!el) return

    const handler = (e: Event) => {
      const target = e.target as HTMLElement
      for (const p of clickPopups) {
        if (p.triggerSelector) {
          if (target.closest(p.triggerSelector)) {
            openPopup(p.id)
            return
          }
        } else {
          // 셀렉터 없으면 컴포넌트 전체 영역
          openPopup(p.id)
          return
        }
      }
    }
    el.addEventListener('click', handler)
    return () => el.removeEventListener('click', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [componentId, items.length, openPopup])

  // Touch 트리거 (이벤트 위임, 팝업당 1회)
  useEffect(() => {
    const touchPopups = items.filter(p => p.trigger === 'touch')
    if (touchPopups.length === 0) return
    const el = containerRef.current
    if (!el) return

    const handler = (e: Event) => {
      const target = e.target as HTMLElement
      for (const p of touchPopups) {
        if (touchFiredRef.current.has(p.id)) continue
        if (p.triggerSelector) {
          if (target.closest(p.triggerSelector)) {
            touchFiredRef.current.add(p.id)
            openPopup(p.id)
            return
          }
        } else {
          touchFiredRef.current.add(p.id)
          openPopup(p.id)
          return
        }
      }
    }
    el.addEventListener('pointerdown', handler)
    return () => el.removeEventListener('pointerdown', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [componentId, items.length, openPopup])

  const activePopup = activePopupId
    ? items.find(p => p.id === activePopupId) ?? null
    : null

  return { activePopup, close }
}
