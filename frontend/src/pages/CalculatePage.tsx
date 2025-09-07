import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import OracleStream from '../components/OracleStream'
import { api } from '../lib/api'

const CalculatePage: React.FC = () => {
  const [birthDate, setBirthDate] = useState('')
  const [question, setQuestion] = useState('')
  const [isCalculating, setIsCalculating] = useState(false)
  const [result, setResult] = useState<any>(null)
  
  // 分步状态
  type StepStatus = 'idle' | 'loading' | 'success' | 'error'
  const [originStatus, setOriginStatus] = useState<StepStatus>('idle')
  const [celestialStatus, setCelestialStatus] = useState<StepStatus>('idle')
  const [inquiryStatus, setInquiryStatus] = useState<StepStatus>('idle')
  const [originData, setOriginData] = useState<any>(null)
  const [celestialData, setCelestialData] = useState<any>(null)
  const [inquiryData, setInquiryData] = useState<any>(null)
  const [interpretation, setInterpretation] = useState<string | null>(null)
  const [finalTried, setFinalTried] = useState(false)
  const [debugLogs, setDebugLogs] = useState<string[]>([])
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const STORAGE_KEY = 'calcState-v1'
  const DEVICE_KEY = 'deviceId-v1'

  // 恢复会话状态（返回时保留结果）
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const s = JSON.parse(raw)
      if (s) {
        setBirthDate(s.birthDate || '')
        setQuestion(s.question || '')
        setOriginStatus(s.originStatus || 'idle')
        setCelestialStatus(s.celestialStatus || 'idle')
        setInquiryStatus(s.inquiryStatus || 'idle')
        setOriginData(s.originData || null)
        setCelestialData(s.celestialData || null)
        setInquiryData(s.inquiryData || null)
        setInterpretation(s.interpretation ?? null)
        setFinalTried(!!s.finalTried)
      }
    } catch {}
  }, [])

  // 设备ID（同一浏览器一致）
  const getDeviceId = () => {
    let id = localStorage.getItem(DEVICE_KEY)
    if (!id) {
      id = Math.random().toString(36).slice(2) + Date.now().toString(36)
      localStorage.setItem(DEVICE_KEY, id)
    }
    return id
  }

  // 持久化关键状态
  useEffect(() => {
    const snapshot = {
      birthDate,
      question,
      originStatus,
      celestialStatus,
      inquiryStatus,
      originData,
      celestialData,
      inquiryData,
      interpretation,
      finalTried,
    }
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot)) } catch {}
  }, [birthDate, question, originStatus, celestialStatus, inquiryStatus, originData, celestialData, inquiryData, interpretation, finalTried])
  
  const canShowFinal = useMemo(() => {
    // 要求：三舟成功 且 三个ID都就绪 才展示最终解读（避免SSE缺参导致连接失败）
    const oId = originData?.starship?.archive_id
    const cId = celestialData?.starship?.archive_id
    const iId = inquiryData?.starship?.archive_id
    const hasIds = !!oId && !!cId && !!iId
    
    // 如果没有问题，则不需要检查 inquiryStatus
    const inquiryOk = !question || inquiryStatus === 'success'
    
    return hasIds && originStatus === 'success' && celestialStatus === 'success' && inquiryOk
  }, [originStatus, celestialStatus, inquiryStatus, question, originData, celestialData, inquiryData])

  // 调试：任何状态变化时打印关键信息
  useEffect(() => {
    console.group('[Divine] step statuses')
    console.log('originStatus:', originStatus)
    console.log('celestialStatus:', celestialStatus)
    console.log('inquiryStatus:', inquiryStatus)
    console.log('canShowFinal:', canShowFinal)
    
    // Update debug logs
    setDebugLogs(prev => [
      ...prev.slice(-9), // Keep only the last 9 logs
      `originStatus: ${originStatus}`,
      `celestialStatus: ${celestialStatus}`,
      `inquiryStatus: ${inquiryStatus}`,
      `canShowFinal: ${canShowFinal}`
    ])
    if (
      originStatus === 'success' &&
      celestialStatus === 'success' &&
      inquiryStatus === 'success' &&
      !canShowFinal
    ) {
      console.warn('[Divine] 三个步骤成功但最终不可展示，可能因ID未就绪:', {
        o: originData?.starship?.archive_id,
        c: celestialData?.starship?.archive_id,
        i: inquiryData?.starship?.archive_id,
        q: !!question,
      })
    }
    console.groupEnd()
  }, [originStatus, celestialStatus, inquiryStatus, canShowFinal, originData, celestialData, inquiryData, question])

  // 调试：当满足渲染最终解读的条件时，打印三艘飞船ID和问题
  useEffect(() => {
    if (canShowFinal) {
      const originId = originData?.starship?.archive_id
      const celestialId = celestialData?.starship?.archive_id
      const inquiryId = inquiryData?.starship?.archive_id
      console.group('[Divine] canShowFinal=true → stream params')
      console.log('origin_id:', originId)
      console.log('celestial_id:', celestialId)
      console.log('inquiry_id:', inquiryId)
      console.log('question:', question)
      console.groupEnd()
    }
  }, [canShowFinal, originData, celestialData, inquiryData, question])

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Add to command history
    const command = `DIVINATION EXECUTED - BIRTH_DATE: ${birthDate}${question ? `, QUERY: ${question}` : ''}`
    setCommandHistory(prev => [...prev.slice(-4), command])
  
    if (!birthDate) {
      alert('请输入出生日期')
      return
    }

    setIsCalculating(true)
    setResult(null)
    setInterpretation(null)
    setOriginData(null)
    setCelestialData(null)
    setInquiryData(null)
    setOriginStatus('loading')
    setCelestialStatus('loading')
    setInquiryStatus(question ? 'loading' : 'idle')

    try {
      // 并发启动三个子计算
      const tasks: Promise<void>[] = []
      let okOrigin = false
      let okCelestial = false
      let okInquiry = !question // if no question, treat as satisfied

      // origin
      tasks.push((async () => {
        try {
          const resp = await fetch(api('/api/v1/divine/origin'), {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ birth_date: birthDate })
          })
          if (!resp.ok) throw new Error('origin failed')
          const json = await resp.json()
          setOriginData(json.data)
          setOriginStatus('success')
          okOrigin = true
        } catch {
          setOriginStatus('error')
        }
      })())

      // celestial
      tasks.push((async () => {
        try {
          const resp = await fetch(api('/api/v1/divine/celestial'), {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
          })
          if (!resp.ok) throw new Error('celestial failed')
          const json = await resp.json()
          setCelestialData(json.data)
          setCelestialStatus('success')
          okCelestial = true
        } catch {
          setCelestialStatus('error')
        }
      })())

      // inquiry（可选）
      if (question) {
        tasks.push((async () => {
          try {
            const resp = await fetch(api('/api/v1/divine/inquiry'), {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ question })
            })
            if (!resp.ok) throw new Error('inquiry failed')
            const json = await resp.json()
            setInquiryData(json.data)
            setInquiryStatus('success')
            okInquiry = true
          } catch {
            setInquiryStatus('error')
          }
        })())
      }

      await Promise.allSettled(tasks)

      console.group('[Divine] steps completed')
      console.log('origin ok/data:', okOrigin, originData)
      console.log('celestial ok/data:', okCelestial, celestialData)
      console.log('inquiry ok/data:', okInquiry, inquiryData)
      console.groupEnd()

      // 三舟阶段完成后：若三者均成功，则挂载流式 Oracle（SSE）
      const readyForComplete = (okOrigin && okCelestial && (question ? okInquiry : true))
      if (readyForComplete) {
        console.log('[Divine] readyForComplete=true, will mount OracleStream')
        setInterpretation(null)
        setFinalTried(true)
      } else {
        console.log('[Divine] readyForComplete=false', { okOrigin, okCelestial, okInquiry, question })
        setFinalTried(false)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('占卜计算失败，请稍后重试')
    } finally {
      setIsCalculating(false)
    }
  }

  return (
    <div className="ao-container ao-screen">
      <h2 className="ao-screen__title">Divination Console</h2>
      <div className="ao-module">
        <div className="ao-header--inverted">[SYSTEM] INPUT_TERMINAL</div>
        <div className="ao-console-line">/&gt;_ Awaiting command input... <span className="ao-cursor"></span></div>
        <form onSubmit={handleCalculate} className="ao-form" aria-label="占卜输入">
          <div className="ao-field">
          <label htmlFor="birthDate" className="ao-header--standard">[PARAM] BIRTH_DATE / REQUIRED</label>
            <div className="ao-console-field">
              <input
                className="ao-input"
                type="date"
                id="birthDate"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                required
              />
              <span className="ao-cursor"></span>
            </div>
          </div>

          <div className="ao-field">
          <label htmlFor="question" className="ao-header--standard">[PARAM] QUERY / OPTIONAL</label>
            <div className="ao-console-field">
              <textarea
                className="ao-textarea"
                id="question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Enter query for oracle analysis..."
                rows={2}
              />
              <span className="ao-cursor"></span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isCalculating}
            className="ao-button"
          >
            {isCalculating ? '[PROCESSING]...' : '[EXECUTE] DIVINATION'}
          </button>
        </form>
      </div>

      <div className="ao-module">
        <div className="ao-header--inverted">[SYSTEM] DEVICE_ID / TERMINAL</div>
        <div className="ao-console-line">[ID] {getDeviceId()}</div>
      </div>

      <div className="ao-module">
        <div className="ao-header--inverted">[SYSTEM] STATUS / MONITOR</div>
        <div className="ao-console-line">[STATUS] SYSTEM_READY</div>
      </div>

      <div className="ao-module">
        <div className="ao-header--inverted">[SYSTEM] DEBUG_LOG / VERBOSE</div>
        {debugLogs.map((log, index) => (
          <div key={index} className="ao-console-line">
            [LOG] {log}
          </div>
        ))}
      </div>

      <div className="ao-module">
        <div className="ao-header--inverted">[SYSTEM] COMMAND_HISTORY / BUFFER</div>
        {commandHistory.map((cmd, index) => (
          <div key={index} className="ao-console-line">
            [CMD] {cmd}
          </div>
        ))}
      </div>

      {(originStatus !== 'idle' || celestialStatus !== 'idle' || inquiryStatus !== 'idle') && (
        <div className="ao-module" role="region" aria-label="占卜结果">
          <div className="ao-header--inverted">[SYSTEM] OUTPUT_TERMINAL</div>
          
          {/* 三体共振显示 */}
          <div className="ao-grid ao-grid--starships">
            {/* 本命星舟 */}
            {originStatus === 'loading' && (<div className="ao-card ao-card--starship is-loading"><h4 className="ao-header--standard">[ORIGIN] STARSHIP_01</h4><div className="ao-console-line">[STATUS] PROCESSING <span className="ao-cursor"></span></div></div>)}
            {originStatus === 'error' && (<div className="ao-card ao-card--starship is-error"><h4 className="ao-header--standard">[ORIGIN] STARSHIP_01</h4><div><span className="ao-chip err">ERR</span> [ERROR] PROCESSING_FAILED</div></div>)}
            {originStatus === 'success' && originData?.starship && (
              <div className="ao-card ao-card--starship is-success">
                <h4>[ORIGIN] STARSHIP_01</h4>
                <div className="starship-info">
                  <div className="starship-name">[NAME] {originData.starship.name_cn}</div>
                  <div className="starship-id">[ID] {originData.starship.archive_id}</div>
                  <div className="starship-description">[DATA] {originData.starship.oracle_text}</div>
                  <div className="match-score">[MATCH_SCORE] {originData.match_score ?? 0}</div>
                </div>
                <Link className="ao-button" to={`/starships/${originData.starship.archive_id}`}>[VIEW] DETAILS</Link>
              </div>
            )}

            {/* 天时星舟 */}
            {celestialStatus === 'loading' && (<div className="ao-card ao-card--starship is-loading"><h4 className="ao-header--standard">[CELESTIAL] STARSHIP_02</h4><div className="ao-console-line">[STATUS] PROCESSING <span className="ao-cursor"></span></div></div>)}
            {celestialStatus === 'error' && (<div className="ao-card ao-card--starship is-error"><h4 className="ao-header--standard">[CELESTIAL] STARSHIP_02</h4><div><span className="ao-chip err">ERR</span> [ERROR] PROCESSING_FAILED</div></div>)}
            {celestialStatus === 'success' && celestialData?.starship && (
              <div className="ao-card ao-card--starship is-success">
                <h4>[CELESTIAL] STARSHIP_02</h4>
                <div className="starship-info">
                  <div className="starship-name">[NAME] {celestialData.starship.name_cn}</div>
                  <div className="starship-id">[ID] {celestialData.starship.archive_id}</div>
                  <div className="starship-description">[DATA] {celestialData.starship.oracle_text}</div>
                  <div className="match-score">[MATCH_SCORE] {celestialData.match_score ?? 0}</div>
                </div>
                <Link className="ao-button" to={`/starships/${celestialData.starship.archive_id}`}>[VIEW] DETAILS</Link>
              </div>
            )}

            {/* 问道星舟 */}
            {inquiryStatus === 'loading' && (<div className="ao-card ao-card--starship is-loading"><h4 className="ao-header--standard">[INQUIRY] STARSHIP_03</h4><div className="ao-console-line">[STATUS] PROCESSING <span className="ao-cursor"></span></div></div>)}
            {inquiryStatus === 'error' && (<div className="ao-card ao-card--starship is-error"><h4 className="ao-header--standard">[INQUIRY] STARSHIP_03</h4><div><span className="ao-chip err">ERR</span> [ERROR] PROCESSING_FAILED / LLM_TIMEOUT</div></div>)}
            {inquiryStatus === 'success' && inquiryData?.starship && (
              <div className="ao-card ao-card--starship is-success">
                <h4>[INQUIRY] STARSHIP_03</h4>
                <div className="starship-info">
                  <div className="starship-name">[NAME] {inquiryData.starship.name_cn}</div>
                  <div className="starship-id">[ID] {inquiryData.starship.archive_id}</div>
                  <div className="starship-description">[DATA] {inquiryData.starship.oracle_text}</div>
                  <div className="match-score">[MATCH_SCORE] {inquiryData.match_score ?? 0}</div>
                </div>
                <Link className="ao-button" to={`/starships/${inquiryData.starship.archive_id}`}>[VIEW] DETAILS</Link>
              </div>
            )}
          </div>

          {/* 神谕解读（流式，直接调用 oracle/stream，传入三艘飞船ID与问题） */}
          {canShowFinal && (
            <div className="ao-module" data-tone="oracle">
              <div className="ao-header--inverted">[SYSTEM] ORACLE_OUTPUT / STREAMING</div>
              <OracleStream
                key={`${originData?.starship?.archive_id}-${celestialData?.starship?.archive_id}-${inquiryData?.starship?.archive_id}-${question || ''}`}
                url="/api/v1/oracle/stream"
                params={{
                  origin_id: originData?.starship?.archive_id,
                  celestial_id: celestialData?.starship?.archive_id,
                  inquiry_id: inquiryData?.starship?.archive_id,
                  question: question || ''
                }}
                onDone={async (t) => {
                  setInterpretation(t)
                  try {
                    const device_id = getDeviceId()
                    const record = {
                      id: `${Date.now()}`,
                      device_id,
                      time: Date.now(),
                      birth_date: birthDate,
                      question: question || null,
                      origin: originData?.starship || null,
                      celestial: celestialData?.starship || null,
                      inquiry: inquiryData?.starship || null,
                      interpretation: t || null,
                    }
                    await fetch(api('/api/v1/history'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(record) })
                  } catch {}
                }}
                onError={(e) => {
                  console.error('oracle stream error', e)
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default CalculatePage
