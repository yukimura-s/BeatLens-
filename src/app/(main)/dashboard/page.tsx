"use client"

import { useSession } from "next-auth/react"
import { useState, useEffect } from "react"

interface SpotifyUser {
  display_name: string
  email: string
  followers: { total: number }
  images: { url: string }[]
}

interface TrackData {
  name: string
  artists: { name: string }[]
  album: { images: { url: string }[] }
}

interface AudioFeature {
  name: string
  value: number
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [user, setUser] = useState<SpotifyUser | null>(null)
  const [currentTrack, setCurrentTrack] = useState<TrackData | null>(null)
  const [loading, setLoading] = useState(true)

  const [audioFeatures] = useState<AudioFeature[]>([
    { name: 'エネルギー', value: 85 },
    { name: 'ダンス適性', value: 72 },
    { name: 'アコースティック度', value: 23 },
    { name: 'ポジティブ度', value: 68 }
  ])

  useEffect(() => {
    if (session?.accessToken) {
      fetchUserProfile()
      fetchCurrentlyPlaying()
    }
  }, [session])

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('https://api.spotify.com/v1/me', {
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      })
      const userData = await response.json()
      setUser(userData)
    } catch (error) {
      console.error('Error fetching user profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCurrentlyPlaying = async () => {
    try {
      const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setCurrentTrack(data?.item)
      }
    } catch (error) {
      console.error('Error fetching currently playing:', error)
    }
  }

  if (loading) {
    return (
      <>
        <h1 className="page-title">読み込み中</h1>
        <div className="loading-dots">
          <div className="dot"></div>
          <div className="dot"></div>
          <div className="dot"></div>
        </div>
      </>
    )
  }

  return (
    <>
      <h1 className="page-title">おかえりなさい{user?.display_name ? `, ${user.display_name}` : ''}</h1>
      <p className="page-subtitle">今日のあなたの音楽の状況をお知らせします。</p>
      
      {/* User Profile */}
      {user && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {user.images?.[0] && (
              <img 
                src={user.images[0].url} 
                alt="Profile" 
                style={{ width: '80px', height: '80px', borderRadius: '50%' }}
              />
            )}
            <div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                {user.display_name}
              </h3>
              <p style={{ color: 'var(--dark-gray)' }}>
                {user.followers?.total} フォロワー
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{user?.followers?.total || 0}</div>
          <div className="stat-label">フォロワー</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">127</div>
          <div className="stat-label">プレイリスト</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">94%</div>
          <div className="stat-label">マッチ精度</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">8.2</div>
          <div className="stat-label">平均エネルギー</div>
        </div>
      </div>

      {/* Currently Playing */}
      <div className="music-visual">
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem' }}>
          {currentTrack ? '現在再生中' : '再生履歴'}
        </h2>
        {currentTrack ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
            {currentTrack.album?.images?.[0] && (
              <img 
                src={currentTrack.album.images[0].url} 
                alt="Album artwork"
                style={{ width: '60px', height: '60px', borderRadius: '8px' }}
              />
            )}
            <div>
              <p style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                {currentTrack.name}
              </p>
              <p style={{ color: 'var(--dark-gray)' }}>
                {currentTrack.artists?.map(artist => artist.name).join(', ')}
              </p>
            </div>
          </div>
        ) : (
          <p style={{ color: 'var(--dark-gray)', marginBottom: '2rem' }}>
            Spotifyで音楽を再生してリアルタイム分析を開始
          </p>
        )}
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