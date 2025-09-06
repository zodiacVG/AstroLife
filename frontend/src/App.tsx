import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'

// 页面组件
const HomePage = React.lazy(() => import('./pages/HomePage'))
const CalculatePage = React.lazy(() => import('./pages/CalculatePage'))
const StarshipsPage = React.lazy(() => import('./pages/StarshipsPage'))

function App() {
  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <h1>星航预言家</h1>
          <p>基于航天器神谕的智能占卜系统</p>
        </header>

        <main>
          <React.Suspense fallback={<div>加载中...</div>}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/calculate" element={<CalculatePage />} />
              <Route path="/starships" element={<StarshipsPage />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </React.Suspense>
        </main>
      </div>
    </Router>
  )
}

export default App