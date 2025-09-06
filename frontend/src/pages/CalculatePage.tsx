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
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}

export default CalculatePage