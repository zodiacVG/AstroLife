import React, { useState, useEffect } from 'react'

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
      const response = await fetch('http://localhost:8000/starships')
      if (response.ok) {
        const data = await response.json()
        setStarships(data.starships || [])
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

  if (loading) return <div className="loading">加载中...</div>
  if (error) return <div className="error">{error}</div>

  return (
    <div className="starships-page">
      <h2>航天器档案</h2>
      <p className="page-description">探索17艘历史航天器的神谕与使命</p>

      <div className="starships-grid">
        {starships.map((starship) => (
          <div key={starship.archive_id} className="starship-card">
            <h3>{starship.name_cn}</h3>
            <p className="official-name">{starship.name_official}</p>

            <div className="starship-info">
              <p><strong>发射日期:</strong> {starship.launch_date || '未发射'}</p>
              <p><strong>运营机构:</strong> {starship.operator}</p>
              <p><strong>状态:</strong> {starship.status}</p>
            </div>

            <div className="oracle-section">
              <h4>神谕关键词</h4>
              <div className="keywords">
                {starship.oracle_keywords.map((keyword, index) => (
                  <span key={index} className="keyword-tag">
                    {keyword}
                  </span>
                ))}
              </div>

              <h4>神谕文本</h4>
              <p className="oracle-text">{starship.oracle_text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default StarshipsPage