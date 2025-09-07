import React, { useEffect, useRef, useState } from 'react'
import { api } from '../lib/api'

interface OracleStreamProps {
  url: string
  params: Record<string, string | number | boolean | null | undefined>
  className?: string
  onDone?: (fullText: string) => void
  onError?: (error: Error) => void
}

// 仅使用原生 EventSource（阿里云/百炼 SSE 常规方式）：
// event: result     data: { "output_text": "..." }
// event: completed  data: { "ok": true }
// event: error      data: { "message": "..." }
const OracleStream: React.FC<OracleStreamProps> = ({ url, params, className, onDone, onError }) => {
  const [visible, setVisible] = useState('')
  const startedRef = useRef(false)
  const doneRef = useRef(false)
  const onDoneRef = useRef<OracleStreamProps['onDone']>(onDone)
  const onErrorRef = useRef<OracleStreamProps['onError']>(onError)
  onDoneRef.current = onDone
  onErrorRef.current = onError

  useEffect(() => {
    // 重置状态，确保每次参数变化都能重新启动流式连接
    startedRef.current = false
    doneRef.current = false
    setVisible('')
    
    // 检查必要参数是否存在
    const hasRequiredParams = params.origin_id && params.celestial_id && params.inquiry_id;
    if (!hasRequiredParams) {
      console.log('[OracleStream] Missing required parameters, skipping stream');
      return;
    }
    
    let cancelled = false
    let es: EventSource | null = null

    const startStream = () => {
      if (startedRef.current) return
      startedRef.current = true

      const qs = Object.entries(params || {})
        .filter(([, v]) => v !== undefined && v !== null && v !== '')
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join('&')
      const esUrl = api(qs ? `${url}?${qs}` : url)
      console.group('[OracleStream] start')
      console.log('url:', url)
      console.log('params:', params)
      console.log('esUrl:', esUrl)
      console.groupEnd()

      let full = ''
      es = new EventSource(esUrl)

      const handleResult = (evt: MessageEvent) => {
        try {
          const obj = JSON.parse(evt.data)
          const text = obj.output_text || obj.delta || obj.text || ''
          if (text) {
            console.debug('[OracleStream] result chunk len:', text.length)
            full += text
            if (!cancelled) setVisible(prev => prev + text)
          }
        } catch {
          const t = String(evt.data)
          console.debug('[OracleStream] result(nonjson) len:', t.length)
          full += t
          if (!cancelled) setVisible(prev => prev + text)
        }
      }

      const handleCompleted = () => {
        console.log('[OracleStream] completed, total length:', full.length)
        if (!cancelled && !doneRef.current) {
          doneRef.current = true
          onDoneRef.current && onDoneRef.current(full)
        }
        if (es) {
          es.close()
          es = null
        }
      }

      const handleError = (evt: MessageEvent | Event) => {
        try {
          // 自定义 error 事件（服务端 event: error）
          const me = evt as MessageEvent
          if (me.data) {
            const data = JSON.parse(me.data)
            const message = data?.message || 'Stream error'
            console.error('[OracleStream] error event:', message)
            onErrorRef.current && onErrorRef.current(new Error(message))
          } else {
            // 连接错误
            console.error('[OracleStream] connection error')
            onErrorRef.current && onErrorRef.current(new Error('SSE connection error'))
          }
        } catch {
          console.error('[OracleStream] error (parse)')
          onErrorRef.current && onErrorRef.current(new Error('Stream error'))
        }
        if (es) {
          es.close()
          es = null
        }
      }

      es.addEventListener('result', handleResult)
      es.addEventListener('completed', handleCompleted)
      es.addEventListener('error', handleError)
    }

    // 延迟启动流式连接，确保状态已重置
    const timer = setTimeout(startStream, 100)

    return () => {
      cancelled = true
      clearTimeout(timer)
      if (es) {
        es.close()
        es = null
      }
    }
  }, [url, JSON.stringify(params)])

  return (
    <div className={className} style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
      {visible}
      <span className="ao-cursor" />
    </div>
  )
}

export default OracleStream
