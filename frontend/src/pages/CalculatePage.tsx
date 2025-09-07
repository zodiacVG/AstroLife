import React, { useMemo, useState } from 'react'
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
        try {
          const resp = await fetch(api('/api/v1/divine/complete'), {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ birth_date: birthDate, question: question || null })
          })
          if (resp.ok) {
            const json = await resp.json()
            console.log('complete response:', json)
            const data = json?.data ?? json
            setInterpretation(data?.interpretation ?? null)
            setResult(data)
          }
        } catch (err) {
          console.error('complete call failed:', err)
        }
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
    <div className="calculate-page">
      <h2>星航占卜</h2>

      <form onSubmit={handleCalculate} className="calculate-form">
        <div className="form-group">
          <label htmlFor="birthDate">出生日期 *</label>
          <input
            type="date"
            id="birthDate"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="question">想问的问题（可选）</label>
          <textarea
            id="question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="输入你想询问的问题，获得神谕指引..."
            rows={4}
          />
        </div>

        <button
          type="submit"
          disabled={isCalculating}
          className="calculate-btn"
        >
          {isCalculating ? '计算中...' : '开始占卜'}
        </button>
      </form>

      {(originStatus !== 'idle' || celestialStatus !== 'idle' || inquiryStatus !== 'idle') && (
        <div className="result-section">
          <h3>占卜结果</h3>
          
          {/* 三体共振显示 */}
          <div className="starships-grid">
            {/* 本命星舟 */}
            {originStatus === 'loading' && (<div className="starship-card destiny"><h4>🚀 本命星舟</h4><div>计算中...</div></div>)}
            {originStatus === 'error' && (<div className="starship-card destiny"><h4>🚀 本命星舟</h4><div>计算失败</div></div>)}
            {originStatus === 'success' && originData?.starship && (
              <div className="starship-card destiny">
                <h4>🚀 本命星舟</h4>
                <div className="starship-info">
                  <div className="starship-name">{originData.starship.name_cn}</div>
                  <div className="starship-id">ID: {originData.starship.archive_id}</div>
                  <div className="starship-description">{originData.starship.mission_description}</div>
                  <div className="match-score">匹配得分: {originData.match_score ?? 0}</div>
                </div>
              </div>
            )}

            {/* 天时星舟 */}
            {celestialStatus === 'loading' && (<div className="starship-card timely"><h4>⏰ 天时星舟</h4><div>计算中...</div></div>)}
            {celestialStatus === 'error' && (<div className="starship-card timely"><h4>⏰ 天时星舟</h4><div>计算失败</div></div>)}
            {celestialStatus === 'success' && celestialData?.starship && (
              <div className="starship-card timely">
                <h4>⏰ 天时星舟</h4>
                <div className="starship-info">
                  <div className="starship-name">{celestialData.starship.name_cn}</div>
                  <div className="starship-id">ID: {celestialData.starship.archive_id}</div>
                  <div className="starship-description">{celestialData.starship.mission_description}</div>
                  <div className="match-score">匹配得分: {celestialData.match_score ?? 0}</div>
                </div>
              </div>
            )}

            {/* 问道星舟 */}
            {inquiryStatus === 'loading' && (<div className="starship-card question"><h4>❓ 问道星舟</h4><div>计算中...</div></div>)}
            {inquiryStatus === 'error' && (<div className="starship-card question"><h4>❓ 问道星舟</h4><div>计算失败（LLM不可用或超时）</div></div>)}
            {inquiryStatus === 'success' && inquiryData?.starship && (
              <div className="starship-card question">
                <h4>❓ 问道星舟</h4>
                <div className="starship-info">
                  <div className="starship-name">{inquiryData.starship.name_cn}</div>
                  <div className="starship-id">ID: {inquiryData.starship.archive_id}</div>
                  <div className="starship-description">{inquiryData.starship.mission_description}</div>
                  <div className="match-score">匹配得分: {inquiryData.match_score ?? 0}</div>
                </div>
              </div>
            )}
          </div>

          {/* 神谕解读 */}
          {canShowFinal && interpretation && interpretation !== '暂时无法为您提供神谕解读，请稍后再试。' && (
            <div className="oracle-section">
              <h4>✨ 神谕解读</h4>
              <div className="oracle-text">
                {interpretation}
              </div>
            </div>
          )}

          {canShowFinal && finalTried && !interpretation && (
            <div className="oracle-waiting">
              <p>⏳ 神谕解读生成中或条件不足，请稍后重试...</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default CalculatePage
