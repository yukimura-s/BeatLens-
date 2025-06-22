"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"

interface SpotifyTrack {
  id: string
  name: string
  artists: { name: string }[]
  album: {
    name: string
    images: { url: string }[]
  }
  duration_ms: number
  popularity: number
  external_urls: { spotify: string }
  preview_url: string | null
}

interface TopArtist {
  id: string
  name: string
  genres: string[]
  images: { url: string }[]
  popularity: number
}

export default function RecommendationsPage() {
  const { data: session } = useSession()
  const [topTracks, setTopTracks] = useState<SpotifyTrack[]>([])
  const [topArtists, setTopArtists] = useState<TopArtist[]>([])
  const [recommendations, setRecommendations] = useState<SpotifyTrack[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingRecommendations, setLoadingRecommendations] = useState(false)
  const [timeRange, setTimeRange] = useState<'short_term' | 'medium_term' | 'long_term'>('medium_term')

  useEffect(() => {
    if (session?.accessToken) {
      fetchTopItems()
    }
  }, [session, timeRange])

  const fetchTopItems = async () => {
    setLoading(true)
    try {
      // Fetch top tracks and artists in parallel
      const [tracksResponse, artistsResponse] = await Promise.all([
        fetch(`https://api.spotify.com/v1/me/top/tracks?limit=10&time_range=${timeRange}`, {
          headers: { Authorization: `Bearer ${session?.accessToken}` }
        }),
        fetch(`https://api.spotify.com/v1/me/top/artists?limit=5&time_range=${timeRange}`, {
          headers: { Authorization: `Bearer ${session?.accessToken}` }
        })
      ])

      const [tracksData, artistsData] = await Promise.all([
        tracksResponse.json(),
        artistsResponse.json()
      ])

      setTopTracks(tracksData.items || [])
      setTopArtists(artistsData.items || [])

      // Generate recommendations based on top tracks
      if (tracksData.items?.length > 0) {
        await generateRecommendations(tracksData.items.slice(0, 5))
      }
    } catch (error) {
      console.error('Error fetching top items:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateRecommendations = async (seedTracks: SpotifyTrack[]) => {
    setLoadingRecommendations(true)
    try {
      const seedTrackIds = seedTracks.map(track => track.id).slice(0, 5).join(',')
      const response = await fetch(
        `https://api.spotify.com/v1/recommendations?seed_tracks=${seedTrackIds}&limit=20`,
        {
          headers: { Authorization: `Bearer ${session?.accessToken}` }
        }
      )
      const data = await response.json()
      setRecommendations(data.tracks || [])
    } catch (error) {
      console.error('Error generating recommendations:', error)
    } finally {
      setLoadingRecommendations(false)
    }
  }

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const getTimeRangeLabel = (range: string) => {
    switch (range) {
      case 'short_term': return '最近1ヶ月'
      case 'medium_term': return '最近6ヶ月'
      case 'long_term': return '全期間'
      default: return '最近6ヶ月'
    }
  }

  if (!session) {
    return (
      <>
        <h1 className="page-title">新しい音楽を発見</h1>
        <div className="card">
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
              おすすめ機能を利用するにはログインが必要です
            </h3>
            <p style={{ color: 'var(--dark-gray)' }}>
              Spotifyアカウントでログインして、パーソナライズされたおすすめをお楽しみください。
            </p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <h1 className="page-title">新しい音楽を発見</h1>
      <p className="page-subtitle">あなたの視聴習慣に基づいてパーソナライズされたおすすめ</p>
      
      {/* Time Range Selector */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>期間を選択</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {[
            { key: 'short_term', label: '最近1ヶ月' },
            { key: 'medium_term', label: '最近6ヶ月' },
            { key: 'long_term', label: '全期間' }
          ].map((option) => (
            <button
              key={option.key}
              onClick={() => setTimeRange(option.key as any)}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '20px',
                border: 'none',
                background: timeRange === option.key ? 'var(--electric-purple)' : 'var(--light-gray)',
                color: timeRange === option.key ? 'white' : 'var(--charcoal)',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="card">
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div className="loading-dots">
              <div className="dot"></div>
              <div className="dot"></div>
              <div className="dot"></div>
            </div>
            <p style={{ marginTop: '1rem', color: 'var(--dark-gray)' }}>あなたの音楽データを分析中...</p>
          </div>
        </div>
      )}

      {/* Top Artists */}
      {topArtists.length > 0 && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem' }}>
            お気に入りアーティスト ({getTimeRangeLabel(timeRange)})
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {topArtists.map((artist) => (
              <div key={artist.id} style={{ textAlign: 'center' }}>
                {artist.images[0] && (
                  <img 
                    src={artist.images[0].url}
                    alt={artist.name}
                    style={{ 
                      width: '120px', 
                      height: '120px', 
                      borderRadius: '50%', 
                      objectFit: 'cover',
                      margin: '0 auto 1rem'
                    }}
                  />
                )}
                <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                  {artist.name}
                </h3>
                <p style={{ color: 'var(--dark-gray)', fontSize: '0.875rem' }}>
                  {artist.genres.slice(0, 2).join(', ')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Tracks */}
      {topTracks.length > 0 && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem' }}>
            よく聴く楽曲 ({getTimeRangeLabel(timeRange)})
          </h2>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {topTracks.slice(0, 5).map((track, index) => (
              <div 
                key={track.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem',
                  borderRadius: '12px',
                  background: 'var(--light-gray)'
                }}
              >
                <div style={{ 
                  minWidth: '2rem',
                  height: '2rem',
                  borderRadius: '50%',
                  background: 'var(--premium-gradient)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: '700'
                }}>
                  {index + 1}
                </div>
                {track.album.images[0] && (
                  <img 
                    src={track.album.images[0].url}
                    alt={track.album.name}
                    style={{ width: '50px', height: '50px', borderRadius: '8px' }}
                  />
                )}
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                    {track.name}
                  </h3>
                  <p style={{ color: 'var(--dark-gray)', fontSize: '0.875rem' }}>
                    {track.artists.map(artist => artist.name).join(', ')}
                  </p>
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--dark-gray)' }}>
                  {formatDuration(track.duration_ms)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {loadingRecommendations && (
        <div className="card">
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div className="loading-dots">
              <div className="dot"></div>
              <div className="dot"></div>
              <div className="dot"></div>
            </div>
            <p style={{ marginTop: '1rem', color: 'var(--dark-gray)' }}>おすすめを生成中...</p>
          </div>
        </div>
      )}

      {recommendations.length > 0 && (
        <div className="card">
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem' }}>
            あなたへのおすすめ
          </h2>
          <p style={{ color: 'var(--dark-gray)', marginBottom: '2rem' }}>
            あなたのお気に入り楽曲に基づいて選出された新しい発見
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {recommendations.map((track) => (
              <div 
                key={track.id}
                style={{
                  padding: '1rem',
                  borderRadius: '12px',
                  background: 'var(--light-gray)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                onClick={() => window.open(track.external_urls.spotify, '_blank')}
              >
                {track.album.images[0] && (
                  <img 
                    src={track.album.images[0].url}
                    alt={track.album.name}
                    style={{ 
                      width: '100%', 
                      aspectRatio: '1', 
                      borderRadius: '8px', 
                      objectFit: 'cover',
                      marginBottom: '1rem'
                    }}
                  />
                )}
                <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                  {track.name}
                </h3>
                <p style={{ color: 'var(--dark-gray)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                  {track.artists.map(artist => artist.name).join(', ')}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--dark-gray)' }}>
                    {formatDuration(track.duration_ms)}
                  </span>
                  <div style={{ 
                    padding: '0.25rem 0.75rem', 
                    borderRadius: '12px', 
                    background: 'var(--premium-gradient)',
                    color: 'white',
                    fontSize: '0.75rem',
                    fontWeight: '600'
                  }}>
                    {track.popularity}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}