import React, { useState } from 'react'

const CalculatePage: React.FC = () => {
  const [birthDate, setBirthDate] = useState('')
  const [question, setQuestion] = useState('')
  const [isCalculating, setIsCalculating] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!birthDate) {
      alert('请输入出生日期')
      return
    }

    setIsCalculating(true)

    try {
      // 调用后端API
      const response = await fetch('http://localhost:8000/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          birth_date: birthDate,
          question: question || null
        })
      })

      if (response.ok) {
        const data = await response.json()
        setResult(data)
      } else {
        throw new Error('计算失败')
      }
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

      {result && (
        <div className="result-section">
          <h3>占卜结果</h3>
          
          {/* 三体共振显示 */}
          <div className="starships-grid">
            {/* 本命星舟 */}
            {result.destiny_starship && (
              <div className="starship-card destiny">
                <h4>🚀 本命星舟</h4>
                <div className="starship-info">
                  <div className="starship-name">{result.destiny_starship.name_cn}</div>
                  <div className="starship-id">ID: {result.destiny_starship.archive_id}</div>
                  <div className="starship-description">{result.destiny_starship.mission_description}</div>
                  <div className="match-score">匹配得分: {result.match_scores?.destiny || 0}</div>
                </div>
              </div>
            )}

            {/* 天时星舟 */}
            {result.timely_starship && (
              <div className="starship-card timely">
                <h4>⏰ 天时星舟</h4>
                <div className="starship-info">
                  <div className="starship-name">{result.timely_starship.name_cn}</div>
                  <div className="starship-id">ID: {result.timely_starship.archive_id}</div>
                  <div className="starship-description">{result.timely_starship.mission_description}</div>
                  <div className="match-score">匹配得分: {result.match_scores?.timely || 0}</div>
                </div>
              </div>
            )}

            {/* 问道星舟 */}
            {result.question_starship && (
              <div className="starship-card question">
                <h4>❓ 问道星舟</h4>
                <div className="starship-info">
                  <div className="starship-name">{result.question_starship.name_cn}</div>
                  <div className="starship-id">ID: {result.question_starship.archive_id}</div>
                  <div className="starship-description">{result.question_starship.mission_description}</div>
                  <div className="match-score">匹配得分: {result.match_scores?.question || 0}</div>
                </div>
              </div>
            )}
          </div>

          {/* 神谕解读 */}
          {result.interpretation && result.interpretation !== '暂时无法为您提供神谕解读，请稍后再试。' && (
            <div className="oracle-section">
              <h4>✨ 神谕解读</h4>
              <div className="oracle-text">
                {result.interpretation}
              </div>
            </div>
          )}

          {result.interpretation === '暂时无法为您提供神谕解读，请稍后再试。' && (
            <div className="oracle-waiting">
              <p>⏳ 神谕解读生成中，请稍后刷新页面查看...</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default CalculatePage