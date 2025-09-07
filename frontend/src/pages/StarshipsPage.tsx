import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'

interface Starship {
  archive_id: string
  name_cn: string
  name_official: string
  launch_date: string
  operator: string
  status: string
  oracle_keywords: string[]
  oracle_text: string
}

const StarshipsPage: React.FC = () => {
  const [starships, setStarships] = useState<Starship[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    fetchStarships()
  }, [])

  const fetchStarships = async () => {
    try {
      const response = await fetch(api('/api/v1/starships'))
      if (response.ok) {
        const data = await response.json()
        const list = (data?.data?.starships) || data.starships || []
        setStarships(list)
      } else {
        throw new Error('获取数据失败')
      }
    } catch (error) {
      console.error('Error:', error)
      setError('获取航天器数据失败')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="ao-container ao-screen"><div className="ao-header--standard">加载中...</div></div>
  if (error) return <div className="ao-container ao-screen"><div className="ao-header--standard">{error}</div></div>

  return (
    <div className="ao-container ao-screen">
      <h2 className="ao-screen__title">Starship Archives / 航天器档案</h2>
      <div className="ao-module">
        <div className="ao-header--inverted">ARCHIVE INDEX</div>
        <div className="ao-console-line">探索航天器档案与神谕使命 <span className="ao-cursor"></span></div>
      </div>

      <div className="ao-grid ao-grid--starships">
        {starships.map((starship) => (
          <div key={starship.archive_id} className="ao-card ao-card--starship">
            <div className="name"><Link to={`/starships/${starship.archive_id}`}>{starship.name_cn}</Link></div>
            <div className="meta">{starship.name_official}</div>

            <div className="ao-data-list">
              <div className="ao-data-row"><span className="label">发射日期</span><span className="value">{starship.launch_date || '未发射'}</span></div>
              <div className="ao-data-row"><span className="label">运营机构</span><span className="value">{starship.operator}</span></div>
              <div className="ao-data-row"><span className="label">状态</span><span className="value">{starship.status}</span></div>
            </div>

            <div className="ao-module" style={{marginTop: '24px'}}>
              <h4 className="ao-header--standard">神谕关键词</h4>
              <div>
                {starship.oracle_keywords.map((keyword, index) => (
                  <span key={index} className="ao-tag">{keyword}</span>
                ))}
              </div>
              <h4 className="ao-header--standard" style={{marginTop: '16px'}}>神谕文本</h4>
              <p style={{margin: 0}}>{starship.oracle_text}</p>
              <div style={{marginTop: 12}}>
                <Link className="ao-button" to={`/starships/${starship.archive_id}`}>查看详情</Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default StarshipsPage
