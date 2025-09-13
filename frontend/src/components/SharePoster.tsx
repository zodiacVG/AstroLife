import { useEffect, useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import * as htmlToImage from 'html-to-image'
import * as QRCode from 'qrcode'

type Starship = {
  archive_id: string
  name_cn: string
  oracle_keywords?: string[]
}

export type SharePosterProps = {
  width?: number
  height?: number
  backgroundSrc?: string
  logoSrc?: string
  name: string
  question: string
  interpretationMarkdown: string
  origin?: Starship | null
  celestial?: Starship | null
  inquiry?: Starship | null
  qrLink: string
}

const clamp = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + '…' : s)

export default function SharePoster(props: SharePosterProps) {
  const {
    width = 1080,
    height = 1920,
    backgroundSrc = '/share/background.png',
    logoSrc = '/share/loogrmv.png',
    name,
    question,
    interpretationMarkdown,
    origin,
    celestial,
    inquiry,
    qrLink,
  } = props

  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  useEffect(() => {
    let canceled = false
    QRCode.toDataURL(qrLink, {
      errorCorrectionLevel: 'M',
      width: 280,
      margin: 1,
      color: { dark: '#111111', light: '#ffffff' },
    }).then((url) => { if (!canceled) setQrDataUrl(url) }).catch(() => {})
    return () => { canceled = true }
  }, [qrLink])

  // Merge starships for a small card row
  const starships = useMemo(() => (
    [
      origin && { tag: 'ORIGIN', ship: origin },
      celestial && { tag: 'CELESTIAL', ship: celestial },
      inquiry && { tag: 'INQUIRY', ship: inquiry },
    ].filter(Boolean) as { tag: string, ship: Starship }[]
  ), [origin, celestial, inquiry])

  return (
    <div
      id="share-poster-root"
      style={{
        width,
        height,
        position: 'relative',
        background: `#0b0b10 url(${backgroundSrc}) center/cover no-repeat`,
        color: '#E6E6E6',
        fontFamily: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
        overflow: 'hidden',
        borderRadius: 24,
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
      }}
    >
      {/* Dark overlay to increase contrast */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0.65) 100%)' }} />

      {/* Logo */}
      <img src={logoSrc} alt="logo" style={{ position: 'absolute', top: 36, left: 36, height: 64, opacity: 0.95 }} />

      {/* Header block */}
      <div style={{ position: 'absolute', top: 120, left: 36, right: 36 }}>
        <div style={{ fontSize: 18, letterSpacing: 2, opacity: 0.9 }}>ASTRORACLE · 神谕</div>
        <div style={{ marginTop: 10, fontSize: 40, fontWeight: 700 }}>
          {clamp(name || '你', 24)}
        </div>
        <div style={{ marginTop: 6, fontSize: 22, opacity: 0.9 }}>问题 / Question</div>
        <div style={{ marginTop: 4, fontSize: 24, lineHeight: 1.5, color: '#F0F3FF' }}>
          {clamp(question, 120)}
        </div>
      </div>

      {/* Oracle interpretation */}
      <div style={{ position: 'absolute', top: 360, left: 36, right: 36, bottom: 420, overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', inset: 0, overflow: 'auto', paddingRight: 8,
          borderRadius: 16, background: 'rgba(4,6,12,0.35)', backdropFilter: 'blur(4px)',
          border: '1px solid rgba(255,255,255,0.06)'
        }}>
          <div style={{ padding: 20, fontSize: 22, lineHeight: 1.7 }}>
            <ReactMarkdown>{interpretationMarkdown}</ReactMarkdown>
          </div>
        </div>
      </div>

      {/* Starship mini cards */}
      {starships.length > 0 && (
        <div style={{ position: 'absolute', left: 36, right: 36, bottom: 300, display: 'grid', gridTemplateColumns: `repeat(${starships.length}, 1fr)`, gap: 12 }}>
          {starships.map(({ tag, ship }) => (
            <div key={tag} style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
              border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 14,
              boxShadow: '0 8px 18px rgba(0,0,0,0.25)'
            }}>
              <div style={{ fontSize: 12, letterSpacing: 2, opacity: 0.7 }}>{tag}</div>
              <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>{ship.name_cn}</div>
              <div style={{ fontSize: 13, opacity: 0.8, marginTop: 2 }}>ID {ship.archive_id}</div>
              {Array.isArray(ship.oracle_keywords) && ship.oracle_keywords.length > 0 && (
                <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {ship.oracle_keywords.slice(0, 3).map((k, i) => (
                    <span key={i} style={{ fontSize: 12, padding: '3px 8px', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 999, opacity: 0.85 }}>{k}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Footer with QR */}
      <div style={{ position: 'absolute', left: 36, right: 36, bottom: 36, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 18, opacity: 0.85 }}>长按识别二维码</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>astroracle2.zeabur.app</div>
        </div>
        <div style={{ width: 220, height: 220, background: '#fff', borderRadius: 16, padding: 10 }}>
          {qrDataUrl && <img src={qrDataUrl} alt="QR" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 12 }} />}
        </div>
      </div>
    </div>
  )
}

export async function exportPosterAsPng(root: HTMLElement, filename = 'astroracle-poster.png', pixelRatio = 2): Promise<string | null> {
  try {
    const dataUrl = await htmlToImage.toPng(root, { pixelRatio, cacheBust: true })
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    return dataUrl
  } catch (e) {
    console.error('export poster failed', e)
    return null
  }
}
