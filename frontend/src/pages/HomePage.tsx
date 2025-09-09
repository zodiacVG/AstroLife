import React from 'react'
import { Link } from 'react-router-dom'
import SolarSystem from '../components/SolarSystem'

const HomePage: React.FC = () => {
  return (
    <div className="ao-container ao-screen">
      <div className="ao-module ao-module--welcome">
        <div className="ao-module__content">
          <div className="ao-header--inverted">WELCOME / 欢迎</div>
          <div className="ao-hero-intro" style={{ position: 'relative', height: 360, marginTop: 12 }}>
            <SolarSystem />
            <div className="ao-hero-overlay" style={{ position: 'absolute', inset: 0, display: 'grid', gap: 8, alignContent: 'start', padding: 12, pointerEvents: 'none' }}>
              <div className="ao-console-line">用三艘真实航天器的故事，映照你的处境与方向。</div>
            </div>
          </div>
        </div>
        <div className="ao-module__cta" style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start' }}>
          <Link to="/calculate" className="ao-button" style={{ width: '220px', textAlign: 'center' }}>开始寻星之旅 Start</Link>
          <Link to="/starships" className="ao-button" style={{ width: '220px', textAlign: 'center' }}>查看所有航天器 View All</Link>
        </div>
      </div>
    </div>
  )
}

export default HomePage
