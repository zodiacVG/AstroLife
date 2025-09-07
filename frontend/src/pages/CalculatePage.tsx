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
    // 只有所有参与的步骤都成功时，才允许展示最终解读
    if (question) {
      return originStatus === 'success' && celestialStatus === 'success' && inquiryStatus === 'success'
    }
    return originStatus === 'success' && celestialStatus === 'success'
  }, [originStatus, celestialStatus, inquiryStatus, question])

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault()
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

      console.group('Divine steps result')
      console.log('origin:', originStatus, originData)
      console.log('celestial:', celestialStatus, celestialData)
      console.log('inquiry:', inquiryStatus, inquiryData)
      console.groupEnd()

      // 所有阶段完成后：
      // - 若填写了问题：本命/天时/问道全部成功才触发最终解读
      // - 若未填写问题：仅需本命/天时成功
      const readyForComplete = question ? (okOrigin && okCelestial && okInquiry) : (okOrigin && okCelestial)
      if (readyForComplete) {
        // 真流式：由 OracleStream 渲染；先清空（避免重播）
        setInterpretation(null)
      }
      setFinalTried(true)
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
        <div className="ao-header--inverted">INPUT</div>
        <div className="ao-console-line">Awaiting command <span className="ao-cursor"></span></div>
        <form onSubmit={handleCalculate} className="ao-form" aria-label="占卜输入">
          <div className="ao-field">
          <label htmlFor="birthDate" className="ao-header--standard">出生日期 Birth Date *</label>
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
          <label htmlFor="question" className="ao-header--standard">问题 Question（可选 Optional）</label>
            <div className="ao-console-field">
              <textarea
                className="ao-textarea"
                id="question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="输入你想询问的问题，获得神谕指引..."
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
            {isCalculating ? '计算中...' : '开始占卜'}
          </button>
        </form>
      </div>

      {(originStatus !== 'idle' || celestialStatus !== 'idle' || inquiryStatus !== 'idle') && (
        <div className="ao-module" role="region" aria-label="占卜结果">
          <div className="ao-header--inverted">RESULT</div>
          
          {/* 三体共振显示 */}
          <div className="ao-grid ao-grid--starships">
            {/* 本命星舟 */}
            {originStatus === 'loading' && (<div className="ao-card ao-card--starship is-loading"><h4 className="ao-header--standard">🚀 本命星舟</h4><div className="ao-console-line">计算中 <span className="ao-cursor"></span></div></div>)}
            {originStatus === 'error' && (<div className="ao-card ao-card--starship is-error"><h4 className="ao-header--standard">🚀 本命星舟</h4><div><span className="ao-chip err">ERR</span> 计算失败</div></div>)}
            {originStatus === 'success' && originData?.starship && (
              <div className="ao-card ao-card--starship is-success">
                <h4>🚀 本命星舟</h4>
                <div className="starship-info">
                  <div className="starship-name">{originData.starship.name_cn}</div>
                  <div className="starship-id">ID: {originData.starship.archive_id}</div>
                  <div className="starship-description">{originData.starship.oracle_text}</div>
                  <div className="match-score">匹配得分: {originData.match_score ?? 0}</div>
                </div>
                <Link className="ao-button" to={`/starships/${originData.starship.archive_id}`}>查看详情</Link>
              </div>
            )}

            {/* 天时星舟 */}
            {celestialStatus === 'loading' && (<div className="ao-card ao-card--starship is-loading"><h4 className="ao-header--standard">⏰ 天时星舟</h4><div className="ao-console-line">计算中 <span className="ao-cursor"></span></div></div>)}
            {celestialStatus === 'error' && (<div className="ao-card ao-card--starship is-error"><h4 className="ao-header--standard">⏰ 天时星舟</h4><div><span className="ao-chip err">ERR</span> 计算失败</div></div>)}
            {celestialStatus === 'success' && celestialData?.starship && (
              <div className="ao-card ao-card--starship is-success">
                <h4>⏰ 天时星舟</h4>
                <div className="starship-info">
                  <div className="starship-name">{celestialData.starship.name_cn}</div>
                  <div className="starship-id">ID: {celestialData.starship.archive_id}</div>
                  <div className="starship-description">{celestialData.starship.oracle_text}</div>
                  <div className="match-score">匹配得分: {celestialData.match_score ?? 0}</div>
                </div>
                <Link className="ao-button" to={`/starships/${celestialData.starship.archive_id}`}>查看详情</Link>
              </div>
            )}

            {/* 问道星舟 */}
            {inquiryStatus === 'loading' && (<div className="ao-card ao-card--starship is-loading"><h4 className="ao-header--standard">❓ 问道星舟</h4><div className="ao-console-line">计算中 <span className="ao-cursor"></span></div></div>)}
            {inquiryStatus === 'error' && (<div className="ao-card ao-card--starship is-error"><h4 className="ao-header--standard">❓ 问道星舟</h4><div><span className="ao-chip err">ERR</span> 计算失败（LLM不可用或超时）</div></div>)}
            {inquiryStatus === 'success' && inquiryData?.starship && (
              <div className="ao-card ao-card--starship is-success">
                <h4>❓ 问道星舟</h4>
                <div className="starship-info">
                  <div className="starship-name">{inquiryData.starship.name_cn}</div>
                  <div className="starship-id">ID: {inquiryData.starship.archive_id}</div>
                  <div className="starship-description">{inquiryData.starship.oracle_text}</div>
                  <div className="match-score">匹配得分: {inquiryData.match_score ?? 0}</div>
                </div>
                <Link className="ao-button" to={`/starships/${inquiryData.starship.archive_id}`}>查看详情</Link>
              </div>
            )}
          </div>

          {/* 神谕解读 */}
          {canShowFinal && (
            <div className="ao-module" data-tone="oracle">
              <div className="ao-header--inverted">Oracle Counsel / 神谕解读</div>
              <OracleStream
                url="/api/v1/divine/stream"
                payload={{ birth_date: birthDate, question: question || null }}
                onDone={async (t) => {
                  setInterpretation(t)
                  // 保存历史记录到后端 JSON（按设备ID区分）
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
              />
            </div>
          )}

          {canShowFinal && finalTried && !interpretation && (
            <div className="ao-module" data-tone="oracle"><div className="ao-console-line">⏳ 神谕解读生成中 <span className="ao-cursor"></span></div></div>
          )}
        </div>
      )}
    </div>
  )
}

export default CalculatePage
