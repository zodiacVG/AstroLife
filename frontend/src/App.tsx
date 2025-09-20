import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import GlobalBar from './components/GlobalBar'
import BgmController from './components/BgmController'

// 页面组件
const HomePage = React.lazy(() => import('./pages/HomePage'))
const CalculatePage = React.lazy(() => import('./pages/CalculatePage'))
const StarshipsPage = React.lazy(() => import('./pages/StarshipsPage'))
const StarshipDetailPage = React.lazy(() => import('./pages/StarshipDetailPage'))
const HistoryPage = React.lazy(() => import('./pages/HistoryPage'))

function App() {
  return (
    <Router>
      <div className="App">
        <BgmController />
        <header className="App-header">
          <div className="ao-container ao-screen">
            <h1 className="ao-screen__title" style={{ fontFamily: 'var(--ao-font-terminal)', textTransform: 'uppercase', letterSpacing: '2px' }}>Astro Oracle</h1>
            <div className="ao-hero">
              <div className="ao-hero__subtitle">寻星问道  太空占卜</div>
              <div className="ao-hero__meta">
                灵感来源：Quadrature (Juliane Götz & Sebastian Neitsch)’s <a className="ao-link" href="https://quadrature.co/work/scope/" target="_blank" rel="noreferrer">SCOPE</a> (2024)
              </div>
              <div className="ao-hero__meta">关注作者，无限次使用寻星问道<a className="ao-link" href="https://xhslink.com/m/9Vmo5NJsG9L" target="_blank" rel="noreferrer">     👉 关注</a></div>
            </div>
          </div>
        </header>

        <GlobalBar />

        <main>
          <React.Suspense fallback={<div>加载中...</div>}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/calculate" element={<CalculatePage />} />
              <Route path="/starships" element={<StarshipsPage />} />
              <Route path="/starships/:id" element={<StarshipDetailPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </React.Suspense>
        </main>
      </div>
    </Router>
  )
}

export default App
