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
    Marker: new (opts: { position: KakaoLatLng; map?: KakaoMap; title?: string }) => KakaoMarker
    InfoWindow: new (opts: { content: string; removable?: boolean }) => KakaoInfoWindow
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
interface KakaoMap {
  setCenter(latlng: KakaoLatLng): void
  setLevel(level: number): void
  setMapTypeId(type: unknown): void
  addControl(ctrl: unknown, pos: unknown): void
  getCenter(): KakaoLatLng
}
interface KakaoMarker { setMap(map: KakaoMap | null): void; getPosition(): KakaoLatLng }
interface KakaoInfoWindow { open(map: KakaoMap, marker: KakaoMarker): void; close(): void }
interface KakaoGeocoder {
  addressSearch(addr: string, cb: (result: Array<{ x: string; y: string }>, status: string) => void): void
  coord2Address(lng: number, lat: number, cb: (result: Array<{ address: { address_name: string } }>, status: string) => void): void
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface MapMarker {
  id: string
  lat: number
  lng: number
  title: string
  description?: string
}

// ── SDK loader ────────────────────────────────────────────────────────────────
function useKakaoMapSdk(appKey: string) {
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!appKey) { setError('Kakao Maps API 키를 설정해주세요.'); return }
    setError('')

    const init = () => {
      window.kakao!.maps.load(() => setReady(true))
    }

    // SDK already loaded with same key
    if (window.kakao?.maps) { init(); return }

    // Remove old script if key changed
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

// ── Map type labels ───────────────────────────────────────────────────────────
const MAP_TYPES = [
  { value: 'ROADMAP', label: '일반' },
  { value: 'SKYVIEW', label: '스카이뷰' },
  { value: 'HYBRID',  label: '하이브리드' },
] as const

type MapType = typeof MAP_TYPES[number]['value']

// ──────────────────────────────────────────────────────────────────────────────
// Display component
// ──────────────────────────────────────────────────────────────────────────────
export function KakaoMapComponent({ config }: ComponentProps) {
  const appKey      = (config.app_key   as string)  || ''
  const centerLat   = (config.center_lat as number) ?? 37.5665
  const centerLng   = (config.center_lng as number) ?? 126.9780
  const zoom        = (config.zoom       as number) ?? 3
  const mapType     = (config.map_type   as MapType) || 'ROADMAP'
  const markers     = (config.markers    as MapMarker[]) || []
  const showCtrl    = (config.show_controls as boolean) !== false
  const mapHeight   = (config.height     as number)  ?? 400

  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef       = useRef<KakaoMap | null>(null)
  const markersRef   = useRef<KakaoMarker[]>([])
  const infoRef      = useRef<KakaoInfoWindow | null>(null)

  const { ready, error } = useKakaoMapSdk(appKey)

  // Initialize map
  useEffect(() => {
    if (!ready || !containerRef.current) return
    const K = window.kakao!.maps

    const center = new K.LatLng(centerLat, centerLng)
    const map = new K.Map(containerRef.current, { center, level: zoom })
    mapRef.current = map

    // Map type
    const typeId = K.MapTypeId[mapType] ?? K.MapTypeId.ROADMAP
    map.setMapTypeId(typeId)

    // Controls
    if (showCtrl) {
      map.addControl(new K.ZoomControl(), K.ControlPosition.RIGHT)
      map.addControl(new K.MapTypeControl(), K.ControlPosition.TOPRIGHT)
    }

    // Cleanup on unmount
    return () => {
      markersRef.current.forEach(m => m.setMap(null))
      markersRef.current = []
      mapRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  // Update center & zoom when config changes (after map is initialized)
  useEffect(() => {
    if (!mapRef.current || !ready) return
    const K = window.kakao!.maps
    mapRef.current.setCenter(new K.LatLng(centerLat, centerLng))
    mapRef.current.setLevel(zoom)
  }, [ready, centerLat, centerLng, zoom])

  // Update map type
  useEffect(() => {
    if (!mapRef.current || !ready) return
    const K = window.kakao!.maps
    mapRef.current.setMapTypeId(K.MapTypeId[mapType] ?? K.MapTypeId.ROADMAP)
  }, [ready, mapType])

  // Update markers
  useEffect(() => {
    if (!mapRef.current || !ready) return
    const K = window.kakao!.maps
    const map = mapRef.current

    // Remove old markers
    markersRef.current.forEach(m => m.setMap(null))
    markersRef.current = []
    infoRef.current?.close()

    // Add new markers
    const iw = new K.InfoWindow({ removable: true })
    infoRef.current = iw

    markers.forEach(ev => {
      if (!ev.lat || !ev.lng) return
      const pos    = new K.LatLng(ev.lat, ev.lng)
      const marker = new K.Marker({ position: pos, map, title: ev.title })
      markersRef.current.push(marker)

      if (ev.title || ev.description) {
        K.event.addListener(marker, 'click', () => {
          iw.close()
          const content = `
            <div style="padding:10px 14px;font-size:13px;font-family:system-ui,sans-serif;line-height:1.5;min-width:120px;max-width:240px">
              ${ev.title ? `<strong style="color:#0f172a;display:block;margin-bottom:3px">${ev.title}</strong>` : ''}
              ${ev.description ? `<span style="color:#475569;font-size:12px">${ev.description}</span>` : ''}
            </div>`
          iw.open(map, marker)
          // @ts-expect-error -- inject content after open
          iw.a && (iw.a.innerHTML = content)
        })
      }
    })
  }, [ready, markers])

  if (!appKey) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: `${mapHeight}px`, background: 'var(--bg-secondary)', color: 'var(--text-muted)', flexDirection: 'column', gap: '8px' }}>
        <span style={{ fontSize: '32px' }}>🗺️</span>
        <p style={{ fontSize: '13px' }}>관리자 패널에서 Kakao Maps API 키를 입력해주세요.</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: `${mapHeight}px`, background: 'var(--bg-secondary)', color: 'var(--danger)', flexDirection: 'column', gap: '8px' }}>
        <span style={{ fontSize: '28px' }}>⚠️</span>
        <p style={{ fontSize: '13px', textAlign: 'center', padding: '0 20px' }}>{error}</p>
      </div>
    )
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: `${mapHeight}px` }}>
      {!ready && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)', zIndex: 1 }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>지도 로딩 중...</span>
        </div>
      )}
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────────
// Config form
// ──────────────────────────────────────────────────────────────────────────────
function pad(n: number) { return String(n).padStart(2, '0') }

