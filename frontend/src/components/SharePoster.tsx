import { useEffect, useMemo, useState, useRef } from 'react'
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
    width = 750,  // 减小宽度，更适合手机阅读
    height: propHeight,  // 移除默认高度，将根据内容动态计算
    backgroundSrc = '/share/background.png',
    logoSrc = '/share/logoonly.png',  // 使用logo only版本的logo
    name,
    question,
    interpretationMarkdown,
    origin,
    celestial,
    inquiry,
    qrLink,
  } = props

  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  const [dynamicHeight, setDynamicHeight] = useState<number>(propHeight || 1334)
  const [interpretationHeight, setInterpretationHeight] = useState<number>(200)
  const [isMounted, setIsMounted] = useState<boolean>(false)
  const interpretationRef = useRef<HTMLDivElement>(null)

  // 组件挂载后设置isMounted为true
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Merge starships for a small card row
  const starships = useMemo(() => (
    [
      origin && { tag: 'ORIGIN', ship: origin },
      celestial && { tag: 'CELESTIAL', ship: celestial },
      inquiry && { tag: 'INQUIRY', ship: inquiry },
    ].filter(Boolean) as { tag: string, ship: Starship }[]
  ), [origin, celestial, inquiry])

  // 计算动态高度
  useEffect(() => {
    console.log('[DEBUG] 动态高度计算useEffect触发，isMounted:', isMounted)
    if (!isMounted) return

    console.log('[DEBUG] 开始计算动态高度')
    // 基础高度：顶部区域(90px + 24px) + 底部区域(24px + 160px + 24px) + 间距
    const baseHeight = 90 + 24 + 24 + 160 + 24 + 24
    console.log('[DEBUG] 基础高度:', baseHeight)

    // 神谕区域高度：内容高度 + 内边距(32px) + 最小高度(200px)
    let newInterpretationHeight = 200
    if (interpretationRef.current) {
      newInterpretationHeight = Math.max(
        interpretationRef.current.scrollHeight + 32,
        200
      )
      console.log('[DEBUG] 神谕区域DOM元素scrollHeight:', interpretationRef.current.scrollHeight)
      console.log('[DEBUG] 计算出的神谕区域高度:', newInterpretationHeight)
      setInterpretationHeight(newInterpretationHeight)
    } else {
      console.log('[DEBUG] 神谕区域DOM元素尚未挂载')
    }

    // 星舟卡片区域高度（如果有）
    const starshipHeight = starships.length > 0 ? 100 : 0
    console.log('[DEBUG] 星舟卡片区域高度:', starshipHeight, '星舟数量:', starships.length)

    // 总高度：基础高度 + 神谕区域高度 + 星舟卡片区域高度 + 间距
    const totalHeight = baseHeight + newInterpretationHeight + starshipHeight
    console.log('[DEBUG] 计算出的总高度:', totalHeight)

    // 设置最大高度限制，避免过长
    const finalHeight = Math.min(totalHeight, 3000)
    console.log('[DEBUG] 最终设置的高度:', finalHeight)
    setDynamicHeight(finalHeight)
  }, [interpretationMarkdown, propHeight, starships, isMounted])

  // 组件挂载后延迟计算高度，确保DOM元素完全渲染
  useEffect(() => {
    console.log('[DEBUG] 延迟高度计算useEffect触发，isMounted:', isMounted, 'interpretationRef.current:', !!interpretationRef.current)
    if (isMounted && interpretationRef.current) {
      const timer = setTimeout(() => {
        console.log('[DEBUG] 延迟100ms后开始计算高度')
        // 基础高度：顶部区域(90px + 24px) + 底部区域(24px + 160px + 24px) + 间距
        const baseHeight = 90 + 24 + 24 + 160 + 24 + 24
        console.log('[DEBUG] 延迟计算 - 基础高度:', baseHeight)

        // 神谕区域高度：内容高度 + 内边距(32px) + 最小高度(200px)
        const newInterpretationHeight = Math.max(
          interpretationRef.current!.scrollHeight + 32,
          200
        )
        console.log('[DEBUG] 延迟计算 - 神谕区域scrollHeight:', interpretationRef.current!.scrollHeight)
        console.log('[DEBUG] 延迟计算 - 计算出的神谕区域高度:', newInterpretationHeight)
        setInterpretationHeight(newInterpretationHeight)

        // 星舟卡片区域高度（如果有）
        const starshipHeight = starships.length > 0 ? 100 : 0
        console.log('[DEBUG] 延迟计算 - 星舟卡片区域高度:', starshipHeight, '星舟数量:', starships.length)

        // 总高度：基础高度 + 神谕区域高度 + 星舟卡片区域高度 + 间距
        const totalHeight = baseHeight + newInterpretationHeight + starshipHeight
        console.log('[DEBUG] 延迟计算 - 计算出的总高度:', totalHeight)

        // 设置最大高度限制，避免过长
        const finalHeight = Math.min(totalHeight, 3000)
        console.log('[DEBUG] 延迟计算 - 最终设置的高度:', finalHeight)
        setDynamicHeight(finalHeight)
      }, 100)

      return () => clearTimeout(timer)
    }
  }, [isMounted, starships])

  // 生成二维码
  useEffect(() => {
    let canceled = false
    QRCode.toDataURL(qrLink, {
      errorCorrectionLevel: 'M',
      width: 200,  // 减小二维码尺寸以适应新的布局
      margin: 1,
      color: { dark: '#111111', light: '#ffffff' },
    }).then((url) => { if (!canceled) setQrDataUrl(url) }).catch(() => { })
    return () => { canceled = true }
  }, [qrLink])

  return (
    <div
      id="share-poster-root"
      style={{
        width,
        height: dynamicHeight,  // 使用动态计算的高度
        position: 'relative',
        background: `#0b0b10 url(${backgroundSrc}) center/cover no-repeat`,
        color: '#E6E6E6',
        fontFamily: '"PingFang SC", "Helvetica Neue", "Microsoft YaHei", sans-serif',  // 使用更适合中文阅读的字体
        overflow: 'hidden',
        borderRadius: 24,
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
      }}
    >
      {/* Dark overlay to increase contrast */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0.65) 100%)' }} />

      {/* Logo */}
      <img src={logoSrc} alt="logo" style={{ position: 'absolute', top: 24, left: 24, height: 48, opacity: 0.95 }} />

      {/* Header block */}
      <div style={{ position: 'absolute', top: 90, left: 24, right: 24 }}>
        <div style={{ fontSize: 16, letterSpacing: 1, opacity: 0.9 }}>ASTRORACLE · 神谕</div>
        <div style={{ marginTop: 8, fontSize: 32, fontWeight: 700 }}>
          {clamp(name || '你', 24)}
        </div>
        <div style={{ marginTop: 4, fontSize: 18, opacity: 0.9 }}>问题 / Question</div>
        <div style={{ marginTop: 2, fontSize: 20, lineHeight: 1.5, color: '#F0F3FF' }}>
          {clamp(question, 120)}
        </div>
      </div>

      {/* Oracle interpretation */}
      <div ref={interpretationRef} style={{ position: 'absolute', top: 220, left: 24, right: 24, height: 'auto', minHeight: 200 }}>
        <div style={{
          position: 'relative',  // 改为relative以允许内容扩展
          overflow: 'auto', paddingRight: 8,
          borderRadius: 16, background: 'rgba(4,6,12,0.35)', backdropFilter: 'blur(4px)',
          border: '1px solid rgba(255,255,255,0.06)'
        }}>
          <div style={{ padding: 16, fontSize: 18, lineHeight: 1.6 }}>
            <ReactMarkdown>{interpretationMarkdown}</ReactMarkdown>
          </div>
        </div>
      </div>

      {/* Starship mini cards */}
      {starships.length > 0 && (
        <div style={{ position: 'absolute', left: 24, right: 24, top: `calc(220px + ${interpretationHeight}px)`, display: 'grid', gridTemplateColumns: `repeat(${starships.length}, 1fr)`, gap: 10 }}>
          {starships.map(({ tag, ship }) => (
            <div key={tag} style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
              border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 12,
              boxShadow: '0 8px 18px rgba(0,0,0,0.25)'
            }}>
              <div style={{ fontSize: 10, letterSpacing: 1, opacity: 0.7 }}>{tag}</div>
              <div style={{ fontSize: 16, fontWeight: 700, marginTop: 3 }}>{ship.name_cn}</div>
              <div style={{ fontSize: 11, opacity: 0.8, marginTop: 1 }}>ID {ship.archive_id}</div>
              {Array.isArray(ship.oracle_keywords) && ship.oracle_keywords.length > 0 && (
                <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {ship.oracle_keywords.slice(0, 3).map((k, i) => (
                    <span key={i} style={{ fontSize: 10, padding: '2px 6px', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 999, opacity: 0.85 }}>{k}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Footer with QR */}
      <div style={{ position: 'absolute', left: 24, right: 24, bottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 16, opacity: 0.85 }}>长按识别二维码</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>astroracle2.zeabur.app</div>
        </div>
        <div style={{ width: 160, height: 160, background: '#fff', borderRadius: 12, padding: 8 }}>
          {qrDataUrl && <img src={qrDataUrl} alt="QR" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 8 }} />}
        </div>
      </div>
    </div>
  )
}

export async function exportPosterAsPng(root: HTMLElement, filename = 'astroracle-poster.png', pixelRatio = 2): Promise<string | null> {
  try {
    console.log('[DEBUG] exportPosterAsPng函数开始执行')
    console.log('[DEBUG] 传入的根元素尺寸:', {
      scrollWidth: root.scrollWidth,
      scrollHeight: root.scrollHeight,
      offsetWidth: root.offsetWidth,
      offsetHeight: root.offsetHeight,
      clientWidth: root.clientWidth,
      clientHeight: root.clientHeight
    })

    // 等待高度计算完成，确保DOM元素完全渲染
    console.log('[DEBUG] 开始500ms延迟，等待高度计算完成')
    await new Promise(resolve => setTimeout(resolve, 500))
    console.log('[DEBUG] 500ms延迟结束')

    console.log('[DEBUG] 延迟后的根元素尺寸:', {
      scrollWidth: root.scrollWidth,
      scrollHeight: root.scrollHeight,
      offsetWidth: root.offsetWidth,
      offsetHeight: root.offsetHeight
    })

    console.log('[DEBUG] 开始调用htmlToImage.toPng')
    const dataUrl = await htmlToImage.toPng(root, {
      pixelRatio,
      cacheBust: true,
      width: root.scrollWidth,
      height: root.scrollHeight,
    })
    console.log('[DEBUG] htmlToImage.toPng执行成功，dataUrl长度:', dataUrl.length)

    console.log('[DEBUG] 开始创建下载链接')
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    console.log('[DEBUG] 下载链接创建并触发点击，函数执行完成')
    return dataUrl
  } catch (e) {
    console.error('[DEBUG] exportPosterAsPng函数执行出错:', e)
    return null
  }
}
