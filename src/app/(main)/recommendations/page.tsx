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
  const [recommendedArtists, setRecommendedArtists] = useState<TopArtist[]>([])
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
      
      // Generate genre-based recommendations
      const moodRecs: {[key: string]: EnhancedTrack[]} = {}
      for (const genre of MOOD_CATEGORIES.slice(0, 4)) { // Limit to 4 genres for performance
        const genreParams = generateRecommendationParams(profile, genre.name)
        const genreResponse = await fetch(
          `https://api.spotify.com/v1/recommendations?${new URLSearchParams({
            seed_artists: topArtists.slice(0, 2).map(a => a.id).join(',') || '',
            ...Object.fromEntries(Object.entries(genreParams).map(([k, v]) => [k, String(v)]))
          })}`,
          {
            headers: { Authorization: `Bearer ${(session as any)?.accessToken}` }
          }
        )
        const genreData = await genreResponse.json()
        moodRecs[genre.name] = await enhanceTracksWithAnalysis(genreData.tracks?.slice(0, 6) || [])
      }
      setMoodRecommendations(moodRecs)
      
      // Generate recommended artists based on user profile
      await generateRecommendedArtists(profile, topArtists)
      
    } catch (error) {
      console.error('Error generating enhanced recommendations:', error)
    } finally {
      setLoadingRecommendations(false)
    }
  }
  
  const generateRecommendedArtists = async (profile: MusicProfile, userTopArtists: TopArtist[]) => {
    try {
      // Get artist genres for seed
      const seedGenres = userTopArtists.flatMap(artist => artist.genres).slice(0, 3)
      const seedArtists = userTopArtists.slice(0, 2).map(a => a.id).join(',')
      
      // Use Spotify's recommendations endpoint to find similar artists
      const params = generateRecommendationParams(profile)
      const response = await fetch(
        `https://api.spotify.com/v1/recommendations?${new URLSearchParams({
          seed_artists: seedArtists,
          seed_genres: seedGenres.slice(0, 2).join(',') || '',
          ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
          limit: '20'
        })}`,
        {
          headers: { Authorization: `Bearer ${(session as any)?.accessToken}` }
        }
      )
      
      const data = await response.json()
      const tracks = data.tracks || []
      
      // Extract unique artists from recommended tracks
      const artistIds = new Set<string>()
      const artistsMap = new Map<string, any>()
      
      tracks.forEach((track: any) => {
        track.artists?.forEach((artist: any) => {
          if (!artistIds.has(artist.id) && !userTopArtists.some(topArtist => topArtist.id === artist.id)) {
            artistIds.add(artist.id)
            artistsMap.set(artist.id, {
              id: artist.id,
              name: artist.name,
              external_urls: artist.external_urls
            })
          }
        })
      })
      
      // Get detailed artist information for the first 6 artists
      const artistIdsArray = Array.from(artistIds).slice(0, 6)
      if (artistIdsArray.length > 0) {
        const artistsResponse = await fetch(
          `https://api.spotify.com/v1/artists?ids=${artistIdsArray.join(',')}`,
          {
            headers: { Authorization: `Bearer ${(session as any)?.accessToken}` }
          }
        )
        const artistsData = await artistsResponse.json()
        
        const detailedArtists = artistsData.artists?.map((artist: any) => ({
          id: artist.id,
          name: artist.name,
          genres: artist.genres || [],
          images: artist.images || [],
          popularity: artist.popularity || 0,
          external_urls: artist.external_urls,
          followers: artist.followers
        })) || []
        
        setRecommendedArtists(detailedArtists)
      }
    } catch (error) {
      console.error('Error generating recommended artists:', error)
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


      {/* Recent Music Analysis */}
      {userProfile && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem' }}>
            🎧 直近の音楽分析
          </h2>
          <p style={{ color: 'var(--dark-gray)', marginBottom: '2rem' }}>
            {getTimeRangeLabel(timeRange)}の聴取データから、あなたの音楽傾向を分析しました
          </p>
          
          {/* Music Analysis Summary */}
          <div style={{ 
            padding: '1.5rem',
            background: 'var(--light-gray)',
            borderRadius: '12px',
            marginBottom: '2rem'
          }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>🎵 音楽傾向サマリー</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--neon-pink)', marginBottom: '0.5rem' }}>
                  {userProfile.avgEnergy > 0.7 ? '🔥' : userProfile.avgEnergy > 0.4 ? '⚡' : '🌊'}
                </div>
                <div style={{ fontSize: '0.875rem', fontWeight: '600' }}>
                  {userProfile.avgEnergy > 0.7 ? 'パワフル好き' : 
                   userProfile.avgEnergy > 0.4 ? 'バランス型' : '落ち着いた音楽好き'}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--mint-green)', marginBottom: '0.5rem' }}>
                  {userProfile.avgDanceability > 0.7 ? '💃' : userProfile.avgDanceability > 0.4 ? '🎵' : '🎼'}
                </div>
                <div style={{ fontSize: '0.875rem', fontWeight: '600' }}>
                  {userProfile.avgDanceability > 0.7 ? '踊りやすい音楽好き' : 
                   userProfile.avgDanceability > 0.4 ? 'リズミカル好き' : 'メロディ重視'}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--sunset-orange)', marginBottom: '0.5rem' }}>
                  {userProfile.avgValence > 0.7 ? '😊' : userProfile.avgValence > 0.4 ? '🎭' : '🌙'}
                </div>
                <div style={{ fontSize: '0.875rem', fontWeight: '600' }}>
                  {userProfile.avgValence > 0.7 ? '明るい音楽好き' : 
                   userProfile.avgValence > 0.4 ? 'バランス型' : '深い音楽好き'}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--ocean-blue)', marginBottom: '0.5rem' }}>
                  {userProfile.avgTempo > 140 ? '🏃' : userProfile.avgTempo > 100 ? '🚶' : '🐌'}
                </div>
                <div style={{ fontSize: '0.875rem', fontWeight: '600' }}>
                  {userProfile.avgTempo > 140 ? 'アップテンポ好き' : 
                   userProfile.avgTempo > 100 ? 'ミディアムテンポ好き' : 'スローテンポ好き'}
                </div>
              </div>
            </div>
          </div>
          
          {/* Recommended Artists Section */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
              🎤 おすすめアーティスト
            </h3>
            <p style={{ color: 'var(--dark-gray)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
              あなたの音楽傾向に基づいて、新しく発見できそうなアーティストを提案します
            </p>
            
            {loadingRecommendations ? (
              <div style={{ 
                padding: '2rem',
                background: 'var(--light-gray)',
                borderRadius: '12px',
                textAlign: 'center'
              }}>
                <div className="loading-dots">
                  <div className="dot"></div>
                  <div className="dot"></div>
                  <div className="dot"></div>
                </div>
                <p style={{ marginTop: '1rem', color: 'var(--dark-gray)' }}>アーティストを発見中...</p>
              </div>
            ) : recommendedArtists.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                {recommendedArtists.map((artist) => (
                  <div 
                    key={artist.id}
                    style={{
                      padding: '1.5rem',
                      borderRadius: '12px',
                      background: 'var(--light-gray)',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onClick={() => window.open(`https://open.spotify.com/artist/${artist.id}`, '_blank')}
                  >
                    {artist.images[0] && (
                      <img 
                        src={artist.images[0].url}
                        alt={artist.name}
                        style={{ 
                          width: '100px', 
                          height: '100px', 
                          borderRadius: '50%', 
                          objectFit: 'cover',
                          margin: '0 auto 1rem'
                        }}
                      />
                    )}
                    <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                      {artist.name}
                    </h4>
                    <p style={{ color: 'var(--dark-gray)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                      {artist.genres.slice(0, 2).join(', ') || 'アーティスト'}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ 
                        padding: '0.25rem 0.75rem', 
                        borderRadius: '12px', 
                        background: 'var(--premium-gradient)',
                        color: 'white',
                        fontSize: '0.75rem',
                        fontWeight: '600'
                      }}>
                        人気度 {artist.popularity}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--dark-gray)' }}>
                        {artist.followers ? `${Math.round(artist.followers.total / 1000)}K` : ''} フォロワー
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ 
                padding: '1.5rem',
                background: 'var(--light-gray)',
                borderRadius: '12px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔍</div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                  アーティスト発見機能
                </h4>
                <p style={{ color: 'var(--dark-gray)', fontSize: '0.875rem' }}>
                  あなたの聴取パターンを分析して、お気に入りになりそうな新しいアーティストを見つけます
                </p>
              </div>
            )}
          </div>
          
          {/* Recommended Tracks Section */}
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
              🎯 おすすめ楽曲
            </h3>
            <p style={{ color: 'var(--dark-gray)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
              直近の聴取履歴から、次に気に入りそうな楽曲をピックアップ
            </p>
            
            {loadingRecommendations ? (
              <div style={{ 
                padding: '2rem',
                background: 'var(--light-gray)',
                borderRadius: '12px',
                textAlign: 'center'
              }}>
                <div className="loading-dots">
                  <div className="dot"></div>
                  <div className="dot"></div>
                  <div className="dot"></div>
                </div>
                <p style={{ marginTop: '1rem', color: 'var(--dark-gray)' }}>楽曲を分析中...</p>
              </div>
            ) : recommendations.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                {recommendations.slice(0, 6).map((track, index) => (
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
                    
                    <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                      {track.name}
                    </h4>
                    <p style={{ color: 'var(--dark-gray)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                      {track.artists.map(artist => artist.name).join(', ')}
                    </p>
                    
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
                        人気度 {track.popularity}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ 
                padding: '1.5rem',
                background: 'var(--light-gray)',
                borderRadius: '12px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🎵</div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                  パーソナライズド楽曲推薦
                </h4>
                <p style={{ color: 'var(--dark-gray)', fontSize: '0.875rem' }}>
                  AI分析により、あなたの音楽的好みに完璧にマッチした楽曲を発見します
                </p>
              </div>
            )}
          </div>
        </div>
      )}

    </>
  )
}