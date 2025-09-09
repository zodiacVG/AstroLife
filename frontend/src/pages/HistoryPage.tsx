import React, { useEffect, useState } from 'react'

type HistoryItem = {
  id: string
  time: number
  birth_date: string
  question?: string | null
  origin?: any
  celestial?: any
  inquiry?: any
  interpretation?: string | null
}

const HistoryPage: React.FC = () => {
  const [items, setItems] = useState<HistoryItem[]>([])

  useEffect(() => {
    let id = localStorage.getItem('deviceId-v1')
    if (!id) {
      id = Math.random().toString(36).slice(2) + Date.now().toString(36)
      localStorage.setItem('deviceId-v1', id)
    }
    try {
      const raw = localStorage.getItem(`history-v1-${id}`)
      const list = raw ? (JSON.parse(raw) as HistoryItem[]) : []
      setItems((list || []).sort((a, b) => b.time - a.time))
    } catch {
      setItems([])
    }
  }, [])

  return (
    <div className="ao-container ao-screen">
      <h2 className="ao-screen__title">History / 历史记录</h2>
      <div className="ao-module">
        <div className="ao-header--inverted">Recent</div>
        {items.length === 0 && <div className="ao-console-line">No records yet</div>}
        {items.map(item => (
          <div key={item.id} className="ao-module" style={{marginBottom: 12}}>
            <div className="ao-data-list">
              <div className="ao-data-row"><span className="label">Time</span><span className="value">{new Date(item.time).toLocaleString()}</span></div>
              <div className="ao-data-row"><span className="label">Birth</span><span className="value">{item.birth_date}</span></div>
              {item.origin && <div className="ao-data-row"><span className="label">Origin</span><span className="value">[{item.origin.archive_id}] {item.origin.name_cn}</span></div>}
              {item.celestial && <div className="ao-data-row"><span className="label">Celestial</span><span className="value">[{item.celestial.archive_id}] {item.celestial.name_cn}</span></div>}
              {item.inquiry && <div className="ao-data-row"><span className="label">Inquiry</span><span className="value">[{item.inquiry.archive_id}] {item.inquiry.name_cn}</span></div>}
              {item.question && (<div className="ao-data-row"><span className="label">Question</span><span className="value">{item.question}</span></div>)}
            </div>
            {item.interpretation && (
              <div style={{whiteSpace:'pre-wrap', marginTop: 8}}>{item.interpretation}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default HistoryPage
