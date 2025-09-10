import React, { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'

const GlobalBar: React.FC = () => {
  const navigate = useNavigate()
  const [muted, setMuted] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem('bgmMuted')
      return raw ? JSON.parse(raw) : true
    } catch { return true }
  })

  useEffect(() => {
    const onState = (e: Event) => {
      try {
        const det: any = (e as CustomEvent).detail
        if (typeof det?.muted === 'boolean') setMuted(det.muted)
      } catch {}
    }
    window.addEventListener('astro-bgm-state', onState as any)
    return () => window.removeEventListener('astro-bgm-state', onState as any)
  }, [])

  const toggleBgm = () => {
    try { window.dispatchEvent(new CustomEvent('astro-bgm-toggle')) } catch {}
  }
  return (
    <div className="ao-container ao-globalbar">
      <div className="ao-console-bar">
        <button className="ao-button ao-button--sm" onClick={() => navigate('/')}>首页 Home</button>
        <button className="ao-button ao-button--sm" onClick={() => navigate(-1)}>返回 Back</button>
        <Link className="ao-button ao-button--sm" to="/history">历史 History</Link>
        <button className="ao-button ao-button--sm" onClick={toggleBgm}>
          {muted ? '音乐 关' : '音乐 开'}
        </button>
      </div>
    </div>
  )
}

export default GlobalBar
