import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import OracleStream from '../components/OracleStream'
import { api } from '../lib/api'

const CalculatePage: React.FC = () => {
  const [name, setName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [question, setQuestion] = useState('')
  const [isCalculating, setIsCalculating] = useState(false)
  
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
  const STORAGE_KEY = 'calcState-v1'
  const DEVICE_KEY = 'deviceId-v1'

  // 恢复会话状态（返回时保留结果）
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const s = JSON.parse(raw)
      if (s) {
        setName(s.name || '')
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
      name,
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
  }, [name, birthDate, question, originStatus, celestialStatus, inquiryStatus, originData, celestialData, inquiryData, interpretation, finalTried])
  
  const effectiveName = useMemo(() => (name && name.trim()) ? name.trim() : '你', [name])
  const effectiveQuestion = useMemo(() => (question && question.trim()) ? question.trim() : '请基于本命与天时给出综合性的现实建议与启发。', [question])

  const canShowFinal = useMemo(() => {
    // 要求：三舟成功 且 三个ID都就绪 才展示最终解读（避免SSE缺参导致连接失败）
    const oId = originData?.starship?.archive_id
    const cId = celestialData?.starship?.archive_id
    const iId = inquiryData?.starship?.archive_id
    const hasIds = !!oId && !!cId && !!iId
    
    // 统一：问道星舟总会生成（无问题时使用默认问题）
    const inquiryOk = inquiryStatus === 'success'
    
    return hasIds && originStatus === 'success' && celestialStatus === 'success' && inquiryOk
  }, [originStatus, celestialStatus, inquiryStatus, question, originData, celestialData, inquiryData])

  // 调试：任何状态变化时打印关键信息
  useEffect(() => {
    console.group('[Divine] step statuses')
    console.log('originStatus:', originStatus)
    console.log('celestialStatus:', celestialStatus)
    console.log('inquiryStatus:', inquiryStatus)
    console.log('canShowFinal:', canShowFinal)
    
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
    
    // 记录命令行历史已移除，仅保留控制台日志
  
    if (!birthDate) {
      alert('请输入出生日期')
      return
    }

    setIsCalculating(true)
    setInterpretation(null)
    setOriginData(null)
    setCelestialData(null)
    setInquiryData(null)
    setOriginStatus('loading')
    setCelestialStatus('loading')
    setInquiryStatus('loading')

    try {
      // 并发启动三个子计算
      const tasks: Promise<void>[] = []
      let okOrigin = false
      let okCelestial = false
      let okInquiry = false

      // origin
      tasks.push((async () => {
        try {
          const resp = await fetch(api('/api/v1/divine/origin'), {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ birth_date: birthDate, name })
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

      // inquiry：始终执行（无问题时采用默认问题）
      tasks.push((async () => {
        try {
          const resp = await fetch(api('/api/v1/divine/inquiry'), {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question: effectiveQuestion, name: effectiveName })
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

      await Promise.allSettled(tasks)

      console.group('[Divine] steps completed')
      console.log('origin ok/data:', okOrigin, originData)
      console.log('celestial ok/data:', okCelestial, celestialData)
      console.log('inquiry ok/data:', okInquiry, inquiryData)
      console.groupEnd()

      // 三舟阶段完成后：若三者均成功，则挂载流式 Oracle（SSE）
      const readyForComplete = (okOrigin && okCelestial && okInquiry)
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

  const oracleWrapRef = useRef<HTMLDivElement | null>(null)

  return (
    <div className="ao-container ao-screen">
      {/* 标题区域简化：移除冗余文案 */}
      <div className="ao-module">
        <div className="ao-header--inverted">占卜输入 / Input</div>
        <form onSubmit={handleCalculate} className="ao-form" aria-label="占卜输入">
          <div className="ao-field">
          <label htmlFor="userName" className="ao-header--standard">姓名 / Name</label>
            <div className="ao-console-field">
              <input
                className="ao-input"
                type="text"
                id="userName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="可选：更个性化的解读"
              />
              <span className="ao-cursor"></span>
            </div>
          </div>

          <div className="ao-field">
          <label htmlFor="birthDate" className="ao-header--standard">出生日期 / Birth Date</label>
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
          <label htmlFor="question" className="ao-header--standard">问题（可选）/ Question</label>
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

          <div className="ao-hint">仅需出生日期即可占卜；填写姓名与问题可获得更定向的建议。</div>

          <button
            type="submit"
            disabled={isCalculating}
            className="ao-button"
          >
            {isCalculating ? '处理中… Processing' : '开始占卜 Start'}
          </button>
        </form>
      </div>

      {/* 高级与调试面板已移除，专注占卜核心流程 */}

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
                  <div className="ao-oracle-note" style={{ margin: '8px 0' }}>本命星舟：反映你的内在本质与底层倾向。</div>
                  <div className="starship-name">{originData.starship.name_cn}</div>
                  <div className="starship-id ao-ui" style={{ opacity:.7, fontSize:12 }}>[ID] {originData.starship.archive_id}</div>
                  <div className="starship-description ao-clamp-3">{originData.starship.oracle_text}</div>
                  <div className="match-score">[MATCH_SCORE] {originData.match_score ?? 0}</div>
                </div>
                <Link className="ao-button" to={`/starships/${originData.starship.archive_id}`}>查看详情 View</Link>
              </div>
            )}

            {/* 天时星舟 */}
            {celestialStatus === 'loading' && (<div className="ao-card ao-card--starship is-loading"><h4 className="ao-header--standard">[CELESTIAL] STARSHIP_02</h4><div className="ao-console-line">[STATUS] PROCESSING <span className="ao-cursor"></span></div></div>)}
            {celestialStatus === 'error' && (<div className="ao-card ao-card--starship is-error"><h4 className="ao-header--standard">[CELESTIAL] STARSHIP_02</h4><div><span className="ao-chip err">ERR</span> [ERROR] PROCESSING_FAILED</div></div>)}
            {celestialStatus === 'success' && celestialData?.starship && (
              <div className="ao-card ao-card--starship is-success">
                <h4>[CELESTIAL] STARSHIP_02</h4>
                <div className="starship-info">
                  <div className="ao-oracle-note" style={{ margin: '8px 0' }}>天时星舟：映射当下环境与外部机运。</div>
                  <div className="starship-name">{celestialData.starship.name_cn}</div>
                  <div className="starship-id ao-ui" style={{ opacity:.7, fontSize:12 }}>[ID] {celestialData.starship.archive_id}</div>
                  <div className="starship-description ao-clamp-3">{celestialData.starship.oracle_text}</div>
                  <div className="match-score">[MATCH_SCORE] {celestialData.match_score ?? 0}</div>
                </div>
                <Link className="ao-button" to={`/starships/${celestialData.starship.archive_id}`}>查看详情 View</Link>
              </div>
            )}

            {/* 问道星舟 */}
            {inquiryStatus === 'loading' && (<div className="ao-card ao-card--starship is-loading"><h4 className="ao-header--standard">[INQUIRY] STARSHIP_03</h4><div className="ao-console-line">[STATUS] PROCESSING <span className="ao-cursor"></span></div></div>)}
            {inquiryStatus === 'error' && (<div className="ao-card ao-card--starship is-error"><h4 className="ao-header--standard">[INQUIRY] STARSHIP_03</h4><div><span className="ao-chip err">ERR</span> [ERROR] PROCESSING_FAILED / LLM_TIMEOUT</div></div>)}
            {inquiryStatus === 'success' && inquiryData?.starship && (
              <div className="ao-card ao-card--starship is-success">
                <h4>[INQUIRY] STARSHIP_03</h4>
                <div className="starship-info">
                  <div className="ao-oracle-note" style={{ margin: '8px 0' }}>问道星舟：回应你此刻的问题方向。</div>
                  <div className="starship-name">{inquiryData.starship.name_cn}</div>
                  <div className="starship-id ao-ui" style={{ opacity:.7, fontSize:12 }}>[ID] {inquiryData.starship.archive_id}</div>
                  <div className="starship-description ao-clamp-3">{inquiryData.starship.oracle_text}</div>
                  <div className="match-score">[MATCH_SCORE] {inquiryData.match_score ?? 0}</div>
                </div>
                <Link className="ao-button" to={`/starships/${inquiryData.starship.archive_id}`}>查看详情 View</Link>
              </div>
            )}
          </div>

          {/* 神谕解读（流式，直接调用 oracle/stream，传入三艘飞船ID与问题） */}
          {canShowFinal && (
            <div className="ao-module" data-tone="oracle" ref={oracleWrapRef}>
              <div className="ao-header--inverted">神谕解读 / Oracle</div>
              <OracleStream
                key={`${originData?.starship?.archive_id}-${celestialData?.starship?.archive_id}-${inquiryData?.starship?.archive_id}-${question || ''}`}
                url="/api/v1/oracle/stream"
                params={{
                  origin_id: originData?.starship?.archive_id,
                  celestial_id: celestialData?.starship?.archive_id,
                  inquiry_id: inquiryData?.starship?.archive_id,
                  question: effectiveQuestion,
                  name: effectiveName
                }}
                onDone={async (t) => {
                  setInterpretation(t)
                  try {
                    const device_id = getDeviceId()
                    const record = {
                      id: `${Date.now()}`,
                      device_id,
                      time: Date.now(),
                      name: name || null,
                      birth_date: birthDate,
                      question: question || null,
                      origin: originData?.starship || null,
                      celestial: celestialData?.starship || null,
                      inquiry: inquiryData?.starship || null,
                      interpretation: t || null,
                    }
                    const key = `history-v1-${device_id}`
                    const raw = localStorage.getItem(key)
                    const list = raw ? (JSON.parse(raw) as any[]) : []
                    list.push(record)
                    localStorage.setItem(key, JSON.stringify(list))
                  } catch {}
                }}
                onError={(e) => {
                  console.error('oracle stream error', e)
                }}
              />
              <div style={{marginTop:12}}>
                <button
                  className="ao-button ao-button--sm"
                  disabled={!interpretation}
                  onClick={async () => {
                    try {
                      const text = interpretation || oracleWrapRef.current?.innerText || ''
                      await navigator.clipboard.writeText(text)
                      alert('已复制 / Copied')
                    } catch {}
                  }}
                >复制神谕 Copy</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default CalculatePage
