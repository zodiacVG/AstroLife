import React, { useEffect, useMemo, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Link } from 'react-router-dom'
import OracleStream from '../components/OracleStream'
import SharePoster, { exportPosterAsPng } from '../components/SharePoster'
import { copyHtmlFromElement, copyText } from '../lib/clipboard'
import { api } from '../lib/api'

const CalculatePage: React.FC = () => {
  const STORAGE_KEY = 'calcState-v1'
  const DEVICE_KEY = 'deviceId-v1'

  // 预读本地快照（仅首渲染读取一次，避免 effect 时序问题）
  const savedRef = useRef<any | null>(null)
  if (savedRef.current === null) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      savedRef.current = raw ? JSON.parse(raw) : null
    } catch { savedRef.current = null }
  }

  const saved = savedRef.current || {}

  const [name, setName] = useState<string>(() => saved.name || '')
  // 默认出生日期：2000-01-01
  const [birthDate, setBirthDate] = useState<string>(() => saved.birthDate || '2000-01-01')
  const [question, setQuestion] = useState<string>(() => saved.question || '')
  const [isCalculating, setIsCalculating] = useState<boolean>(false)
  // 控制是否是用户主动发起（避免返回页面时自动开始）
  const [hasUserInitiated, setHasUserInitiated] = useState<boolean>(false)
  // 神谕流式是否完成
  const [oracleDone, setOracleDone] = useState<boolean>(() => !!(saved.interpretation && String(saved.interpretation).trim()))

  // 分步状态
  type StepStatus = 'idle' | 'loading' | 'success' | 'error'
  const [originStatus, setOriginStatus] = useState<StepStatus>(() => saved.originStatus || 'idle')
  const [celestialStatus, setCelestialStatus] = useState<StepStatus>(() => saved.celestialStatus || 'idle')
  const [inquiryStatus, setInquiryStatus] = useState<StepStatus>(() => saved.inquiryStatus || 'idle')
  const [originData, setOriginData] = useState<any>(() => saved.originData || null)
  const [celestialData, setCelestialData] = useState<any>(() => saved.celestialData || null)
  const [inquiryData, setInquiryData] = useState<any>(() => saved.inquiryData || null)
  const [interpretation, setInterpretation] = useState<string | null>(() => saved.interpretation ?? null)
  const [finalTried, setFinalTried] = useState<boolean>(() => !!(saved.interpretation && String(saved.interpretation).trim()))
  const [renderPoster, setRenderPoster] = useState<boolean>(false)
  const [isGeneratingPoster, setIsGeneratingPoster] = useState<boolean>(false)  // 添加海报生成状态
  const posterWrapRef = useRef<HTMLDivElement | null>(null)

  // 三舟结果折叠/展开控制
  // 简洁卡片展示（不再折叠控制）

  // 激活码状态
  const [activated, setActivated] = useState<boolean>(() => {
    try { return localStorage.getItem('activation_ok') === '1' } catch { return false }
  })
  const [activationCode, setActivationCode] = useState('')
  const [activationError, setActivationError] = useState<string | null>(null)
  const [isActivating, setIsActivating] = useState(false)
  // 体验计数（未激活可体验 2 次）
  const TRIAL_KEY = 'trial_count_v1'
  const [trialCount, setTrialCount] = useState<number>(() => {
    try { return parseInt(localStorage.getItem(TRIAL_KEY) || '0') || 0 } catch { return 0 }
  })

  // 移除挂载后再恢复的时序，改为首渲染即取值（见上方 useState 初始化）

  // 设备ID（同一浏览器一致）
  const getDeviceId = () => {
    let id = localStorage.getItem(DEVICE_KEY)
    if (!id) {
      id = Math.random().toString(36).slice(2) + Date.now().toString(36)
      localStorage.setItem(DEVICE_KEY, id)
    }
    return id
  }

  // 持久化关键状态（本地永久存储，除非点击“新占卜”清除）
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
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot)) } catch { }
  }, [name, birthDate, question, originStatus, celestialStatus, inquiryStatus, originData, celestialData, inquiryData, interpretation, finalTried])

  // 若后端未配置 ACTIVATION_SECRET，后端会跳过校验。
  // 这里在未激活且页面加载时做一次探测：
  // 调用 /api/v1/activation/status；若 required=false，则前端自动放行。
  useEffect(() => {
    if (activated) return
    let aborted = false
      ; (async () => {
        try {
          const resp = await fetch(api('/api/v1/activation/status'))
          const json = await resp.json().catch(() => ({}))
          if (!aborted && json?.success && json?.required === false) {
            try { localStorage.setItem('activation_ok', '1') } catch { }
            setActivated(true)
          }
        } catch { /* ignore */ }
      })()
    return () => { aborted = true }
  }, [activated])

  // 若本地标记为已激活，但没有保存激活码，且后端已开启强制校验，则撤销本地激活标记以显示激活页。
  useEffect(() => {
    if (!activated) return
    let aborted = false
    try {
      const code = localStorage.getItem('activation_code') || ''
      if (!code) {
        ; (async () => {
          try {
            const resp = await fetch(api('/api/v1/activation/status'))
            const json = await resp.json().catch(() => ({}))
            // 如果后端需要激活，撤销本地放行
            if (!aborted && json?.success && json?.required === true) {
              try { localStorage.removeItem('activation_ok') } catch { }
              setActivated(false)
            }
          } catch {/* ignore */ }
        })()
      }
    } catch {/* ignore */ }
    return () => { aborted = true }
  }, [activated])

  // 仅用于渲染判断：是否需要显示激活区域
  const requireActivationGate = useMemo(() => !activated && trialCount >= 2, [activated, trialCount])

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

  // 激活码：调用后端验证并记录
  const handleActivate = async () => {
    setActivationError(null)
    if (!activationCode.trim()) { setActivationError('请输入激活码'); return }
    try {
      setIsActivating(true)
      const device_id = getDeviceId()
      const resp = await fetch(api('/api/v1/activate'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: activationCode.trim(), device_id })
      })
      const json = await resp.json().catch(() => ({}))
      if (!resp.ok || !json.success) {
        const msg = json?.detail?.message || json?.message || '激活失败'
        setActivationError(msg)
        return
      }
      try { localStorage.setItem('activation_ok', '1'); localStorage.setItem('activation_code', activationCode.trim()) } catch { }
      setActivated(true)
    } catch (e) {
      setActivationError('网络错误，请稍后再试')
    } finally {
      setIsActivating(false)
    }
  }

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault()

    // 记录命令行历史已移除，仅保留控制台日志

    if (!birthDate) {
      alert('请输入出生日期')
      return
    }

    // 未激活且超过试用次数：提示并展示激活区
    if (!activated && trialCount >= 2) {
      alert('试用次数已用尽，请输入激活码解锁无限次使用。')
      return
    }

    // 用户明确发起一次新的占卜
    setHasUserInitiated(true)
    setOracleDone(false)
    setIsCalculating(true)
    setInterpretation(null)
    setOriginData(null)
    setCelestialData(null)
    setInquiryData(null)
    setOriginStatus('loading')
    setCelestialStatus('loading')
    setInquiryStatus('loading')

    // 占卜过程中：仅展示流程进度

    try {
      // 记录一次试用（仅在未激活时）
      if (!activated) {
        try {
          const next = trialCount + 1
          setTrialCount(next)
          localStorage.setItem(TRIAL_KEY, String(next))
        } catch { }
      }
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
        // 若无法进入流式阶段，立即结束“处理中”状态
        setIsCalculating(false)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('占卜计算失败，请稍后重试')
      // 出错直接结束处理中状态
      setIsCalculating(false)
    }
  }

  const oracleWrapRef = useRef<HTMLDivElement | null>(null)

  // 当准备开始流式输出时，滚动到神谕区域
  useEffect(() => {
    if (hasUserInitiated && canShowFinal && !oracleDone) {
      try { oracleWrapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }) } catch { }
    }
  }, [hasUserInitiated, canShowFinal, oracleDone])

  // 神谕完成后：无需展开控制，直接在下方展示三舟简洁卡片

  // 分离渲染：激活门与主界面，避免嵌套括号导致的解析混乱
  const renderActivationGate = () => (
    <div className="ao-module" role="region" aria-label="激活">
      <div className="ao-header--inverted">激活 / Activate</div>
      <div className="ao-field">
        <label htmlFor="activation" className="ao-header--standard">激活码 / Activation Code</label>
        <div className="ao-console-field">
          <input id="activation" className="ao-input" type="tel" inputMode="numeric" pattern="\\d{4,6}" placeholder="输入6位以内数字激活码"
            value={activationCode} onChange={(e) => setActivationCode(e.target.value.replace(/[^0-9]/g, ''))} />
          <span className="ao-cursor"></span>
        </div>
      </div>
      {activationError && <div className="ao-console-line"><span className="ao-chip err">ERR</span>{activationError}</div>}
      <button className="ao-button" disabled={isActivating} onClick={handleActivate}>{isActivating ? '验证中…' : '激活 Activate'}</button>
      <div className="ao-hint" style={{ marginTop: 8 }}>体验超过 2 次后需激活。关注并私信作者获取激活码：
        <a className="ao-link" href="https://xhslink.com/m/9Vmo5NJsG9L" target="_blank" rel="noreferrer">关注 / Follow</a>
      </div>
    </div>
  )

  const renderMainUI = () => (
    <>
      <div className="ao-module">
        {/* 标题区域简化：移除冗余文案 */}
        <div className="ao-header--inverted">占卜输入 / Input</div>
        <form onSubmit={handleCalculate} className="ao-form" aria-label="占卜输入">
          <div className="ao-field">
            <label htmlFor="userName" className="ao-header--standard">姓名（可选） / Name</label>
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
                placeholder="可选：输入你想询问的问题..."
                rows={2}
              />
              <span className="ao-cursor"></span>
            </div>
          </div>

          <div className="ao-hint">仅需出生日期即可占卜；填写姓名与问题可获得更定向的建议。</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
            <button
              type="submit"
              disabled={isCalculating}
              className="ao-button"
              style={{ width: '100%' }}
            >
              {isCalculating ? '处理中… Processing' : '开始占卜 Start'}
            </button>
            <button
              type="button"
              className="ao-button ao-button--secondary"
              style={{ width: '100%' }}
              onClick={() => {
                // 清空状态，准备新占卜
                setName('')
                setBirthDate('2000-01-01')
                setQuestion('')
                setIsCalculating(false)
                setHasUserInitiated(false)
                setOracleDone(false)
                setInterpretation(null)
                setOriginStatus('idle')
                setCelestialStatus('idle')
                setInquiryStatus('idle')
                setOriginData(null)
                setCelestialData(null)
                setInquiryData(null)
                setFinalTried(false)
                try { localStorage.removeItem(STORAGE_KEY) } catch { }
              }}
            >开启新占卜（历史记录已保存）</button>
          </div>
        </form>
      </div>

      {/* 高级与调试面板已移除，专注占卜核心流程 */}

      {(originStatus !== 'idle' || celestialStatus !== 'idle' || inquiryStatus !== 'idle') && (
        <div className="ao-module" role="region" aria-label="占卜结果">
          <div className="ao-header--inverted">[SYSTEM] OUTPUT_TERMINAL</div>

          {/* 流程进度（占卜过程中不展示三舟详情） */}
          <div className="ao-console-bar">
            <span className={`ao-chip ${originStatus === 'loading' ? 'warn' : originStatus === 'success' ? 'ok' : originStatus === 'error' ? 'err' : ''}`}>
              ORIGIN {originStatus.toUpperCase()}
            </span>
            <span className={`ao-chip ${celestialStatus === 'loading' ? 'warn' : celestialStatus === 'success' ? 'ok' : celestialStatus === 'error' ? 'err' : ''}`}>
              CELESTIAL {celestialStatus.toUpperCase()}
            </span>
            <span className={`ao-chip ${inquiryStatus === 'loading' ? 'warn' : inquiryStatus === 'success' ? 'ok' : inquiryStatus === 'error' ? 'err' : ''}`}>
              INQUIRY {inquiryStatus.toUpperCase()}
            </span>
            {finalTried && !oracleDone && <span className="ao-chip warn">ORACLE STREAMING</span>}
            {oracleDone && <span className="ao-chip ok">ORACLE COMPLETED</span>}
          </div>

          {/* 神谕解读（若为历史恢复则展示静态文本；否则按条件流式） */}
          {interpretation && !hasUserInitiated ? (
            <div className="ao-module" data-tone="oracle" ref={oracleWrapRef}>
              <div className="ao-header--inverted">神谕 / Oracle</div>
              <div className="ao-md"><ReactMarkdown>{interpretation}</ReactMarkdown></div>
              <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  className="ao-button ao-button--sm"
                  onClick={async () => {
                    // 创建一个临时元素，只包含神谕文本内容，不包含按钮
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = oracleWrapRef.current?.querySelector('.ao-md')?.innerHTML || interpretation || '';
                    const ok = await copyHtmlFromElement(tempDiv, effectiveName, effectiveQuestion)
                    alert(ok ? '已复制 / Copied' : '复制失败，请手动选择文本')
                  }}
                >复制神谕 Copy</button>
              </div>
            </div>
          ) : (hasUserInitiated && canShowFinal && (
            <div className="ao-module" data-tone="oracle" ref={oracleWrapRef}>
              <div className="ao-header--inverted">神谕 / Oracle</div>
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
                  setOracleDone(true)
                  // 神谕完成：结束处理中状态
                  setIsCalculating(false)
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
                  } catch { }
                }}
                onError={(e) => {
                  console.error('oracle stream error', e)
                  // 流式出错：结束处理中状态
                  setIsCalculating(false)
                }}
              />
              <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  className="ao-button ao-button--sm"
                  disabled={!interpretation}
                  onClick={async () => {
                    // 创建一个临时元素，只包含神谕文本内容，不包含按钮
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = oracleWrapRef.current?.querySelector('.ao-md')?.innerHTML || interpretation || '';
                    // 添加体验网址到复制内容末尾
                    const experienceUrl = '\n\n—— 体验更多航天器神谕 · Experience more starship oracles\nhttps://astroracle2.zeabur.app/'
                    tempDiv.innerHTML += experienceUrl
                    const ok = await copyHtmlFromElement(tempDiv)
                    alert(ok ? '已复制 / Copied' : '复制失败，请手动选择文本')
                  }}
                >复制神谕 Copy</button>
                {/* 导出海报功能暂时隐藏 */}
                {/*
                <button
                  className="ao-button ao-button--sm ao-button--secondary"
                  disabled={!interpretation}
                  onClick={async () => {
                    console.log('[DEBUG] 开始生成海报流程 (第二个按钮)')
                    setIsGeneratingPoster(true)  // 开始生成海报
                    console.log('[DEBUG] 设置isGeneratingPoster为true')
                    setRenderPoster(true)
                    console.log('[DEBUG] 设置renderPoster为true')
                    await new Promise(r => setTimeout(r, 600))
                    console.log('[DEBUG] 完成第一个600ms延迟')
                    const root = posterWrapRef.current?.querySelector('#share-poster-root') as HTMLElement | null
                    console.log('[DEBUG] 获取海报根元素:', root ? '成功' : '失败')
                    if (root) {
                      console.log('[DEBUG] 海报根元素尺寸:', {
                        width: root.scrollWidth,
                        height: root.scrollHeight,
                        offsetWidth: root.offsetWidth,
                        offsetHeight: root.offsetHeight
                      })
                      // 添加一个延迟，确保海报内容完全渲染
                      console.log('[DEBUG] 开始1000ms延迟，等待内容渲染')
                      await new Promise(r => setTimeout(r, 1000))
                      console.log('[DEBUG] 延迟结束，开始导出海报')
                      await exportPosterAsPng(root)
                      console.log('[DEBUG] 海报导出完成')
                    } else {
                      console.error('[DEBUG] 无法找到海报根元素')
                    }
                    setRenderPoster(false)
                    console.log('[DEBUG] 设置renderPoster为false')
                    setIsGeneratingPoster(false)  // 结束生成海报
                    console.log('[DEBUG] 设置isGeneratingPoster为false，流程结束')
                  }}
                >
                  {isGeneratingPoster ? '生成中...' : '一键生成分享海报'}
                </button>
                */}
              </div>
            </div>
          ))}

          {/* 三体共振显示：神谕完成后展示（简洁版） */}
          {oracleDone && (
            <div className="ao-grid ao-grid--starships" style={{ marginTop: 12 }}>
              {originStatus === 'success' && originData?.starship && (
                <div className="ao-card ao-card--starship" style={{ padding: 12 }}>
                  <div className="name">[ORIGIN] {originData.starship.name_cn}</div>
                  <div className="meta">ID {originData.starship.archive_id} · 匹配 {typeof originData.match_score === 'number' ? (originData.match_score * 100).toFixed(0) + '%' : '—'}</div>
                  <div className="ao-hint" style={{ margin: '6px 0 8px' }}>
                    本命之舟：象征你的内在禀赋与稳定气质，是可长期依托的能量与路径。
                  </div>
                  {Array.isArray(originData?.starship?.oracle_keywords) && originData.starship.oracle_keywords.length > 0 && (
                    <div style={{ marginBottom: 8 }}>
                      {originData.starship.oracle_keywords.slice(0, 3).map((k: string, i: number) => (
                        <span key={i} className="ao-tag" style={{ marginRight: 6 }}>{k}</span>
                      ))}
                    </div>
                  )}
                  <Link className="ao-button ao-button--sm" to={`/starships/${originData.starship.archive_id}`}>查看详情</Link>
                </div>
              )}
              {celestialStatus === 'success' && celestialData?.starship && (
                <div className="ao-card ao-card--starship" style={{ padding: 12 }}>
                  <div className="name">[CELESTIAL] {celestialData.starship.name_cn}</div>
                  <div className="meta">ID {celestialData.starship.archive_id} · 匹配 {typeof celestialData.match_score === 'number' ? (celestialData.match_score * 100).toFixed(0) + '%' : '—'}</div>
                  <div className="ao-hint" style={{ margin: '6px 0 8px' }}>
                    天时之舟：刻画当下时势与节律，提示顺势而为的窗口与约束。
                  </div>
                  {Array.isArray(celestialData?.starship?.oracle_keywords) && celestialData.starship.oracle_keywords.length > 0 && (
                    <div style={{ marginBottom: 8 }}>
                      {celestialData.starship.oracle_keywords.slice(0, 3).map((k: string, i: number) => (
                        <span key={i} className="ao-tag" style={{ marginRight: 6 }}>{k}</span>
                      ))}
                    </div>
                  )}
                  <Link className="ao-button ao-button--sm" to={`/starships/${celestialData.starship.archive_id}`}>查看详情</Link>
                </div>
              )}
              {inquiryStatus === 'success' && inquiryData?.starship && (
                <div className="ao-card ao-card--starship" style={{ padding: 12 }}>
                  <div className="name">[INQUIRY] {inquiryData.starship.name_cn}</div>
                  <div className="meta">ID {inquiryData.starship.archive_id} · 匹配 {typeof inquiryData.match_score === 'number' ? (inquiryData.match_score * 100).toFixed(0) + '%' : '—'}</div>
                  <div className="ao-hint" style={{ margin: '6px 0 8px' }}>
                    问道之舟：与你的提问共振，聚焦当前最值得推进的行动线索。
                  </div>
                  {Array.isArray(inquiryData?.starship?.oracle_keywords) && inquiryData.starship.oracle_keywords.length > 0 && (
                    <div style={{ marginBottom: 8 }}>
                      {inquiryData.starship.oracle_keywords.slice(0, 3).map((k: string, i: number) => (
                        <span key={i} className="ao-tag" style={{ marginRight: 6 }}>{k}</span>
                      ))}
                    </div>
                  )}
                  <Link className="ao-button ao-button--sm" to={`/starships/${inquiryData.starship.archive_id}`}>查看详情</Link>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  )

  return (
    <div className="ao-container ao-screen">
      {requireActivationGate ? renderActivationGate() : renderMainUI()}
      {/* Hidden poster renderer */}
      {renderPoster && (
        <div ref={posterWrapRef} style={{ position: 'fixed', left: -99999, top: 0, pointerEvents: 'none', zIndex: -1 }}>
          <SharePoster
            name={effectiveName}
            question={effectiveQuestion}
            interpretationMarkdown={interpretation || ''}
            origin={originData?.starship || null}
            celestial={celestialData?.starship || null}
            inquiry={inquiryData?.starship || null}
            qrLink={'https://astroracle2.zeabur.app/'}
          />
        </div>
      )}
    </div>
  )
}

export default CalculatePage
