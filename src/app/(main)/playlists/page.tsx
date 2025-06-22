"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"

interface SpotifyPlaylist {
  id: string
  name: string
  description: string
  images: { url: string }[]
  tracks: { total: number }
  owner: { display_name: string }
  external_urls: { spotify: string }
}

interface PlaylistTrack {
  id: string
  name: string
  artists: { name: string }[]
  duration_ms: number
}

export default function PlaylistsPage() {
  const { data: session } = useSession()
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([])
  const [selectedPlaylist, setSelectedPlaylist] = useState<SpotifyPlaylist | null>(null)
  const [playlistTracks, setPlaylistTracks] = useState<PlaylistTrack[]>([])
  const [playlistAnalysis, setPlaylistAnalysis] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)

  useEffect(() => {
    if ((session as any)?.accessToken) {
      fetchPlaylists()
    }
  }, [session])

  const fetchPlaylists = async () => {
    try {
      const response = await fetch('https://api.spotify.com/v1/me/playlists?limit=20', {
        headers: {
          Authorization: `Bearer ${(session as any)?.accessToken}`,
        },
      })
      const data = await response.json()
      setPlaylists(data.items || [])
    } catch (error) {
      console.error('Error fetching playlists:', error)
    } finally {
      setLoading(false)
    }
  }

  const analyzePlaylist = async (playlist: SpotifyPlaylist) => {
    if (!(session as any)?.accessToken) return

    setSelectedPlaylist(playlist)
    setAnalyzing(true)
    
    try {
      // Get playlist tracks
      const tracksResponse = await fetch(
        `https://api.spotify.com/v1/playlists/${playlist.id}/tracks?limit=50`,
        {
          headers: {
            Authorization: `Bearer ${(session as any)?.accessToken}`,
          },
        }
      )
      const tracksData = await tracksResponse.json()
      const tracks = tracksData.items?.map((item: any) => item.track).filter((track: any) => track) || []
      setPlaylistTracks(tracks)

      // Get audio features for first 10 tracks (to avoid rate limits)
      const trackIds = tracks.slice(0, 10).map((track: any) => track.id).join(',')
      if (trackIds) {
        const featuresResponse = await fetch(
          `https://api.spotify.com/v1/audio-features?ids=${trackIds}`,
          {
            headers: {
              Authorization: `Bearer ${(session as any)?.accessToken}`,
            },
          }
        )
        const featuresData = await featuresResponse.json()
        
        // Calculate average features
        const features = featuresData.audio_features?.filter((f: any) => f) || []
        if (features.length > 0) {
          const analysis = {
            energy: features.reduce((sum: number, f: any) => sum + f.energy, 0) / features.length,
            danceability: features.reduce((sum: number, f: any) => sum + f.danceability, 0) / features.length,
            valence: features.reduce((sum: number, f: any) => sum + f.valence, 0) / features.length,
            acousticness: features.reduce((sum: number, f: any) => sum + f.acousticness, 0) / features.length,
            tempo: features.reduce((sum: number, f: any) => sum + f.tempo, 0) / features.length,
          }
          setPlaylistAnalysis(analysis)
        }
      }
    } catch (error) {
      console.error('Error analyzing playlist:', error)
    } finally {
      setAnalyzing(false)
    }
  }

  const formatDuration = (totalMs: number) => {
    const hours = Math.floor(totalMs / 3600000)
    const minutes = Math.floor((totalMs % 3600000) / 60000)
    return hours > 0 ? `${hours}時間${minutes}分` : `${minutes}分`
  }

  const getTotalDuration = (tracks: PlaylistTrack[]) => {
    return tracks.reduce((total, track) => total + track.duration_ms, 0)
  }

  if (loading) {
    return (
      <>
        <h1 className="page-title">プレイリスト</h1>
        <div className="card">
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div className="loading-dots">
              <div className="dot"></div>
              <div className="dot"></div>
              <div className="dot"></div>
            </div>
            <p style={{ marginTop: '1rem', color: 'var(--dark-gray)' }}>プレイリストを読み込み中...</p>
          </div>
        </div>
      </>
    )
  }

  if (!session) {
    return (
      <>
        <h1 className="page-title">プレイリスト</h1>
        <div className="card">
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
              プレイリスト分析を利用するにはログインが必要です
            </h3>
            <p style={{ color: 'var(--dark-gray)' }}>
              Spotifyアカウントでログインして、プレイリストの分析をお楽しみください。
            </p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <h1 className="page-title">プレイリスト</h1>
      <p className="page-subtitle">あなたのプレイリストを分析して、音楽的特徴を発見しましょう。</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {playlists.map((playlist) => (
          <div 
            key={playlist.id}
            className="card" 
            style={{ 
              cursor: 'pointer',
              background: selectedPlaylist?.id === playlist.id ? 'var(--light-gray)' : 'var(--pure-white)'
            }}
            onClick={() => analyzePlaylist(playlist)}
          >
            <div style={{ 
              height: '200px', 
              borderRadius: '12px', 
              marginBottom: '1rem',
              backgroundImage: playlist.images[0] ? `url(${playlist.images[0].url})` : 'var(--aurora-gradient)',
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}></div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem' }}>
              {playlist.name}
            </h3>
            <p style={{ color: 'var(--dark-gray)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              {playlist.tracks.total}曲
            </p>
            <p style={{ color: 'var(--dark-gray)', fontSize: '0.75rem' }}>
              by {playlist.owner.display_name}
            </p>
          </div>
        ))}
      </div>

      {analyzing && (
        <div className="card">
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div className="loading-dots">
              <div className="dot"></div>
              <div className="dot"></div>
              <div className="dot"></div>
            </div>
            <p style={{ marginTop: '1rem', color: 'var(--dark-gray)' }}>プレイリストを分析中...</p>
          </div>
        </div>
      )}

      {selectedPlaylist && (
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
            {selectedPlaylist.images[0] && (
              <img 
                src={selectedPlaylist.images[0].url}
                alt={selectedPlaylist.name}
                style={{ width: '80px', height: '80px', borderRadius: '12px' }}
              />
            )}
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                {selectedPlaylist.name}
              </h2>
              <p style={{ color: 'var(--dark-gray)', marginBottom: '0.5rem' }}>
                {selectedPlaylist.tracks.total}曲 • {playlistTracks.length > 0 && formatDuration(getTotalDuration(playlistTracks))}
              </p>
              <a 
                href={selectedPlaylist.external_urls.spotify}
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
      )}

      {playlistAnalysis && (
        <div className="card">
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '2rem' }}>プレイリスト分析</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>平均的な特徴</h3>
              <div className="progress-item">
                <div className="progress-header">
                  <span className="progress-label">エネルギー</span>
                  <span className="progress-value">{Math.round(playlistAnalysis.energy * 100)}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${playlistAnalysis.energy * 100}%` }}></div>
                </div>
              </div>
              <div className="progress-item">
                <div className="progress-header">
                  <span className="progress-label">ダンス適性</span>
                  <span className="progress-value">{Math.round(playlistAnalysis.danceability * 100)}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${playlistAnalysis.danceability * 100}%` }}></div>
                </div>
              </div>
              <div className="progress-item">
                <div className="progress-header">
                  <span className="progress-label">ポジティブ度</span>
                  <span className="progress-value">{Math.round(playlistAnalysis.valence * 100)}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${playlistAnalysis.valence * 100}%` }}></div>
                </div>
              </div>
              <div className="progress-item">
                <div className="progress-header">
                  <span className="progress-label">アコースティック度</span>
                  <span className="progress-value">{Math.round(playlistAnalysis.acousticness * 100)}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${playlistAnalysis.acousticness * 100}%` }}></div>
                </div>
              </div>
            </div>

            <div style={{ 
              padding: '1.5rem',
              background: 'var(--light-gray)',
              borderRadius: '12px'
            }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>統計情報</h3>
              <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--electric-purple)' }}>
                  {Math.round(playlistAnalysis.tempo)} BPM
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--dark-gray)' }}>平均テンポ</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--electric-purple)' }}>
                  {playlistTracks.length}
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--dark-gray)' }}>分析済み楽曲</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}