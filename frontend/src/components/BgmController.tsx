import React, { useEffect, useMemo, useRef, useState } from 'react'
import { api } from '../lib/api'

function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? (JSON.parse(raw) as T) : initial
    } catch {
      return initial
    }
  })
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
  }, [key, value])
  return [value, setValue] as const
}

const BgmController: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  // "on" | "off"; respects user’s initial choice
  const [pref, setPref] = useLocalStorage<'on' | 'off'>(
    'bgmPreference',
    'off',
  )
  // mute state for quick toggle
  const [muted, setMuted] = useLocalStorage<boolean>('bgmMuted', true)
  const [promptVisible, setPromptVisible] = useState<boolean>(() => {
    return localStorage.getItem('bgmPreference') == null
  })

  // Build src with proper encoding for the leading space in filename
  const src = useMemo(() => api('/media/space.wav'), [])

  // Sync audio element with state
  useEffect(() => {
    const el = audioRef.current
    if (!el) return
    el.muted = muted
    // If user enabled BGM, try to play when unmuted
    if (pref === 'on' && !muted) {
      el.play().catch(() => {/* ignored; will require user interaction */})
    }
  }, [pref, muted])

  const enableMusic = async () => {
    setPref('on')
    setMuted(false)
    setPromptVisible(false)
    try {
      await audioRef.current?.play()
    } catch {
      // Browsers may still block; user can use toggle button if needed
    }
  }

  const disableMusic = () => {
    setPref('off')
    setMuted(true)
    setPromptVisible(false)
    try { audioRef.current?.pause() } catch {}
  }

  const toggleMute = () => setMuted(m => !m)

  // Listen to external toggle/set events (e.g., GlobalBar button)
  useEffect(() => {
    const onToggle = () => setMuted(m => !m)
    const onSet = (e: Event) => {
      try {
        const det: any = (e as CustomEvent).detail
        if (typeof det?.muted === 'boolean') setMuted(det.muted)
      } catch {}
    }
    window.addEventListener('astro-bgm-toggle', onToggle as any)
    window.addEventListener('astro-bgm-set', onSet as any)
    return () => {
      window.removeEventListener('astro-bgm-toggle', onToggle as any)
      window.removeEventListener('astro-bgm-set', onSet as any)
    }
  }, [])

  // Broadcast current state so toolbar can reflect it
  useEffect(() => {
    try {
      window.dispatchEvent(new CustomEvent('astro-bgm-state', { detail: { muted, pref } }))
    } catch {}
  }, [muted, pref])

  return (
    <>
      {/* Hidden audio element; we control via custom UI */}
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        loop
        crossOrigin="anonymous"
        style={{ display: 'none' }}
      />

      {/* Initial prompt */}
      {promptVisible && (
        <div style={overlayStyle}>
          <div className="ao-container" style={{ maxWidth: 560 }}>
            <div className="ao-screen" style={{ textAlign: 'left' }}>
              <div className="ao-header--inverted">音频提示 AUDIO NOTICE</div>
              <div style={{ fontFamily: 'var(--ao-font-ui)', fontSize: 16, marginBottom: 12 }}>
                我们为此体验创作了背景音乐，建议打开以获得最佳沉浸感。是否开启？
              </div>
              <div className="ao-hint" style={{ marginBottom: 12 }}>
                We composed a background score for better immersion. Enable it?
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button className="ao-button" onClick={enableMusic}>
                  开启音乐 Enable
                </button>
                <button className="ao-button" onClick={disableMusic}>
                  关闭音乐 Disable
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Position control moved to GlobalBar; no floating button here */}
    </>
  )
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,.7)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9998,
}

export default BgmController
