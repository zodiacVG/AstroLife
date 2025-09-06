import React from 'react'
import { Link } from 'react-router-dom'

const HomePage: React.FC = () => {
  return (
    <div className="home-page">
      <div className="hero-section">
        <h2>欢迎来到星航预言家</h2>
        <p>通过航天器的神谕，探索你的命运轨迹</p>

        <div className="cta-buttons">
          <Link to="/calculate" className="btn btn-primary">
            开始占卜
          </Link>
          <Link to="/starships" className="btn btn-secondary">
            查看航天器
          </Link>
        </div>
      </div>

      <div className="features-section">
        <h3>特色功能</h3>
        <div className="features-grid">
          <div className="feature-card">
            <h4>本命星舟</h4>
            <p>根据你的出生日期，找到与你命运相连的航天器</p>
          </div>
          <div className="feature-card">
            <h4>天时星舟</h4>
            <p>洞察当前时运，把握最佳时机</p>
          </div>
          <div className="feature-card">
            <h4>问道星舟</h4>
            <p>针对特定问题，获得神谕指引</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage