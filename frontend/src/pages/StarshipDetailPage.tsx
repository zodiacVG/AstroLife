import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../lib/api'

const StarshipDetailPage: React.FC = () => {
  const { id } = useParams()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const fetchOne = async () => {
      try {
        const resp = await fetch(api(`/api/v1/starships/${id}`))
        if (!resp.ok) throw new Error('failed')
        const json = await resp.json()
        setData(json?.data ?? json)
      } catch (e) {
        setError('加载失败')
      } finally {
        setLoading(false)
      }
    }
    fetchOne()
  }, [id])

  if (loading) return <div className="ao-container ao-screen"><div className="ao-header--standard">加载中...</div></div>
  if (error || !data) return <div className="ao-container ao-screen"><div className="ao-header--standard">{error || '无数据'}</div></div>

  const ship = data?.starship ?? data

  return (
    <div className="ao-container ao-screen">
      <h2 className="ao-screen__title">Starship Detail / 航天器详情</h2>

      <div className="ao-module">
        <div className="ao-header--inverted">BASIC / 基础信息</div>
        <div className="ao-data-list">
          <div className="ao-data-row"><span className="label">档案ID</span><span className="value">{ship.archive_id}</span></div>
          <div className="ao-data-row"><span className="label">中文名</span><span className="value">{ship.name_cn}</span></div>
          <div className="ao-data-row"><span className="label">官方名</span><span className="value">{ship.name_official}</span></div>
          <div className="ao-data-row"><span className="label">发射日期</span><span className="value">{ship.launch_date || '未发射'}</span></div>
          <div className="ao-data-row"><span className="label">运营机构</span><span className="value">{ship.operator}</span></div>
          <div className="ao-data-row"><span className="label">状态</span><span className="value">{ship.status}</span></div>
        </div>
      </div>

      <div className="ao-module" data-tone="oracle">
        <div className="ao-header--inverted">ORACLE / 神谕</div>
        <div style={{ marginBottom: 12 }}>
          {ship?.oracle_keywords?.map((k: string, i: number) => (
            <span key={i} className="ao-tag">{k}</span>
          ))}
        </div>
        <div style={{ whiteSpace: 'pre-wrap' }}>{ship.oracle_text}</div>
      </div>

      <div className="ao-module">
        <div className="ao-header--standard">Facts / 事实档案</div>
        <div style={{ whiteSpace: 'pre-wrap' }}>{ship.mission_description}</div>
      </div>

      <Link to="/starships" className="ao-button">返回列表</Link>
    </div>
  )
}

export default StarshipDetailPage
