import React from 'react'
import { Link } from 'react-router-dom'

const HomePage: React.FC = () => {
  return (
    <div className="ao-container ao-screen">
      <div className="ao-module ao-module--welcome">
        <div className="ao-module__content">
          <div className="ao-header--inverted">WELCOME / 欢迎</div>
          <div className="ao-console-line">以航天器为象，取其历程与精神，折射个人当下与远方的走向。非灵异，乃叙事与概率的交汇。</div>
          <div className="ao-console-line">每艘星舟都象征着生命中的不同维度：本命星舟代表您的内在本质，天时星舟反映外部环境的影响，而问道星舟则指引您探索未知的可能性。</div>
          <div className="ao-console-line">三舟共振：本命（Origin）、天时（Celestial）、问道（Inquiry）。以时间与叙事的"匹配"生象，由模型生成可读的劝告。</div>

          <div className="ao-console-line">Using spacecraft as symbols, we reflect on personal present and future paths through their journeys and spirit. Not supernatural, but an intersection of narrative and probability.</div>
          <div className="ao-console-line">Each starship symbolizes a different dimension of life: the Origin Starship represents your inner essence, the Celestial Starship reflects the influence of external circumstances, while the Inquiry Starship guides you in exploring unknown possibilities.</div>
          <div className="ao-console-line">Tri-vessel resonance: Origin, Celestial, and Inquiry. Generating readable guidance through the "matching" of time and narrative, created by models.</div>


        </div>
        <div className="ao-module__cta" style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start' }}>
          <Link to="/calculate" className="ao-button" style={{ width: '200px', textAlign: 'center' }}>开始寻星之旅</Link>
          <Link to="/starships" className="ao-button ao-button--sm" style={{ opacity: 0.7 }}>查看所有航天器</Link>
        </div>
      </div>
    </div>
  )
}

export default HomePage
