import React from 'react'
import { useNavigate, Link } from 'react-router-dom'

const GlobalBar: React.FC = () => {
  const navigate = useNavigate()
  return (
    <div className="ao-container" style={{marginTop: -8, marginBottom: 8}}>
      <div className="ao-console-bar">
        <button className="ao-button ao-button--sm" onClick={() => navigate('/')}>Home</button>
        <button className="ao-button ao-button--sm" onClick={() => navigate(-1)}>Back</button>
        <Link className="ao-button ao-button--sm" to="/history">History</Link>
      </div>
    </div>
  )
}

export default GlobalBar

