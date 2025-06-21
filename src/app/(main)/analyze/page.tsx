"use client"

import { useState } from "react"

export default function AnalyzePage() {
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <>
      <h1 className="page-title">楽曲分析</h1>
      <div className="search-container">
        <input 
          type="text" 
          className="search-input" 
          placeholder="楽曲やアーティストを検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.35-4.35"></path>
        </svg>
      </div>
      
      <div className="card">
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '2rem' }}>音楽的特徴</h2>
        <div className="progress-item">
          <div className="progress-header">
            <span className="progress-label">エネルギー</span>
            <span className="progress-value">85%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: '85%' }}></div>
          </div>
        </div>
        <div className="progress-item">
          <div className="progress-header">
            <span className="progress-label">ダンス適性</span>
            <span className="progress-value">72%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: '72%' }}></div>
          </div>
        </div>
        <div className="progress-item">
          <div className="progress-header">
            <span className="progress-label">アコースティック度</span>
            <span className="progress-value">23%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: '23%' }}></div>
          </div>
        </div>
        <div className="progress-item">
          <div className="progress-header">
            <span className="progress-label">ポジティブ度</span>
            <span className="progress-value">68%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: '68%' }}></div>
          </div>
        </div>
      </div>
    </>
  )
}