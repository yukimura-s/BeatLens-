"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { 
  calculateMusicProfile, 
  generateRecommendationParams, 
  MOOD_CATEGORIES, 
  analyzeTrackDetails,
  AudioFeatures,
  MusicProfile 
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
  preview_url: string | null
}

interface TopArtist {
  id: string
  name: string
  genres: string[]
  images: { url: string }[]
  popularity: number
}

interface EnhancedTrack extends SpotifyTrack {
  audioFeatures?: AudioFeatures
  analysis?: ReturnType<typeof analyzeTrackDetails>
}

export default function RecommendationsPage() {
  const { data: session } = useSession()
  const [topTracks, setTopTracks] = useState<SpotifyTrack[]>([])
  const [topArtists, setTopArtists] = useState<TopArtist[]>([])
  const [recommendations, setRecommendations] = useState<EnhancedTrack[]>([])
  const [moodRecommendations, setMoodRecommendations] = useState<{[key: string]: EnhancedTrack[]}>({})
  const [userProfile, setUserProfile] = useState<MusicProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingRecommendations, setLoadingRecommendations] = useState(false)
  const [timeRange, setTimeRange] = useState<'short_term' | 'medium_term' | 'long_term'>('medium_term')
  const [selectedMood, setSelectedMood] = useState<string | null>(null)

  useEffect(() => {
    if ((session as any)?.accessToken) {
      fetchTopItems()
    }
  }, [session, timeRange])

  const fetchTopItems = async () => {
    setLoading(true)
    try {
      // Fetch top tracks and artists in parallel
      const [tracksResponse, artistsResponse] = await Promise.all([
        fetch(`https://api.spotify.com/v1/me/top/tracks?limit=10&time_range=${timeRange}`, {
          headers: { Authorization: `Bearer ${(session as any)?.accessToken}` }
        }),
        fetch(`https://api.spotify.com/v1/me/top/artists?limit=5&time_range=${timeRange}`, {
          headers: { Authorization: `Bearer ${(session as any)?.accessToken}` }
        })
      ])

      const [tracksData, artistsData] = await Promise.all([
        tracksResponse.json(),
        artistsResponse.json()
      ])

      setTopTracks(tracksData.items || [])
      setTopArtists(artistsData.items || [])

      // Generate enhanced recommendations based on top tracks
      if (tracksData.items?.length > 0) {
        await generateEnhancedRecommendations(tracksData.items.slice(0, 10))
      }
    } catch (error) {
      console.error('Error fetching top items:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateEnhancedRecommendations = async (seedTracks: SpotifyTrack[]) => {
    setLoadingRecommendations(true)
    try {
      // Get audio features for seed tracks
      const seedTrackIds = seedTracks.map(track => track.id).join(',')
      const featuresResponse = await fetch(
        `https://api.spotify.com/v1/audio-features?ids=${seedTrackIds}`,
        {
          headers: { Authorization: `Bearer ${(session as any)?.accessToken}` }
        }
      )
      const featuresData = await featuresResponse.json()
      const audioFeatures = featuresData.audio_features?.filter((f: any) => f) || []
      
      // Calculate user's music profile
      const profile = calculateMusicProfile(audioFeatures)
      setUserProfile(profile)
      
      // Generate general recommendations
      const generalParams = generateRecommendationParams(profile)
      const generalResponse = await fetch(
        `https://api.spotify.com/v1/recommendations?${new URLSearchParams({
          seed_tracks: seedTracks.slice(0, 5).map(t => t.id).join(','),
          ...Object.fromEntries(Object.entries(generalParams).map(([k, v]) => [k, String(v)]))
        })}`,
        {
          headers: { Authorization: `Bearer ${(session as any)?.accessToken}` }
        }
      )
      const generalData = await generalResponse.json()
      
      // Enhance recommendations with audio features and analysis
      const enhancedRecommendations = await enhanceTracksWithAnalysis(generalData.tracks || [])
      setRecommendations(enhancedRecommendations)
      
      // Generate mood-based recommendations
      const moodRecs: {[key: string]: EnhancedTrack[]} = {}
      for (const mood of MOOD_CATEGORIES.slice(0, 4)) { // Limit to 4 moods for performance
        const moodParams = generateRecommendationParams(profile, mood.name)
        const moodResponse = await fetch(
          `https://api.spotify.com/v1/recommendations?${new URLSearchParams({
            seed_artists: topArtists.slice(0, 2).map(a => a.id).join(',') || '',
            ...Object.fromEntries(Object.entries(moodParams).map(([k, v]) => [k, String(v)]))
          })}`,
          {
            headers: { Authorization: `Bearer ${(session as any)?.accessToken}` }
          }
        )
        const moodData = await moodResponse.json()
        moodRecs[mood.name] = await enhanceTracksWithAnalysis(moodData.tracks?.slice(0, 6) || [])
      }
      setMoodRecommendations(moodRecs)
      
    } catch (error) {
      console.error('Error generating enhanced recommendations:', error)
    } finally {
      setLoadingRecommendations(false)
    }
  }
  
  const enhanceTracksWithAnalysis = async (tracks: SpotifyTrack[]): Promise<EnhancedTrack[]> => {
    if (tracks.length === 0) return []
    
    try {
      const trackIds = tracks.map(t => t.id).join(',')
      const featuresResponse = await fetch(
        `https://api.spotify.com/v1/audio-features?ids=${trackIds}`,
        {
          headers: { Authorization: `Bearer ${(session as any)?.accessToken}` }
        }
      )
      const featuresData = await featuresResponse.json()
      const audioFeatures = featuresData.audio_features || []
      
      return tracks.map((track, index) => {
        const features = audioFeatures[index]
        const analysis = features ? analyzeTrackDetails(features) : undefined
        return {
          ...track,
          audioFeatures: features,
          analysis
        }
      })
    } catch (error) {
      console.error('Error enhancing tracks:', error)
      return tracks.map(track => ({ ...track }))
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

      {/* User Music Profile */}
      {userProfile && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem' }}>
            🎵 あなたの音楽プロフィール
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            <div style={{ textAlign: 'center', padding: '1rem', background: 'var(--light-gray)', borderRadius: '12px' }}>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--neon-pink)' }}>
                {Math.round(userProfile.avgEnergy * 100)}%
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--dark-gray)' }}>平均エネルギー</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--dark-gray)', marginTop: '0.5rem' }}>
                {userProfile.avgEnergy > 0.7 ? '🔥 ハイエナジー好き' : 
                 userProfile.avgEnergy > 0.4 ? '⚡ バランス型' : '🌊 落ち着いた音楽好き'}
              </div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem', background: 'var(--light-gray)', borderRadius: '12px' }}>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--mint-green)' }}>
                {Math.round(userProfile.avgDanceability * 100)}%
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--dark-gray)' }}>ダンス度</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--dark-gray)', marginTop: '0.5rem' }}>
                {userProfile.avgDanceability > 0.7 ? '💃 ダンサブル' : 
                 userProfile.avgDanceability > 0.4 ? '🎵 リズミカル' : '🎼 メロディ重視'}
              </div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem', background: 'var(--light-gray)', borderRadius: '12px' }}>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--sunset-orange)' }}>
                {Math.round(userProfile.avgValence * 100)}%
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--dark-gray)' }}>ポジティブ度</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--dark-gray)', marginTop: '0.5rem' }}>
                {userProfile.avgValence > 0.7 ? '😊 明るい音楽好き' : 
                 userProfile.avgValence > 0.4 ? '🎭 バランス型' : '🌙 深い音楽好き'}
              </div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem', background: 'var(--light-gray)', borderRadius: '12px' }}>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--ocean-blue)' }}>
                {Math.round(userProfile.avgTempo)} BPM
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--dark-gray)' }}>好みのテンポ</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--dark-gray)', marginTop: '0.5rem' }}>
                {userProfile.avgTempo > 140 ? '🏃 アップテンポ好き' : 
                 userProfile.avgTempo > 100 ? '🚶 ミディアムテンポ好き' : '🐌 スローテンポ好き'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mood-based Recommendations */}
      {Object.keys(moodRecommendations).length > 0 && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem' }}>
            🎭 気分別おすすめ
          </h2>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
            {MOOD_CATEGORIES.filter(mood => moodRecommendations[mood.name]?.length > 0).map((mood) => (
              <button
                key={mood.name}
                onClick={() => setSelectedMood(selectedMood === mood.name ? null : mood.name)}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '20px',
                  border: 'none',
                  background: selectedMood === mood.name ? mood.color : 'var(--light-gray)',
                  color: selectedMood === mood.name ? 'white' : 'var(--charcoal)',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <span>{mood.emoji}</span>
                {mood.name}
              </button>
            ))}
          </div>
          
          {selectedMood && moodRecommendations[selectedMood] && (
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
                {MOOD_CATEGORIES.find(m => m.name === selectedMood)?.emoji} {selectedMood}な楽曲
              </h3>
              <p style={{ color: 'var(--dark-gray)', marginBottom: '1.5rem' }}>
                {MOOD_CATEGORIES.find(m => m.name === selectedMood)?.description}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                {moodRecommendations[selectedMood].map((track) => (
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
                        marginBottom: '0.5rem'
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
                        {track.popularity}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
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
            <p style={{ marginTop: '1rem', color: 'var(--dark-gray)' }}>高度な分析でおすすめを生成中...</p>
          </div>
        </div>
      )}

      {recommendations.length > 0 && (
        <div className="card">
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem' }}>
            🎯 AI分析によるおすすめ
          </h2>
          <p style={{ color: 'var(--dark-gray)', marginBottom: '2rem' }}>
            あなたの音楽プロフィールに基づいて厳選された楽曲
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
                  cursor: 'pointer',
                  position: 'relative'
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
                
                {/* Audio Features Indicators */}
                {track.audioFeatures && (
                  <div style={{ 
                    display: 'flex', 
                    gap: '0.5rem', 
                    marginBottom: '0.5rem',
                    flexWrap: 'wrap'
                  }}>
                    {track.audioFeatures.energy > 0.7 && (
                      <span style={{ 
                        fontSize: '0.7rem', 
                        padding: '0.2rem 0.5rem', 
                        background: 'var(--neon-pink)', 
                        color: 'white', 
                        borderRadius: '8px' 
                      }}>
                        🔥 エネルギッシュ
                      </span>
                    )}
                    {track.audioFeatures.danceability > 0.7 && (
                      <span style={{ 
                        fontSize: '0.7rem', 
                        padding: '0.2rem 0.5rem', 
                        background: 'var(--electric-purple)', 
                        color: 'white', 
                        borderRadius: '8px' 
                      }}>
                        💃 ダンサブル
                      </span>
                    )}
                    {track.audioFeatures.valence > 0.7 && (
                      <span style={{ 
                        fontSize: '0.7rem', 
                        padding: '0.2rem 0.5rem', 
                        background: 'var(--sunset-orange)', 
                        color: 'white', 
                        borderRadius: '8px' 
                      }}>
                        😊 ハッピー
                      </span>
                    )}
                  </div>
                )}
                
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
                    marginBottom: '0.5rem'
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