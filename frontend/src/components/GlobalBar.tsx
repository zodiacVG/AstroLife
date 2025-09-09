import React from 'react'
import { useNavigate, Link } from 'react-router-dom'

const GlobalBar: React.FC = () => {
  const navigate = useNavigate()
  return (
    <div className="ao-container ao-globalbar">
      <div className="ao-console-bar">
        <button className="ao-button ao-button--sm" onClick={() => navigate('/')}>首页 Home</button>
        <button className="ao-button ao-button--sm" onClick={() => navigate(-1)}>返回 Back</button>
        <Link className="ao-button ao-button--sm" to="/history">历史 History</Link>
      </div>
    </div>
  )
}

export default GlobalBar