export function KakaoMapConfigForm({ config, onChange }: ConfigFormProps) {
  const appKey    = (config.app_key    as string) || ''
  const centerLat = (config.center_lat as number) ?? 37.5665
  const centerLng = (config.center_lng as number) ?? 126.9780
  const zoom      = (config.zoom       as number) ?? 3
  const mapType   = (config.map_type   as MapType) || 'ROADMAP'
  const markers   = (config.markers    as MapMarker[]) || []
  const showCtrl  = (config.show_controls as boolean) !== false
  const mapHeight = (config.height     as number) ?? 400

  const [addrInput, setAddrInput] = useState('')
  const [addrSearching, setAddrSearching] = useState(false)
  const [addrError, setAddrError] = useState('')
  const [sdkReady, setSdkReady] = useState(false)

  // Load SDK for geocoding in config form
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

  const searchAddress = () => {
    if (!addrInput.trim() || !sdkReady) return
    setAddrSearching(true); setAddrError('')
    const geocoder = new window.kakao!.maps.services.Geocoder()
    geocoder.addressSearch(addrInput, (result, status) => {
      setAddrSearching(false)
      if (status === window.kakao!.maps.services.Status.OK && result[0]) {
        const lat = parseFloat(result[0].y)
        const lng = parseFloat(result[0].x)
        onChange({ ...config, center_lat: lat, center_lng: lng })
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
            <button
              key={t.value}
              type="button"
              onClick={() => onChange({ ...config, map_type: t.value })}
              className={mapType === t.value ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '5px 12px', fontSize: '12px' }}
            >
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

      {/* Center coordinates */}
      <div>
        <label style={labelStyle}>지도 중심 좌표</label>
        <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
          <div style={{ flex: 1 }}>
            <input
              className="input"
              type="number"
              step="0.0001"
              value={centerLat}
              onChange={e => onChange({ ...config, center_lat: parseFloat(e.target.value) || 0 })}
              placeholder="위도 (lat)"
              style={{ fontSize: '12px' }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <input
              className="input"
              type="number"
              step="0.0001"
              value={centerLng}
              onChange={e => onChange({ ...config, center_lng: parseFloat(e.target.value) || 0 })}
              placeholder="경도 (lng)"
              style={{ fontSize: '12px' }}
            />
          </div>
        </div>

        {/* Address search */}
        <div style={{ display: 'flex', gap: '6px' }}>
          <input
            className="input"
            value={addrInput}
            onChange={e => setAddrInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && searchAddress()}
            placeholder="주소로 검색 (예: 서울시청)"
            style={{ flex: 1, fontSize: '12px' }}
            disabled={!sdkReady}
          />
          <button
            type="button"
            onClick={searchAddress}
            disabled={!sdkReady || addrSearching}
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: '12px', flexShrink: 0 }}
          >
            {addrSearching ? '검색 중...' : '검색'}
          </button>
        </div>
        {addrError && <p style={{ fontSize: '11px', color: 'var(--danger)', marginTop: '4px' }}>{addrError}</p>}
        {!sdkReady && appKey && <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>SDK 로딩 후 주소 검색 가능</p>}
      </div>

      {/* Controls toggle */}
      <div style={rowStyle}>
        <input
          type="checkbox"
          id="map-show-ctrl"
          checked={showCtrl}
          onChange={e => onChange({ ...config, show_controls: e.target.checked })}
          style={{ width: '14px', height: '14px', accentColor: 'var(--accent)' }}
        />
        <label htmlFor="map-show-ctrl" style={{ fontSize: '13px', color: 'var(--text-primary)', cursor: 'pointer' }}>
          줌/지도 종류 컨트롤 표시
        </label>
      </div>

      {/* Markers */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <label style={{ ...labelStyle, marginBottom: 0 }}>마커 ({markers.length}개)</label>
          <button onClick={addMarker} className="btn-primary" style={{ padding: '4px 10px', fontSize: '12px' }}>
            + 마커 추가
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {markers.map((m, idx) => (
            <div key={m.id || idx} style={{ border: '1px solid var(--border)', borderRadius: '10px', padding: '10px', background: 'var(--bg-secondary)' }}>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '6px', alignItems: 'center' }}>
                <input
                  className="input"
                  placeholder="마커 제목"
                  value={m.title}
                  onChange={e => updateMarker(idx, { title: e.target.value })}
                  style={{ flex: 1, fontSize: '12px' }}
                />
                <button onClick={() => removeMarker(idx)} className="btn-danger" style={{ padding: '3px 7px', fontSize: '12px' }}>✕</button>
              </div>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                <input
                  className="input"
                  type="number"
                  step="0.0001"
                  placeholder="위도"
                  value={m.lat || ''}
                  onChange={e => updateMarker(idx, { lat: parseFloat(e.target.value) || 0 })}
                  style={{ flex: 1, fontSize: '12px' }}
                />
                <input
                  className="input"
                  type="number"
                  step="0.0001"
                  placeholder="경도"
                  value={m.lng || ''}
                  onChange={e => updateMarker(idx, { lng: parseFloat(e.target.value) || 0 })}
                  style={{ flex: 1, fontSize: '12px' }}
                />
              </div>
              <input
                className="input"
                placeholder="설명 (클릭 시 표시)"
                value={m.description || ''}
                onChange={e => updateMarker(idx, { description: e.target.value })}
                style={{ fontSize: '12px', padding: '5px 8px' }}
              />
            </div>
          ))}
          {markers.length === 0 && (
            <div style={{ textAlign: 'center', padding: '14px', color: 'var(--text-muted)', fontSize: '12px', border: '1px dashed var(--border)', borderRadius: '10px' }}>
              + 마커 추가 버튼으로 지도에 핀을 꽂을 수 있습니다
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
