"use client"

// import { useSession } from "next-auth/react"
import { useState } from "react"

// interface TrackData {
//   title: string
//   artist: string
//   energy: number
// }

interface AudioFeature {
  name: string
  value: number
}

export default function DashboardPage() {
  // const { data: session } = useSession()
  // const [recentTracks] = useState<TrackData[]>([
  //   { title: 'Blinding Lights', artist: 'The Weeknd', energy: 80 },
  //   { title: 'Levitating', artist: 'Dua Lipa', energy: 82 },
  //   { title: 'Good 4 U', artist: 'Olivia Rodrigo', energy: 66 },
  //   { title: 'Stay', artist: 'Justin Bieber', energy: 76 }
  // ])

  const [audioFeatures] = useState<AudioFeature[]>([
    { name: 'エネルギー', value: 85 },
    { name: 'ダンス適性', value: 72 },
    { name: 'アコースティック度', value: 23 },
    { name: 'ポジティブ度', value: 68 }
  ])

  return (
    <>
      <h1 className="page-title">おかえりなさい</h1>
      <p className="page-subtitle">今日のあなたの音楽の状況をお知らせします。</p>
      
      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">2,847</div>
          <div className="stat-label">分析した楽曲</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">127</div>
          <div className="stat-label">作成したプレイリスト</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">94%</div>
          <div className="stat-label">マッチ精度</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">8.2</div>
          <div className="stat-label">平均エネルギースコア</div>
        </div>
      </div>

      {/* Music Visualization */}
      <div className="music-visual">
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem' }}>現在再生中</h2>
        <p style={{ color: 'var(--dark-gray)', marginBottom: '2rem' }}>リアルタイムで音楽を可視化</p>
        <div className="wave-container">
          <div className="wave-bar"></div>
          <div className="wave-bar"></div>
          <div className="wave-bar"></div>
          <div className="wave-bar"></div>
          <div className="wave-bar"></div>
          <div className="wave-bar"></div>
          <div className="wave-bar"></div>
          <div className="wave-bar"></div>
          <div className="wave-bar"></div>
          <div className="wave-bar"></div>
        </div>
      </div>

      {/* Audio Features */}
      <div className="card">
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '2rem' }}>音楽的特徴</h2>
        {audioFeatures.map((feature, index) => (
          <div key={index} className="progress-item">
            <div className="progress-header">
              <span className="progress-label">{feature.name}</span>
              <span className="progress-value">{feature.value}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${feature.value}%` }}></div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}