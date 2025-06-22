"use client"

import { useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { 
  calculateSimilarity, 
  calculateMusicProfile, 
  analyzeTrackDetails,
  AudioFeatures
} from '@/lib/musicAnalysis'

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
}

interface SimilarTrack extends SpotifyTrack {
  audioFeatures?: AudioFeatures
  analysis?: ReturnType<typeof analyzeTrackDetails>
  similarity?: number
}

export default function SimilarTracksPage() {
  const { data: session } = useSession()
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SpotifyTrack[]>([])
  const [selectedTrack, setSelectedTrack] = useState<SimilarTrack | null>(null)
  const [similarTracks, setSimilarTracks] = useState<SimilarTrack[]>([])
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)

  const searchTracks = useCallback(async () => {
    if (!searchQuery.trim() || !(session as any)?.accessToken) return

    setLoading(true)
    try {
      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(searchQuery)}&type=track&limit=10`,
        {
          headers: {
            Authorization: `Bearer ${(session as any)?.accessToken}`,
          },
        }
      )
      const data = await response.json()
      setSearchResults(data.tracks?.items || [])
    } catch (error) {
      console.error('Error searching tracks:', error)
    } finally {
      setLoading(false)
    }
  }, [searchQuery, session])

  const findSimilarTracks = useCallback(async (track: SpotifyTrack) => {
    if (!(session as any)?.accessToken) return

    setSelectedTrack(track)
    setAnalyzing(true)
    
    try {
      // Get audio features for the selected track
      const featuresResponse = await fetch(
        `https://api.spotify.com/v1/audio-features/${track.id}`,
        {
          headers: {
            Authorization: `Bearer ${(session as any)?.accessToken}`,
          },
        }
      )
      const selectedFeatures = await featuresResponse.json()
      
      if (!selectedFeatures) {
        console.error('No audio features found for selected track')
        return
      }

      // Calculate music profile for the selected track
      const selectedProfile = calculateMusicProfile([selectedFeatures])
      const selectedAnalysis = analyzeTrackDetails(selectedFeatures)
      
      setSelectedTrack({
        ...track,
        audioFeatures: selectedFeatures,
        analysis: selectedAnalysis
      })

      // Generate recommendations based on the selected track
      const params = new URLSearchParams({
        seed_tracks: track.id,
        target_energy: String(selectedFeatures.energy),
        target_danceability: String(selectedFeatures.danceability),
        target_valence: String(selectedFeatures.valence),
        target_acousticness: String(selectedFeatures.acousticness),
        target_tempo: String(Math.round(selectedFeatures.tempo)),
        limit: '50'
      })

      const recommendationsResponse = await fetch(
        `https://api.spotify.com/v1/recommendations?${params}`,
        {
          headers: {
            Authorization: `Bearer ${(session as any)?.accessToken}`,
          },
        }
      )
      const recommendationsData = await recommendationsResponse.json()
      const recommendations = recommendationsData.tracks || []

      // Get audio features for all recommendations
      if (recommendations.length > 0) {
        const recIds = recommendations.map((r: SpotifyTrack) => r.id).join(',')
        const recFeaturesResponse = await fetch(
          `https://api.spotify.com/v1/audio-features?ids=${recIds}`,
          {
            headers: {
              Authorization: `Bearer ${(session as any)?.accessToken}`,
            },
          }
        )
        const recFeaturesData = await recFeaturesResponse.json()
        const recFeatures = recFeaturesData.audio_features || []

        // Calculate similarity scores and enhance tracks
        const enhancedSimilarTracks = recommendations
          .map((recTrack: SpotifyTrack, index: number) => {
            const features = recFeatures[index]
            if (!features) return null

            const profile = calculateMusicProfile([features])
            const similarity = calculateSimilarity(selectedProfile, profile)
            const analysis = analyzeTrackDetails(features)

            return {
              ...recTrack,
              audioFeatures: features,
              analysis,
              similarity
            }
          })
          .filter(Boolean)
          .sort((a: SimilarTrack, b: SimilarTrack) => (b.similarity || 0) - (a.similarity || 0))
          .slice(0, 20) // Top 20 most similar tracks

        setSimilarTracks(enhancedSimilarTracks)
      }

    } catch (error) {
      console.error('Error finding similar tracks:', error)
    } finally {
      setAnalyzing(false)
    }
  }, [session])

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchTracks()
    }
  }

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const getSimilarityColor = (similarity: number) => {
    if (similarity > 0.8) return 'var(--neon-pink)'
    if (similarity > 0.6) return 'var(--electric-purple)'
    if (similarity > 0.4) return 'var(--sunset-orange)'
    return 'var(--mint-green)'
  }

  const getSimilarityLabel = (similarity: number) => {
    if (similarity > 0.8) return '🎯 極めて類似'
    if (similarity > 0.6) return '🔥 とても類似'
    if (similarity > 0.4) return '✨ 似ている'
    return '🌟 やや似ている'
  }

  if (!session) {
    return (
      <>
        <h1 className="page-title">類似楽曲検索</h1>
        <div className="card">
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
              類似楽曲検索を利用するにはログインが必要です
            </h3>
            <p style={{ color: 'var(--dark-gray)' }}>
              Spotifyアカウントでログインして、お気に入り楽曲に似た音楽を発見しましょう。
            </p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <h1 className="page-title">類似楽曲検索</h1>
      <p className="page-subtitle">楽曲の音楽的特徴を分析して、類似した楽曲を発見します。</p>
      
      <div className="search-container">
        <input 
          type="text" 
          className="search-input" 
          placeholder="楽曲やアーティストを検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <button 
          className="search-icon" 
          onClick={searchTracks}
          style={{ 
            background: 'none', 
            border: 'none', 
            cursor: 'pointer',
            color: 'var(--dark-gray)'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
        </button>
      </div>

      {loading && (
        <div className="card">
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div className="loading-dots">
              <div className="dot"></div>
              <div className="dot"></div>
              <div className="dot"></div>
            </div>
            <p style={{ marginTop: '1rem', color: 'var(--dark-gray)' }}>検索中...</p>
          </div>
        </div>
      )}

      {searchResults.length > 0 && (
        <div className="card">
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem' }}>検索結果</h2>
          <p style={{ color: 'var(--dark-gray)', marginBottom: '1.5rem' }}>
            楽曲を選択して類似した音楽を発見しましょう
          </p>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {searchResults.map((track) => (
              <div 
                key={track.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem',
                  borderRadius: '12px',
                  background: selectedTrack?.id === track.id ? 'var(--light-gray)' : 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  border: selectedTrack?.id === track.id ? '2px solid var(--electric-purple)' : '2px solid transparent'
                }}
                onClick={() => findSimilarTracks(track)}
              >
                {track.album.images[0] && (
                  <img 
                    src={track.album.images[0].url}
                    alt={track.album.name}
                    style={{ width: '60px', height: '60px', borderRadius: '8px' }}
                  />
                )}
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                    {track.name}
                  </h3>
                  <p style={{ color: 'var(--dark-gray)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                    {track.artists.map(artist => artist.name).join(', ')}
                  </p>
                  <p style={{ color: 'var(--dark-gray)', fontSize: '0.75rem' }}>
                    {track.album.name} • {formatDuration(track.duration_ms)}
                  </p>
                </div>
                <div style={{ 
                  padding: '0.5rem 1rem', 
                  borderRadius: '20px', 
                  background: 'var(--premium-gradient)',
                  color: 'white',
                  fontSize: '0.75rem',
                  fontWeight: '600'
                }}>
                  類似楽曲を検索
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedTrack && (
        <div className="card">
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem' }}>
            選択された楽曲
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
            {selectedTrack.album.images[0] && (
              <img 
                src={selectedTrack.album.images[0].url}
                alt={selectedTrack.album.name}
                style={{ width: '80px', height: '80px', borderRadius: '12px' }}
              />
            )}
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                {selectedTrack.name}
              </h3>
              <p style={{ color: 'var(--dark-gray)', marginBottom: '0.5rem' }}>
                {selectedTrack.artists.map(artist => artist.name).join(', ')}
              </p>
              {selectedTrack.analysis?.mood && (
                <div style={{ 
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.25rem 0.75rem', 
                  borderRadius: '12px', 
                  background: selectedTrack.analysis.mood.color,
                  color: 'white',
                  fontSize: '0.75rem',
                  fontWeight: '600'
                }}>
                  {selectedTrack.analysis.mood.emoji} {selectedTrack.analysis.mood.name}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {analyzing && (
        <div className="card">
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div className="loading-dots">
              <div className="dot"></div>
              <div className="dot"></div>
              <div className="dot"></div>
            </div>
            <p style={{ marginTop: '1rem', color: 'var(--dark-gray)' }}>類似楽曲を分析中...</p>
          </div>
        </div>
      )}

      {similarTracks.length > 0 && (
        <div className="card">
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem' }}>
            🎵 類似楽曲
          </h2>
          <p style={{ color: 'var(--dark-gray)', marginBottom: '2rem' }}>
            音楽的特徴の類似度順に並んでいます
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {similarTracks.map((track) => (
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
                onClick={() => window.open(track.external_urls.spotify, '_blank')}
              >
                {/* Similarity Badge */}
                <div style={{
                  position: 'absolute',
                  top: '0.5rem',
                  right: '0.5rem',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '12px',
                  background: getSimilarityColor(track.similarity || 0),
                  color: 'white',
                  fontSize: '0.7rem',
                  fontWeight: '700',
                  zIndex: 1
                }}>
                  {Math.round((track.similarity || 0) * 100)}% 類似
                </div>

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

                {/* Similarity Label */}
                <div style={{ 
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.25rem 0.75rem', 
                  borderRadius: '12px', 
                  background: getSimilarityColor(track.similarity || 0),
                  color: 'white',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  marginBottom: '0.5rem'
                }}>
                  {getSimilarityLabel(track.similarity || 0)}
                </div>

                {/* Mood Badge */}
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
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}