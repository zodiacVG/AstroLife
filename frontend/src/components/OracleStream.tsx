import React, { useEffect, useRef, useState } from 'react'
import { api } from '../lib/api'

interface OracleStreamProps {
  // 如果提供 text，则以打字机方式回放；否则使用 url+payload 真流式
  text?: string
  url?: string
  payload?: any
  speed?: number // ms per char（仅用于 text 模式）
  className?: string
  onDone?: (fullText: string) => void
}

const OracleStream: React.FC<OracleStreamProps> = ({ text, url, payload, speed = 18, className, onDone }) => {
  const [visible, setVisible] = useState('')
  const startedRef = useRef(false)
  const doneRef = useRef(false)
  const onDoneRef = useRef<OracleStreamProps['onDone']>(onDone)
  onDoneRef.current = onDone

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true
    let cancelled = false
    const controller = new AbortController()

    async function run() {
      // 1) 真实流式（优先）
      if (url) {
        try {
          const resp = await fetch(api(url as any), {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload || {}),
            signal: controller.signal,
          })
          if (resp.body) {
            const reader = resp.body.getReader()
            const decoder = new TextDecoder('utf-8')
            let full = ''
            while (true) {
              const { value, done } = await reader.read()
              if (done) break
              const chunk = decoder.decode(value)
              full += chunk
              if (!cancelled) setVisible(prev => prev + chunk)
            }
            if (!cancelled && !doneRef.current) {
              doneRef.current = true
              onDoneRef.current && onDoneRef.current(full)
            }
            return
          }
        } catch (e) {
          if (cancelled) return
          // 回退到本地打字机
        }
      }

      // 2) 本地打字机模式
      const t = text || ''
      let i = 0
      const timer = setInterval(() => {
        i += 1
        if (!cancelled) setVisible(t.slice(0, i))
        if (i >= t.length) {
          clearInterval(timer)
          if (!cancelled && !doneRef.current) {
            doneRef.current = true
            onDoneRef.current && onDoneRef.current(t)
          }
        }
      }, speed)
      return () => clearInterval(timer)
    }
    run()
    return () => { cancelled = true; controller.abort() }
  }, [text, url, speed])

  return (
    <div className={className} style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
      {visible}<span className="ao-cursor" />
    </div>
  )
}

export default OracleStream
