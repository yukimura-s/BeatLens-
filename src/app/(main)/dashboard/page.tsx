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
  id: string
  name: string
  artists: { name: string }[]
  album: { 
    name: string
    images: { url: string }[] 
  }
  duration_ms: number
  external_urls: { spotify: string }
}

interface PlaybackState {
  is_playing: boolean
  progress_ms: number
  item: TrackData | null
}


export default function DashboardPage() {
  const { data: session } = useSession()
  const [user, setUser] = useState<SpotifyUser | null>(null)
  const [playbackState, setPlaybackState] = useState<PlaybackState | null>(null)
  const [currentTrackFeatures, setCurrentTrackFeatures] = useState<any>(null)
  const [playlistCount, setPlaylistCount] = useState(0)
  const [topTracks, setTopTracks] = useState<any[]>([])
  const [topArtists, setTopArtists] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // 円グラフコンポーネント
  const CircularProgress = ({ 
    value, 
    size = 120, 
    strokeWidth = 8, 
    color = 'var(--electric-purple)',
    backgroundColor = 'var(--light-gray)',
    children 
  }: {
    value: number
    size?: number
    strokeWidth?: number
    color?: string
    backgroundColor?: string
    children: React.ReactNode
  }) => {
    const radius = (size - strokeWidth) / 2
    const circumference = radius * Math.PI * 2
    const strokeDasharray = circumference
    const strokeDashoffset = circumference - (value / 100) * circumference

    return (
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={backgroundColor}
            strokeWidth={strokeWidth}
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s ease' }}
          />
        </svg>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center'
        }}>
          {children}
        </div>
      </div>
    )
  }

  useEffect(() => {
    if ((session as any)?.accessToken) {
      fetchUserProfile()
      fetchCurrentlyPlaying()
      fetchUserStats()
    }
  }, [session])

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('https://api.spotify.com/v1/me', {
        headers: {
          Authorization: `Bearer ${(session as any)?.accessToken}`,
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
      // Fetch current playback state
      const response = await fetch('https://api.spotify.com/v1/me/player', {
        headers: {
          Authorization: `Bearer ${(session as any)?.accessToken}`,
        },
      })
      
      if (response.ok && response.status !== 204) {
        const data = await response.json()
        setPlaybackState(data)
        
        // If there's a current track, fetch its audio features
        if (data?.item?.id) {
          await fetchTrackFeatures(data.item.id)
        }
      } else {
        // No active playback
        setPlaybackState(null)
        setCurrentTrackFeatures(null)
      }
    } catch (error) {
      console.error('Error fetching currently playing:', error)
    }
  }

  const fetchTrackFeatures = async (trackId: string) => {
    try {
      const response = await fetch(`https://api.spotify.com/v1/audio-features/${trackId}`, {
        headers: {
          Authorization: `Bearer ${(session as any)?.accessToken}`,
        },
      })
      if (response.ok) {
        const features = await response.json()
        setCurrentTrackFeatures(features)
      }
    } catch (error) {
      console.error('Error fetching track features:', error)
    }
  }

  const fetchUserStats = async () => {
    try {
      // Fetch playlists count
      const playlistsResponse = await fetch('https://api.spotify.com/v1/me/playlists?limit=1', {
        headers: {
          Authorization: `Bearer ${(session as any)?.accessToken}`,
        },
      })
      const playlistsData = await playlistsResponse.json()
      setPlaylistCount(playlistsData.total || 0)

      // Fetch top tracks and artists
      const [topTracksResponse, topArtistsResponse] = await Promise.all([
        fetch('https://api.spotify.com/v1/me/top/tracks?limit=5', {
          headers: { Authorization: `Bearer ${(session as any)?.accessToken}` }
        }),
        fetch('https://api.spotify.com/v1/me/top/artists?limit=5', {
          headers: { Authorization: `Bearer ${(session as any)?.accessToken}` }
        })
      ])

      const [topTracksData, topArtistsData] = await Promise.all([
        topTracksResponse.json(),
        topArtistsResponse.json()
      ])

      setTopTracks(topTracksData.items || [])
      setTopArtists(topArtistsData.items || [])
    } catch (error) {
      console.error('Error fetching user stats:', error)
    }
  }

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
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
          <div className="stat-value">{playlistCount}</div>
          <div className="stat-label">プレイリスト</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{topTracks.length}</div>
          <div className="stat-label">お気に入り楽曲</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{topArtists.length}</div>
          <div className="stat-label">フォロー中のアーティスト</div>
        </div>
      </div>

      {/* Currently Playing */}
      <div className="card">
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem' }}>
          {playbackState?.item ? (playbackState.is_playing ? '現在再生中' : '最後に再生した楽曲') : '楽曲分析'}
        </h2>
        
        {playbackState?.item ? (
          <>
            {/* Track Info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
              {playbackState.item.album?.images?.[0] && (
                <img 
                  src={playbackState.item.album.images[0].url} 
                  alt="Album artwork"
                  style={{ 
                    width: '100px', 
                    height: '100px', 
                    borderRadius: '12px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
                  }}
                />
              )}
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                  {playbackState.item.name}
                </h3>
                <p style={{ color: 'var(--dark-gray)', marginBottom: '0.5rem', fontSize: '1rem' }}>
                  {playbackState.item.artists?.map(artist => artist.name).join(', ')}
                </p>
                <p style={{ color: 'var(--dark-gray)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                  {playbackState.item.album.name}
                </p>
                
                {/* Playback Controls Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    background: playbackState.is_playing ? 'var(--mint-green)' : 'var(--sunset-orange)',
                    color: 'white',
                    borderRadius: '20px',
                    fontSize: '0.875rem',
                    fontWeight: '600'
                  }}>
                    {playbackState.is_playing ? '▶️ 再生中' : '⏸️ 一時停止'}
                  </div>
                  <a 
                    href={playbackState.item.external_urls?.spotify}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 1rem',
                      background: '#1DB954',
                      color: 'white',
                      textDecoration: 'none',
                      borderRadius: '20px',
                      fontSize: '0.875rem',
                      fontWeight: '600'
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                    </svg>
                    Spotifyで開く
                  </a>
                </div>
              </div>
            </div>

            {/* Audio Features */}
            {currentTrackFeatures && (
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '2rem' }}>
                  🎵 楽曲の雰囲気分析
                </h3>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                  gap: '2rem',
                  justifyItems: 'center'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <CircularProgress 
                      value={Math.round(currentTrackFeatures.energy * 100)}
                      color="var(--neon-pink)"
                      size={140}
                    >
                      <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--neon-pink)' }}>
                        {Math.round(currentTrackFeatures.energy * 100)}%
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--dark-gray)', marginTop: '0.25rem' }}>
                        エネルギッシュさ
                      </div>
                    </CircularProgress>
                    <div style={{ marginTop: '1rem' }}>
                      <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                        🔥 パワフルさ
                      </h4>
                      <p style={{ fontSize: '0.875rem', color: 'var(--dark-gray)', lineHeight: 1.4 }}>
                        {currentTrackFeatures.energy > 0.7 ? '激しくパワフルな楽曲' :
                         currentTrackFeatures.energy > 0.4 ? '程よいエネルギーの楽曲' : 
                         '落ち着いた穏やかな楽曲'}
                      </p>
                    </div>
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <CircularProgress 
                      value={Math.round(currentTrackFeatures.danceability * 100)}
                      color="var(--mint-green)"
                      size={140}
                    >
                      <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--mint-green)' }}>
                        {Math.round(currentTrackFeatures.danceability * 100)}%
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--dark-gray)', marginTop: '0.25rem' }}>
                        踊りやすさ
                      </div>
                    </CircularProgress>
                    <div style={{ marginTop: '1rem' }}>
                      <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                        💃 ダンサブル
                      </h4>
                      <p style={{ fontSize: '0.875rem', color: 'var(--dark-gray)', lineHeight: 1.4 }}>
                        {currentTrackFeatures.danceability > 0.7 ? 'ダンスにぴったりなリズム' :
                         currentTrackFeatures.danceability > 0.4 ? '心地良いグルーヴ感' : 
                         'ゆったりとしたテンポ'}
                      </p>
                    </div>
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <CircularProgress 
                      value={Math.round(currentTrackFeatures.valence * 100)}
                      color="var(--sunset-orange)"
                      size={140}
                    >
                      <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--sunset-orange)' }}>
                        {Math.round(currentTrackFeatures.valence * 100)}%
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--dark-gray)', marginTop: '0.25rem' }}>
                        明るさ
                      </div>
                    </CircularProgress>
                    <div style={{ marginTop: '1rem' }}>
                      <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                        ☀️ ポジティブ度
                      </h4>
                      <p style={{ fontSize: '0.875rem', color: 'var(--dark-gray)', lineHeight: 1.4 }}>
                        {currentTrackFeatures.valence > 0.7 ? '明るく楽しい気分になる' :
                         currentTrackFeatures.valence > 0.4 ? '程よく心地良い雰囲気' : 
                         '深く感情的な楽曲'}
                      </p>
                    </div>
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <CircularProgress 
                      value={Math.round(currentTrackFeatures.acousticness * 100)}
                      color="var(--ocean-blue)"
                      size={140}
                    >
                      <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--ocean-blue)' }}>
                        {Math.round(currentTrackFeatures.acousticness * 100)}%
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--dark-gray)', marginTop: '0.25rem' }}>
                        生楽器感
                      </div>
                    </CircularProgress>
                    <div style={{ marginTop: '1rem' }}>
                      <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                        🎸 アコースティック
                      </h4>
                      <p style={{ fontSize: '0.875rem', color: 'var(--dark-gray)', lineHeight: 1.4 }}>
                        {currentTrackFeatures.acousticness > 0.7 ? '生楽器中心の温かい音' :
                         currentTrackFeatures.acousticness > 0.4 ? '電子と生楽器のバランス' : 
                         '電子音楽・シンセ中心'}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Technical Info */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                  gap: '1rem',
                  marginTop: '1.5rem',
                  padding: '1rem',
                  background: 'var(--light-gray)',
                  borderRadius: '12px'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--electric-purple)' }}>
                      {Math.round(currentTrackFeatures.tempo)} BPM
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--dark-gray)' }}>テンポ</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--electric-purple)' }}>
                      {['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'][currentTrackFeatures.key] || '不明'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--dark-gray)' }}>キー</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--electric-purple)' }}>
                      {currentTrackFeatures.mode === 1 ? 'メジャー' : 'マイナー'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--dark-gray)' }}>モード</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--electric-purple)' }}>
                      {Math.round(currentTrackFeatures.loudness)} dB
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--dark-gray)' }}>ラウドネス</div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎵</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
              楽曲分析を開始
            </h3>
            <p style={{ color: 'var(--dark-gray)' }}>
              Spotifyで音楽を再生すると、ここに楽曲の詳細分析が表示されます。
            </p>
          </div>
        )}
      </div>

    </>
  )
}