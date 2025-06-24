"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { 
  calculateMusicProfile, 
  generateRecommendationParams, 
  MOOD_CATEGORIES, 
  analyzeTrackDetails,
  AudioFeatures,
  categorizeMood
} from '@/lib/musicAnalysis'

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
  popularity?: number
  external_urls?: { spotify: string }
  album?: {
    name: string
    images: { url: string }[]
  }
}

interface RecommendedTrack extends PlaylistTrack {
  audioFeatures?: AudioFeatures
  analysis?: ReturnType<typeof analyzeTrackDetails>
  similarityReason?: string
}

export default function PlaylistsPage() {
  const { data: session } = useSession()
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([])
  const [selectedPlaylist, setSelectedPlaylist] = useState<SpotifyPlaylist | null>(null)
  const [playlistTracks, setPlaylistTracks] = useState<PlaylistTrack[]>([])
  const [playlistAnalysis, setPlaylistAnalysis] = useState<any>(null)
  const [playlistProfile, setPlaylistProfile] = useState<any>(null)
  const [recommendedTracks, setRecommendedTracks] = useState<RecommendedTrack[]>([])
  const [dominantGenres, setDominantGenres] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [generatingRecs, setGeneratingRecs] = useState(false)

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

      // Get audio features for tracks (limit to 20 for better analysis)
      const trackIds = tracks.slice(0, 20).map((track: any) => track.id).join(',')
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
        
        // Calculate detailed analysis
        const features = featuresData.audio_features?.filter((f: any) => f) || []
        if (features.length > 0) {
          // Basic statistics
          const analysis = {
            energy: features.reduce((sum: number, f: any) => sum + f.energy, 0) / features.length,
            danceability: features.reduce((sum: number, f: any) => sum + f.danceability, 0) / features.length,
            valence: features.reduce((sum: number, f: any) => sum + f.valence, 0) / features.length,
            acousticness: features.reduce((sum: number, f: any) => sum + f.acousticness, 0) / features.length,
            tempo: features.reduce((sum: number, f: any) => sum + f.tempo, 0) / features.length,
            loudness: features.reduce((sum: number, f: any) => sum + f.loudness, 0) / features.length,
            speechiness: features.reduce((sum: number, f: any) => sum + f.speechiness, 0) / features.length,
            instrumentalness: features.reduce((sum: number, f: any) => sum + f.instrumentalness, 0) / features.length,
          }
          setPlaylistAnalysis(analysis)
          
          // Generate music profile
          const profile = calculateMusicProfile(features)
          setPlaylistProfile(profile)
          
          // Analyze dominant genres
          const genres = features.map((f: any) => {
            const mood = categorizeMood(f)
            return mood ? mood.name : null
          }).filter(Boolean)
          
          const genreCount: { [key: string]: number } = {}
          genres.forEach((genre: any) => {
            if (genre) genreCount[genre] = (genreCount[genre] || 0) + 1
          })
          
          const sortedGenres = Object.entries(genreCount)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([genre]) => genre)
          
          setDominantGenres(sortedGenres)
          
          // Generate recommendations
          await generatePlaylistRecommendations(profile, tracks.slice(0, 5))
        }
      }
    } catch (error) {
      console.error('Error analyzing playlist:', error)
    } finally {
      setAnalyzing(false)
    }
  }

  const generatePlaylistRecommendations = async (profile: any, seedTracks: PlaylistTrack[]) => {
    setGeneratingRecs(true)
    try {
      // Generate recommendations based on playlist profile
      const recParams = generateRecommendationParams(profile)
      const seedTrackIds = seedTracks.map(t => t.id).slice(0, 5).join(',')
      
      const response = await fetch(
        `https://api.spotify.com/v1/recommendations?${new URLSearchParams({
          seed_tracks: seedTrackIds,
          ...Object.fromEntries(Object.entries(recParams).map(([k, v]) => [k, String(v)])),
          limit: '15'
        })}`,
        {
          headers: {
            Authorization: `Bearer ${(session as any)?.accessToken}`,
          },
        }
      )
      
      const data = await response.json()
      const tracks = data.tracks || []
      
      // Enhance recommendations with analysis
      if (tracks.length > 0) {
        const trackIds = tracks.map((t: any) => t.id).join(',')
        const featuresResponse = await fetch(
          `https://api.spotify.com/v1/audio-features?ids=${trackIds}`,
          {
            headers: {
              Authorization: `Bearer ${(session as any)?.accessToken}`,
            },
          }
        )
        const featuresData = await featuresResponse.json()
        const audioFeatures = featuresData.audio_features || []
        
        const enhancedTracks = tracks.map((track: any, index: number) => {
          const features = audioFeatures[index]
          const analysis = features ? analyzeTrackDetails(features) : undefined
          
          // Determine similarity reason
          let reason = 'プレイリストの特徴に基づく'
          if (analysis?.mood) {
            if (dominantGenres.includes(analysis.mood.name)) {
              reason = `${analysis.mood.name}ジャンルの特徴`
            }
          }
          
          return {
            ...track,
            audioFeatures: features,
            analysis,
            similarityReason: reason
          }
        })
        
        setRecommendedTracks(enhancedTracks)
      }
    } catch (error) {
      console.error('Error generating recommendations:', error)
    } finally {
      setGeneratingRecs(false)
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
              <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>🎵 音楽の特徴</h3>
              <div className="progress-item">
                <div className="progress-header">
                  <span className="progress-label">🔥 パワフルさ</span>
                  <span className="progress-value">{Math.round(playlistAnalysis.energy * 100)}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${playlistAnalysis.energy * 100}%` }}></div>
                </div>
              </div>
              <div className="progress-item">
                <div className="progress-header">
                  <span className="progress-label">💃 踊りやすさ</span>
                  <span className="progress-value">{Math.round(playlistAnalysis.danceability * 100)}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${playlistAnalysis.danceability * 100}%` }}></div>
                </div>
              </div>
              <div className="progress-item">
                <div className="progress-header">
                  <span className="progress-label">😊 明るさ</span>
                  <span className="progress-value">{Math.round(playlistAnalysis.valence * 100)}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${playlistAnalysis.valence * 100}%` }}></div>
                </div>
              </div>
              <div className="progress-item">
                <div className="progress-header">
                  <span className="progress-label">🎼 生楽器感</span>
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
              <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>📊 データ</h3>
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
          
          {/* Dominant Genres */}
          {dominantGenres.length > 0 && (
            <div style={{ marginTop: '2rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>🎵 主要ジャンル</h3>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {dominantGenres.map((genre, index) => {
                  const genreInfo = MOOD_CATEGORIES.find(m => m.name === genre)
                  return (
                    <div
                      key={genre}
                      style={{
                        padding: '0.75rem 1.5rem',
                        borderRadius: '20px',
                        background: genreInfo?.color || 'var(--light-gray)',
                        color: 'white',
                        fontWeight: '600',
                        fontSize: '0.875rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <span>{genreInfo?.emoji}</span>
                      {genre}
                      {index === 0 && <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>(主要)</span>}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Loading Recommendations */}
      {generatingRecs && (
        <div className="card">
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div className="loading-dots">
              <div className="dot"></div>
              <div className="dot"></div>
              <div className="dot"></div>
            </div>
            <p style={{ marginTop: '1rem', color: 'var(--dark-gray)' }}>プレイリストに基づくおすすめを生成中...</p>
          </div>
        </div>
      )}

      {/* Playlist-based Recommendations */}
      {recommendedTracks.length > 0 && (
        <div className="card">
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem' }}>
            🎯 このプレイリストにおすすめ
          </h2>
          <p style={{ color: 'var(--dark-gray)', marginBottom: '2rem' }}>
            プレイリストの音楽的特徴を分析して、相性の良い楽曲を厳選しました
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {recommendedTracks.map((track, index) => (
              <div 
                key={track.id}
                style={{
                  padding: '1rem',
                  borderRadius: '12px',
                  background: 'var(--light-gray)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  position: 'relative'
                }}
                onClick={() => track.external_urls?.spotify && window.open(track.external_urls.spotify, '_blank')}
              >
                {/* Recommendation Rank */}
                <div style={{
                  position: 'absolute',
                  top: '0.5rem',
                  left: '0.5rem',
                  width: '1.5rem',
                  height: '1.5rem',
                  borderRadius: '50%',
                  background: 'var(--premium-gradient)',
                  color: 'white',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1
                }}>
                  {index + 1}
                </div>

                {track.album?.images[0] && (
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

                {/* Similarity Reason */}
                <div style={{ 
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.25rem 0.75rem', 
                  borderRadius: '12px', 
                  background: 'var(--mint-green)',
                  color: 'white',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  marginBottom: '0.5rem'
                }}>
                  ✨ {track.similarityReason}
                </div>

                {/* Genre Badge */}
                {track.analysis?.mood && (
                  <div style={{ 
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.25rem 0.75rem', 
                    borderRadius: '12px', 
                    background: track.analysis.mood.color,
                    color: 'white',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    marginBottom: '0.5rem',
                    marginLeft: '0.5rem'
                  }}>
                    {track.analysis.mood.emoji} {track.analysis.mood.name}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--dark-gray)' }}>
                    {formatDuration(track.duration_ms)}
                  </span>
                  {track.popularity && (
                    <div style={{ 
                      padding: '0.25rem 0.75rem', 
                      borderRadius: '12px', 
                      background: 'var(--premium-gradient)',
                      color: 'white',
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}>
                      人気度 {track.popularity}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* Add to Playlist CTA */}
          <div style={{ 
            marginTop: '2rem', 
            padding: '1.5rem', 
            background: 'var(--light-gray)', 
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
              💡 プレイリストをさらに充実させませんか？
            </h3>
            <p style={{ color: 'var(--dark-gray)', fontSize: '0.875rem' }}>
              気に入った楽曲をSpotifyで開いて、プレイリストに追加してみましょう
            </p>
          </div>
        </div>
      )}
    </>
  )
}