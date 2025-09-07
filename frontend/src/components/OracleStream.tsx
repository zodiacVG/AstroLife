import React, { useEffect, useRef, useState } from 'react'
import { api } from '../lib/api'

interface OracleStreamProps {
  url: string
  payload?: any
  className?: string
  onDone?: (fullText: string) => void
  onError?: (error: Error) => void
}

// 解析阿里云百炼（DashScope/BaiLian）官方流式事件（SSE）
// 兼容格式：
// - event: result  data: { "output_text": "..." }
// - event: completed  data: { ... }
// - event: error  data: { "message": "..." }
// 同时兼容 OpenAI 兼容模式直接返回的纯文本分块（非SSE）。
const OracleStream: React.FC<OracleStreamProps> = ({ url, payload, className, onDone, onError }) => {
  const [visible, setVisible] = useState('')
  const startedRef = useRef(false)
  const doneRef = useRef(false)
  const onDoneRef = useRef<OracleStreamProps['onDone']>(onDone)
  const onErrorRef = useRef<OracleStreamProps['onError']>(onError)
  onDoneRef.current = onDone
  onErrorRef.current = onError

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true
    let cancelled = false
    const controller = new AbortController()

    async function run() {
      try {
        const resp = await fetch(api(url as any), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload || {}),
          signal: controller.signal,
        })

        if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
        if (!resp.body) throw new Error('ReadableStream not supported')

        const reader = resp.body.getReader()
        const decoder = new TextDecoder('utf-8')
        let buffer = ''
        let full = ''
        let usingSSE = false

        while (true) {
          const { value, done } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value, { stream: true })
          buffer += chunk

          // 优先尝试按SSE行解析
          let lineEnd = buffer.indexOf('\n')
          while (lineEnd !== -1) {
            const line = buffer.slice(0, lineEnd).trimEnd()
            buffer = buffer.slice(lineEnd + 1)
            lineEnd = buffer.indexOf('\n')

            if (!line) continue

            // 记录是否存在SSE关键字，以便确定模式
            if (line.startsWith('event:')) usingSSE = true

            // 简易SSE状态机：我们只关心 data: 行（可能多行）
            if (line.startsWith('data:')) {
              const jsonText = line.replace(/^data:\s*/, '')
              try {
                const obj = JSON.parse(jsonText)
                const text = obj.output_text || obj.delta || obj.text || ''
                if (text) {
                  full += text
                  if (!cancelled) setVisible(prev => prev + text)
                }
                if (obj.event === 'completed' || obj.finish_reason === 'stop') {
                  if (!cancelled && !doneRef.current) {
                    doneRef.current = true
                    onDoneRef.current && onDoneRef.current(full)
                  }
                }
              } catch {
                // data: 不是JSON，按纯文本追加
                full += jsonText
                if (!cancelled) setVisible(prev => prev + jsonText)
              }
            }
          }

          // 如果不是SSE格式，就当作纯文本直连流式（OpenAI兼容）
          if (!usingSSE && buffer) {
            full += buffer
            if (!cancelled) setVisible(prev => prev + buffer)
            buffer = ''
          }
        }

        // 结束收尾
        if (!cancelled && !doneRef.current) {
          doneRef.current = true
          onDoneRef.current && onDoneRef.current(full)
        }
      } catch (e: any) {
        if (cancelled) return
        const err = e instanceof Error ? e : new Error(String(e))
        onErrorRef.current && onErrorRef.current(err)
      }
    }

    run()
    return () => { cancelled = true; controller.abort() }
  }, [url])

  return (
    <div className={className} style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
      {visible}
      <span className="ao-cursor" />
    </div>
  )
}

export default OracleStream
