import React from 'react'
import { Link } from 'react-router-dom'

const HomePage: React.FC = () => {
  return (
    <div className="ao-container ao-screen">
      <h2 className="ao-screen__title">Console / 控制台</h2>

      <div className="ao-module">
        <div className="ao-header--inverted">WELCOME / 欢迎</div>
        <div className="ao-console-line">以航天器为象，取其历程与精神，折射个人当下与远方的走向。非灵异，乃叙事与概率的交汇。 <span className="ao-cursor" /></div>
        <div style={{marginTop: 12, display: 'flex', gap: 12, flexWrap: 'wrap'}}>
          <Link to="/calculate" className="ao-button">开始占卜</Link>
          <Link to="/starships" className="ao-button">查看航天器</Link>
        </div>
      </div>

      <div className="ao-module">
        <div className="ao-header--standard">Principle / 原理</div>
        <div className="ao-console-line">三舟共振：本命（Origin）、天时（Celestial）、问道（Inquiry）</div>
        <div className="ao-console-line">以时间与叙事的“匹配”生象，由模型生成可读的劝告</div>
      </div>
    </div>
  )
}

export default HomePage
