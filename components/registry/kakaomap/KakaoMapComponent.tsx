'use client'

import { useEffect, useRef, useState } from 'react'
import type { ComponentProps, ConfigFormProps } from '../types'

// ── Kakao Maps SDK type declarations ──────────────────────────────────────────
declare global {
  interface Window {
    kakao?: KakaoNamespace
  }
}

interface KakaoNamespace {
  maps: {
    load: (cb: () => void) => void
    LatLng: new (lat: number, lng: number) => KakaoLatLng
    Map: new (el: HTMLElement, opts: { center: KakaoLatLng; level: number }) => KakaoMap
    Marker: new (opts: { position: KakaoLatLng; map?: KakaoMap; title?: string; image?: unknown }) => KakaoMarker
    MarkerImage: new (src: string, size: KakaoSize, opts?: { offset?: KakaoPoint }) => unknown
    Size: new (w: number, h: number) => KakaoSize
    Point: new (x: number, y: number) => KakaoPoint
    InfoWindow: new (opts: { content?: string; removable?: boolean }) => KakaoInfoWindow
    CustomOverlay: new (opts: { position: KakaoLatLng; content: string; yAnchor?: number; zIndex?: number }) => KakaoCustomOverlay
    Polyline: new (opts: {
      path: KakaoLatLng[]
      strokeWeight?: number
      strokeColor?: string
      strokeOpacity?: number
      strokeStyle?: string
    }) => KakaoPolyline
    MapTypeId: { ROADMAP: unknown; SKYVIEW: unknown; HYBRID: unknown }
    ZoomControl: new () => unknown
    MapTypeControl: new () => unknown
    ControlPosition: { TOPRIGHT: unknown; RIGHT: unknown; BOTTOMRIGHT: unknown }
    event: { addListener: (target: unknown, type: string, handler: () => void) => void }
    services: {
      Geocoder: new () => KakaoGeocoder
      Status: { OK: string }
    }
  }
}

interface KakaoLatLng { getLat(): number; getLng(): number }
interface KakaoSize { width: number; height: number }
interface KakaoPoint { x: number; y: number }
interface KakaoMap {
  setCenter(latlng: KakaoLatLng): void
  setLevel(level: number): void
  setBounds(bounds: unknown): void
  setMapTypeId(type: unknown): void
  addControl(ctrl: unknown, pos: unknown): void
  getBounds(): unknown
}
interface KakaoMarker { setMap(map: KakaoMap | null): void; getPosition(): KakaoLatLng }
interface KakaoInfoWindow { open(map: KakaoMap, marker: KakaoMarker): void; close(): void }
interface KakaoCustomOverlay { setMap(map: KakaoMap | null): void }
interface KakaoPolyline { setMap(map: KakaoMap | null): void }
interface KakaoGeocoder {
  addressSearch(addr: string, cb: (result: Array<{ x: string; y: string }>, status: string) => void): void
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface MapMarker {
  id: string
  lat: number
  lng: number
  title: string
  description?: string
}

type MapType = 'ROADMAP' | 'SKYVIEW' | 'HYBRID'

const MAP_TYPES = [
  { value: 'ROADMAP' as MapType, label: '일반' },
  { value: 'SKYVIEW' as MapType, label: '스카이뷰' },
  { value: 'HYBRID'  as MapType, label: '하이브리드' },
]

// ── Kakao Maps link helpers ───────────────────────────────────────────────────
function kakaoPlaceUrl(name: string, lat: number, lng: number) {
  return `https://map.kakao.com/link/to/${encodeURIComponent(name)},${lat},${lng}`
}

function kakaoRouteUrl(destName: string, destLat: number, destLng: number) {
  // Opens route to destination (Kakao Maps app on mobile, web on desktop)
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
  if (isMobile) {
    return `kakaomap://route?ep=${destLat},${destLng}&by=FOOT`
  }
  return `https://map.kakao.com/link/to/${encodeURIComponent(destName)},${destLat},${destLng}`
}

// ── SDK loader ────────────────────────────────────────────────────────────────
function useKakaoMapSdk(appKey: string) {
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!appKey) { setError('Kakao Maps API 키를 설정해주세요.'); return }
    setError('')

    const init = () => window.kakao!.maps.load(() => setReady(true))

    if (window.kakao?.maps) { init(); return }

    const old = document.getElementById('kakao-maps-sdk')
    if (old) old.remove()

    const script = document.createElement('script')
    script.id = 'kakao-maps-sdk'
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&libraries=services&autoload=false`
    script.onload = init
    script.onerror = () => setError('API 키가 올바르지 않거나 도메인이 등록되지 않았습니다.')
    document.head.appendChild(script)
  }, [appKey])

  return { ready, error }
}

// ── Destination overlay HTML ──────────────────────────────────────────────────
function destOverlayHtml(title: string, description: string, link: string) {
  return `
    <div style="
      position:relative;
      background:#fff;
      border:2px solid #2563eb;
      border-radius:10px;
      padding:10px 14px;
      font-family:system-ui,sans-serif;
      min-width:140px;
      max-width:220px;
      box-shadow:0 4px 16px rgba(37,99,235,0.18);
      cursor:${link ? 'pointer' : 'default'};
    " ${link ? `onclick="window.open('${link}','_blank')"` : ''}>
      ${title ? `<div style="font-size:14px;font-weight:700;color:#0f172a;margin-bottom:2px">${title}</div>` : ''}
      ${description ? `<div style="font-size:12px;color:#475569">${description}</div>` : ''}
      ${link ? `<div style="font-size:11px;color:#2563eb;margin-top:6px;font-weight:600">카카오맵에서 보기 →</div>` : ''}
      <div style="
        position:absolute;
        bottom:-10px;left:50%;transform:translateX(-50%);
        width:0;height:0;
        border-left:8px solid transparent;
        border-right:8px solid transparent;
        border-top:10px solid #2563eb;
      "></div>
      <div style="
        position:absolute;
        bottom:-7px;left:50%;transform:translateX(-50%);
        width:0;height:0;
        border-left:7px solid transparent;
        border-right:7px solid transparent;
        border-top:9px solid #fff;
      "></div>
    </div>`
}

// ── Current location overlay HTML ─────────────────────────────────────────────
const currentLocOverlayHtml = `
  <div style="
    width:16px;height:16px;border-radius:50%;
    background:#2563eb;border:3px solid #fff;
    box-shadow:0 0 0 4px rgba(37,99,235,0.25);
  "></div>`

// ──────────────────────────────────────────────────────────────────────────────
// Display component
// ──────────────────────────────────────────────────────────────────────────────
export function KakaoMapComponent({ config }: ComponentProps) {
  const appKey            = (config.app_key            as string)  || ''
  const centerLat         = (config.center_lat         as number)  ?? 37.5665
  const centerLng         = (config.center_lng         as number)  ?? 126.9780
  const zoom              = (config.zoom               as number)  ?? 3
  const mapType           = (config.map_type           as MapType) || 'ROADMAP'
  const markers           = (config.markers            as MapMarker[]) || []
  const showCtrl          = (config.show_controls      as boolean) !== false
  const mapHeight         = (config.height             as number)  ?? 400
  const useCurrentLoc     = (config.use_current_location as boolean) === true
  const destinationLink   = (config.destination_link   as string)  || ''

  const containerRef  = useRef<HTMLDivElement>(null)
  const mapRef        = useRef<KakaoMap | null>(null)
  const markersRef    = useRef<KakaoMarker[]>([])
  const overlaysRef   = useRef<KakaoCustomOverlay[]>([])
  const polylineRef   = useRef<KakaoPolyline | null>(null)
  const infoRef       = useRef<KakaoInfoWindow | null>(null)

  const [locError, setLocError] = useState('')
  const [locLoading, setLocLoading] = useState(false)
  const [currentPos, setCurrentPos] = useState<{ lat: number; lng: number } | null>(null)

  const { ready, error } = useKakaoMapSdk(appKey)

  // Destination = first marker (or center coord)
  const dest = markers[0] ?? null

  // ── Get geolocation ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!useCurrentLoc || !ready) return
    setLocLoading(true); setLocError('')
    navigator.geolocation.getCurrentPosition(
      pos => {
        setCurrentPos({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLocLoading(false)
      },
      () => {
        setLocError('현재 위치를 가져올 수 없습니다. 위치 권한을 허용해주세요.')
        setLocLoading(false)
      },
      { timeout: 10000, maximumAge: 60000 }
    )
  }, [useCurrentLoc, ready])

  // ── Initialize map ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!ready || !containerRef.current) return
    const K = window.kakao!.maps

    const center = dest
      ? new K.LatLng(dest.lat, dest.lng)
      : new K.LatLng(centerLat, centerLng)

    const map = new K.Map(containerRef.current, { center, level: zoom })
    mapRef.current = map
    map.setMapTypeId(K.MapTypeId[mapType] ?? K.MapTypeId.ROADMAP)

    if (showCtrl) {
      map.addControl(new K.ZoomControl(), K.ControlPosition.RIGHT)
      map.addControl(new K.MapTypeControl(), K.ControlPosition.TOPRIGHT)
    }

    return () => {
      markersRef.current.forEach(m => m.setMap(null))
      overlaysRef.current.forEach(o => o.setMap(null))
      polylineRef.current?.setMap(null)
      markersRef.current = []
      overlaysRef.current = []
      polylineRef.current = null
      mapRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  // ── Map type sync ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !ready) return
    mapRef.current.setMapTypeId(window.kakao!.maps.MapTypeId[mapType])
  }, [ready, mapType])

  // ── Place markers & overlays ─────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !ready) return
    const K = window.kakao!.maps
    const map = mapRef.current

    // Clear
    markersRef.current.forEach(m => m.setMap(null))
    overlaysRef.current.forEach(o => o.setMap(null))
    polylineRef.current?.setMap(null)
    infoRef.current?.close()
    markersRef.current = []
    overlaysRef.current = []
    polylineRef.current = null

    if (!dest) return

    const destPos = new K.LatLng(dest.lat, dest.lng)

    if (!useCurrentLoc) {
      // ── Destination-only mode ──
      // Center on destination
      map.setCenter(destPos)
      map.setLevel(zoom)

      // Standard marker
      const marker = new K.Marker({ position: destPos, map })
      markersRef.current.push(marker)

      // Clickable overlay label
      const link = destinationLink || kakaoPlaceUrl(dest.title || '목적지', dest.lat, dest.lng)
      const overlay = new K.CustomOverlay({
        position: destPos,
        content: destOverlayHtml(dest.title, dest.description || '', link),
        yAnchor: 1.45,
        zIndex: 3,
      })
      overlay.setMap(map)
      overlaysRef.current.push(overlay)

      // Extra markers (2nd and beyond) — simple with InfoWindow
      const iw = new K.InfoWindow({ removable: true })
      infoRef.current = iw
      markers.slice(1).forEach(m => {
        if (!m.lat || !m.lng) return
        const pos = new K.LatLng(m.lat, m.lng)
        const mk  = new K.Marker({ position: pos, map, title: m.title })
        markersRef.current.push(mk)
        if (m.title || m.description) {
          K.event.addListener(mk, 'click', () => {
            iw.close()
            const content = `<div style="padding:10px 14px;font-size:13px;font-family:system-ui,sans-serif;min-width:120px;max-width:220px">
              ${m.title ? `<strong style="color:#0f172a;display:block;margin-bottom:2px">${m.title}</strong>` : ''}
              ${m.description ? `<span style="color:#475569;font-size:12px">${m.description}</span>` : ''}
            </div>`
            iw.open(map, mk)
            // @ts-expect-error -- inject content
            iw.a && (iw.a.innerHTML = content)
          })
        }
      })

    } else if (currentPos) {
      // ── Route mode ──
      const fromPos = new K.LatLng(currentPos.lat, currentPos.lng)

      // Current location — custom blue dot overlay
      const curOverlay = new K.CustomOverlay({
        position: fromPos,
        content: currentLocOverlayHtml,
        yAnchor: 0.5,
        zIndex: 4,
      })
      curOverlay.setMap(map)
      overlaysRef.current.push(curOverlay)

      // Destination marker
      const destMarker = new K.Marker({ position: destPos, map })
      markersRef.current.push(destMarker)

      // Destination label overlay
      const link = destinationLink || kakaoPlaceUrl(dest.title || '목적지', dest.lat, dest.lng)
      const destOverlay = new K.CustomOverlay({
        position: destPos,
        content: destOverlayHtml(dest.title, dest.description || '', link),
        yAnchor: 1.45,
        zIndex: 3,
      })
      destOverlay.setMap(map)
      overlaysRef.current.push(destOverlay)

      // Dashed polyline (as-the-crow-flies)
      const polyline = new K.Polyline({
        path: [fromPos, destPos],
        strokeWeight: 4,
        strokeColor: '#2563eb',
        strokeOpacity: 0.7,
        strokeStyle: 'dashed',
      })
      polyline.setMap(map)
      polylineRef.current = polyline

      // Fit both points in view — set center to midpoint
      const midLat = (currentPos.lat + dest.lat) / 2
      const midLng = (currentPos.lng + dest.lng) / 2
      map.setCenter(new K.LatLng(midLat, midLng))
      // Auto-zoom to fit: rough calculation
      const latDiff = Math.abs(currentPos.lat - dest.lat)
      const lngDiff = Math.abs(currentPos.lng - dest.lng)
      const maxDiff = Math.max(latDiff, lngDiff)
      const lvl = maxDiff > 0.5 ? 10 : maxDiff > 0.1 ? 8 : maxDiff > 0.05 ? 7 : maxDiff > 0.01 ? 6 : 4
      map.setLevel(lvl)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, markers, useCurrentLoc, currentPos, destinationLink, zoom])

  // ── Empty state / error states ───────────────────────────────────────────
  if (!appKey) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: `${mapHeight}px`, background: 'var(--bg-secondary)', color: 'var(--text-muted)', flexDirection: 'column', gap: '8px' }}>
      <span style={{ fontSize: '32px' }}>🗺️</span>
      <p style={{ fontSize: '13px' }}>관리자 패널에서 Kakao Maps API 키를 입력해주세요.</p>
    </div>
  )

  if (error) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: `${mapHeight}px`, background: 'var(--bg-secondary)', color: 'var(--danger)', flexDirection: 'column', gap: '8px' }}>
      <span style={{ fontSize: '28px' }}>⚠️</span>
      <p style={{ fontSize: '13px', textAlign: 'center', padding: '0 20px' }}>{error}</p>
    </div>
  )

  // ── Route button URL ─────────────────────────────────────────────────────
  const routeUrl = dest
    ? (currentPos
        ? kakaoRouteUrl(dest.title || '목적지', dest.lat, dest.lng)
        : kakaoPlaceUrl(dest.title || '목적지', dest.lat, dest.lng))
    : ''

  return (
    <div style={{ position: 'relative', width: '100%', height: `${mapHeight}px` }}>
      {/* Loading overlay */}
      {!ready && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)', zIndex: 10 }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>지도 로딩 중...</span>
        </div>
      )}

      {/* Geolocation loading */}
      {ready && useCurrentLoc && locLoading && (
        <div style={{ position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)', zIndex: 10, background: '#fff', border: '1px solid var(--border)', borderRadius: '20px', padding: '6px 14px', fontSize: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>
          현재 위치 확인 중...
        </div>
      )}

      {/* Location error */}
      {locError && (
        <div style={{ position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)', zIndex: 10, background: '#fff', border: '1px solid var(--danger)', borderRadius: '10px', padding: '8px 14px', fontSize: '12px', color: 'var(--danger)', boxShadow: '0 2px 8px rgba(0,0,0,0.12)', whiteSpace: 'nowrap' }}>
          {locError}
        </div>
      )}

      {/* Route button — shown when destination exists */}
      {ready && dest && routeUrl && (
        <a
          href={routeUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            position: 'absolute', bottom: '12px', left: '50%', transform: 'translateX(-50%)',
            zIndex: 10, background: '#2563eb', color: '#fff',
            borderRadius: '20px', padding: '8px 18px',
            fontSize: '13px', fontWeight: 600,
            boxShadow: '0 2px 12px rgba(37,99,235,0.35)',
            textDecoration: 'none', whiteSpace: 'nowrap',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="3 11 22 2 13 21 11 13 3 11"/>
          </svg>
          {useCurrentLoc ? '카카오맵으로 길찾기' : '카카오맵에서 보기'}
        </a>
      )}

      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────────
// Config form
// ──────────────────────────────────────────────────────────────────────────────
export function KakaoMapConfigForm({ config, onChange }: ConfigFormProps) {
  const appKey          = (config.app_key            as string)  || ''
  const centerLat       = (config.center_lat         as number)  ?? 37.5665
  const centerLng       = (config.center_lng         as number)  ?? 126.9780
  const zoom            = (config.zoom               as number)  ?? 3
  const mapType         = (config.map_type           as MapType) || 'ROADMAP'
  const markers         = (config.markers            as MapMarker[]) || []
  const showCtrl        = (config.show_controls      as boolean) !== false
  const mapHeight       = (config.height             as number)  ?? 400
  const useCurrentLoc   = (config.use_current_location as boolean) === true
  const destinationLink = (config.destination_link   as string)  || ''

  const [addrInput, setAddrInput] = useState('')
  const [addrSearching, setAddrSearching] = useState(false)
  const [addrError, setAddrError] = useState('')
  const [sdkReady, setSdkReady] = useState(false)

  useEffect(() => {
    if (!appKey) return
    const tryLoad = () => {
      if (window.kakao?.maps?.services) { setSdkReady(true); return }
      window.kakao?.maps?.load?.(() => setSdkReady(true))
    }
    if (window.kakao?.maps) { tryLoad(); return }
    let script = document.getElementById('kakao-maps-sdk') as HTMLScriptElement | null
    if (!script) {
      script = document.createElement('script')
      script.id = 'kakao-maps-sdk'
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&libraries=services&autoload=false`
      document.head.appendChild(script)
    }
    script.addEventListener('load', tryLoad)
    return () => script!.removeEventListener('load', tryLoad)
  }, [appKey])

  const searchAddress = (targetKey: 'center' | 'marker', markerIdx?: number) => {
    if (!addrInput.trim() || !sdkReady) return
    setAddrSearching(true); setAddrError('')
    const geocoder = new window.kakao!.maps.services.Geocoder()
    geocoder.addressSearch(addrInput, (result, status) => {
      setAddrSearching(false)
      if (status === window.kakao!.maps.services.Status.OK && result[0]) {
        const lat = parseFloat(result[0].y)
        const lng = parseFloat(result[0].x)
        if (targetKey === 'center') {
          onChange({ ...config, center_lat: lat, center_lng: lng })
        } else if (targetKey === 'marker' && markerIdx !== undefined) {
          onChange({ ...config, markers: markers.map((m, i) => i === markerIdx ? { ...m, lat, lng } : m) })
        }
        setAddrInput('')
      } else {
        setAddrError('주소를 찾을 수 없습니다.')
      }
    })
  }

  const addMarker = () => {
    onChange({
      ...config,
      markers: [
        ...markers,
        { id: `${Date.now()}`, lat: centerLat, lng: centerLng, title: '', description: '' },
      ],
    })
  }

  const updateMarker = (idx: number, updates: Partial<MapMarker>) =>
    onChange({ ...config, markers: markers.map((m, i) => i === idx ? { ...m, ...updates } : m) })

  const removeMarker = (idx: number) =>
    onChange({ ...config, markers: markers.filter((_, i) => i !== idx) })

  const labelStyle: React.CSSProperties = {
    fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '5px', display: 'block',
  }
  const rowStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px' }

  const dest = markers[0]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* API Key */}
      <div>
        <label style={labelStyle}>Kakao Maps API 키 (JavaScript 키)</label>
        <input
          className="input"
          type="password"
          value={appKey}
          onChange={e => onChange({ ...config, app_key: e.target.value })}
          placeholder="카카오 개발자 콘솔 → JavaScript 키"
          style={{ fontSize: '13px' }}
        />
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.5 }}>
          developers.kakao.com → 내 애플리케이션 → 앱 키 → JavaScript 키<br />
          <strong>플랫폼</strong>에서 사이트 도메인 등록 필수
        </p>
      </div>

      {/* Route mode toggle */}
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px' }}>
        <div style={rowStyle}>
          <input
            type="checkbox"
            id="map-use-curr-loc"
            checked={useCurrentLoc}
            onChange={e => onChange({ ...config, use_current_location: e.target.checked })}
            style={{ width: '15px', height: '15px', accentColor: 'var(--accent)' }}
          />
          <label htmlFor="map-use-curr-loc" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer' }}>
            현재 위치에서 목적지까지 경로 표시
          </label>
        </div>
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px', paddingLeft: '23px', lineHeight: 1.5 }}>
          {useCurrentLoc
            ? '방문자의 GPS 위치 → 아래 첫 번째 마커(목적지)까지 점선으로 경로를 표시합니다.'
            : '목적지 마커만 지도 중앙에 표시합니다. 클릭 시 카카오맵 링크로 이동합니다.'}
        </p>
      </div>

      {/* Destination link (custom) */}
      <div>
        <label style={labelStyle}>목적지 커스텀 링크 (선택)</label>
        <input
          className="input"
          value={destinationLink}
          onChange={e => onChange({ ...config, destination_link: e.target.value })}
          placeholder="https://... (비워두면 카카오맵 링크 자동 생성)"
          style={{ fontSize: '12px' }}
        />
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>
          업체 홈페이지, 카카오 플레이스 URL 등을 입력하면 레이블 클릭 시 해당 링크로 이동합니다.
        </p>
      </div>

      {/* Map height */}
      <div>
        <label style={labelStyle}>지도 높이: {mapHeight}px</label>
        <input
          type="range" min={200} max={800} step={20}
          value={mapHeight}
          onChange={e => onChange({ ...config, height: Number(e.target.value) })}
          style={{ width: '100%', accentColor: 'var(--accent)' }}
        />
      </div>

      {/* Map type */}
      <div>
        <label style={labelStyle}>지도 종류</label>
        <div style={{ display: 'flex', gap: '6px' }}>
          {MAP_TYPES.map(t => (
            <button key={t.value} type="button"
              onClick={() => onChange({ ...config, map_type: t.value })}
              className={mapType === t.value ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '5px 12px', fontSize: '12px' }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Zoom */}
      <div>
        <label style={labelStyle}>줌 레벨: {zoom} (1=가까이 · 14=멀리)</label>
        <input
          type="range" min={1} max={14} step={1}
          value={zoom}
          onChange={e => onChange({ ...config, zoom: Number(e.target.value) })}
          style={{ width: '100%', accentColor: 'var(--accent)' }}
        />
      </div>

      {/* Center coordinates (only for destination mode, as reference) */}
      {!useCurrentLoc && (
        <div>
          <label style={labelStyle}>기본 지도 중심 좌표 (목적지 마커 없을 때)</label>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
            <input className="input" type="number" step="0.0001" value={centerLat}
              onChange={e => onChange({ ...config, center_lat: parseFloat(e.target.value) || 0 })}
              placeholder="위도" style={{ flex: 1, fontSize: '12px' }} />
            <input className="input" type="number" step="0.0001" value={centerLng}
              onChange={e => onChange({ ...config, center_lng: parseFloat(e.target.value) || 0 })}
              placeholder="경도" style={{ flex: 1, fontSize: '12px' }} />
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <input className="input" value={addrInput}
              onChange={e => setAddrInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && searchAddress('center')}
              placeholder="주소로 검색" style={{ flex: 1, fontSize: '12px' }}
              disabled={!sdkReady} />
            <button type="button" onClick={() => searchAddress('center')}
              disabled={!sdkReady || addrSearching} className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: '12px', flexShrink: 0 }}>
              {addrSearching ? '...' : '검색'}
            </button>
          </div>
          {addrError && <p style={{ fontSize: '11px', color: 'var(--danger)', marginTop: '4px' }}>{addrError}</p>}
        </div>
      )}

      {/* Controls toggle */}
      <div style={rowStyle}>
        <input type="checkbox" id="map-show-ctrl" checked={showCtrl}
          onChange={e => onChange({ ...config, show_controls: e.target.checked })}
          style={{ width: '14px', height: '14px', accentColor: 'var(--accent)' }} />
        <label htmlFor="map-show-ctrl" style={{ fontSize: '13px', color: 'var(--text-primary)', cursor: 'pointer' }}>
          줌/지도 종류 컨트롤 표시
        </label>
      </div>

      {/* Markers */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <div>
            <label style={{ ...labelStyle, marginBottom: 0 }}>마커 ({markers.length}개)</label>
            {useCurrentLoc && markers.length === 0 && (
              <p style={{ fontSize: '11px', color: 'var(--danger)', marginTop: '2px' }}>경로 모드에서는 목적지 마커가 필요합니다</p>
            )}
            {markers.length > 0 && (
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>첫 번째 마커가 목적지로 사용됩니다</p>
            )}
          </div>
          <button onClick={addMarker} className="btn-primary" style={{ padding: '4px 10px', fontSize: '12px' }}>
            + 마커 추가
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {markers.map((m, idx) => (
            <div key={m.id || idx} style={{
              border: `1px solid ${idx === 0 ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: '10px', padding: '10px',
              background: idx === 0 ? 'var(--accent-subtle)' : 'var(--bg-secondary)',
            }}>
              {idx === 0 && (
                <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--accent-text)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  목적지 (주요 마커)
                </div>
              )}
              <div style={{ display: 'flex', gap: '6px', marginBottom: '6px', alignItems: 'center' }}>
                <input className="input" placeholder="마커 제목" value={m.title}
                  onChange={e => updateMarker(idx, { title: e.target.value })}
                  style={{ flex: 1, fontSize: '12px' }} />
                <button onClick={() => removeMarker(idx)} className="btn-danger" style={{ padding: '3px 7px', fontSize: '12px' }}>✕</button>
              </div>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                <input className="input" type="number" step="0.0001" placeholder="위도"
                  value={m.lat || ''} onChange={e => updateMarker(idx, { lat: parseFloat(e.target.value) || 0 })}
                  style={{ flex: 1, fontSize: '12px' }} />
                <input className="input" type="number" step="0.0001" placeholder="경도"
                  value={m.lng || ''} onChange={e => updateMarker(idx, { lng: parseFloat(e.target.value) || 0 })}
                  style={{ flex: 1, fontSize: '12px' }} />
              </div>
              {/* Address search for marker */}
              {idx === 0 && (
                <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                  <input className="input" value={addrInput}
                    onChange={e => setAddrInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && searchAddress('marker', 0)}
                    placeholder="주소 검색으로 좌표 설정"
                    style={{ flex: 1, fontSize: '12px' }} disabled={!sdkReady} />
                  <button type="button" onClick={() => searchAddress('marker', 0)}
                    disabled={!sdkReady || addrSearching} className="btn-secondary"
                    style={{ padding: '6px 10px', fontSize: '12px', flexShrink: 0 }}>
                    {addrSearching ? '...' : '검색'}
                  </button>
                </div>
              )}
              <input className="input" placeholder="설명 (레이블에 표시)"
                value={m.description || ''} onChange={e => updateMarker(idx, { description: e.target.value })}
                style={{ fontSize: '12px', padding: '5px 8px' }} />
            </div>
          ))}
          {markers.length === 0 && (
            <div style={{ textAlign: 'center', padding: '14px', color: 'var(--text-muted)', fontSize: '12px', border: '1px dashed var(--border)', borderRadius: '10px' }}>
              + 마커 추가로 목적지를 설정하세요
            </div>
          )}
        </div>
      </div>

      {/* Preview of destination link */}
      {dest && (
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px', fontSize: '11px', color: 'var(--text-muted)' }}>
          <strong style={{ color: 'var(--text-secondary)' }}>레이블 클릭 시 이동할 링크:</strong><br />
          <span style={{ wordBreak: 'break-all' }}>
            {destinationLink || kakaoPlaceUrl(dest.title || '목적지', dest.lat, dest.lng)}
          </span>
        </div>
      )}
    </div>
  )
}
