"use client"

import { useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { calculateSimilarity, calculateMusicProfile } from '@/lib/musicAnalysis'

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

interface AudioFeatures {
  danceability: number
  energy: number
  acousticness: number
  valence: number
  tempo: number
  loudness: number
  speechiness: number
  instrumentalness: number
  key: number
  mode: number
  time_signature: number
}

export default function AnalyzePage() {
  const { data: session } = useSession()
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SpotifyTrack[]>([])
  const [selectedTrack, setSelectedTrack] = useState<SpotifyTrack | null>(null)
  const [audioFeatures, setAudioFeatures] = useState<AudioFeatures | null>(null)
  const [comparisonTrack, setComparisonTrack] = useState<SpotifyTrack | null>(null)
  const [comparisonFeatures, setComparisonFeatures] = useState<AudioFeatures | null>(null)
  const [similarity, setSimilarity] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [comparingMode, setComparingMode] = useState(false)

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

  const analyzeTrack = useCallback(async (track: SpotifyTrack) => {
    if (!(session as any)?.accessToken) return

    if (comparingMode && selectedTrack) {
      // 比較モードの場合、2番目の楽曲として設定
      setComparisonTrack(track)
      setAnalyzing(true)
      try {
        const response = await fetch(
          `https://api.spotify.com/v1/audio-features/${track.id}`,
          {
            headers: {
              Authorization: `Bearer ${(session as any)?.accessToken}`,
            },
          }
        )
        const features = await response.json()
        setComparisonFeatures(features)
        
        // 類似度を計算
        if (audioFeatures && features) {
          const profile1 = calculateMusicProfile([audioFeatures])
          const profile2 = calculateMusicProfile([features])
          const similarityScore = calculateSimilarity(profile1, profile2)
          setSimilarity(similarityScore)
        }
        
        setComparingMode(false)
      } catch (error) {
        console.error('Error fetching comparison audio features:', error)
      } finally {
        setAnalyzing(false)
      }
    } else {
      // 通常モード
      setSelectedTrack(track)
      setAnalyzing(true)
      try {
        const response = await fetch(
          `https://api.spotify.com/v1/audio-features/${track.id}`,
          {
            headers: {
              Authorization: `Bearer ${(session as any)?.accessToken}`,
            },
          }
        )
        const features = await response.json()
        setAudioFeatures(features)
        
        // 比較データをクリア
        setComparisonTrack(null)
        setComparisonFeatures(null)
        setSimilarity(null)
      } catch (error) {
        console.error('Error fetching audio features:', error)
      } finally {
        setAnalyzing(false)
      }
    }
  }, [session, comparingMode, selectedTrack, audioFeatures])

  const startComparison = () => {
    setComparingMode(true)
  }

  const clearComparison = () => {
    setComparisonTrack(null)
    setComparisonFeatures(null)
    setSimilarity(null)
    setComparingMode(false)
  }

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

  const getKeyName = (key: number) => {
    const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    return keys[key] || '不明'
  }

  const getModeName = (mode: number) => {
    return mode === 1 ? 'メジャー' : 'マイナー'
  }

  return (
    <>
      <h1 className="page-title">楽曲分析</h1>
      <p className="page-subtitle">楽曲やアーティストを検索して、音楽的特徴を詳しく分析します。</p>
      
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
                  transition: 'all 0.3s ease'
                }}
                onClick={() => analyzeTrack(track)}
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
                  人気度 {track.popularity}
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
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                {selectedTrack.name}
              </h3>
              <p style={{ color: 'var(--dark-gray)', marginBottom: '0.5rem' }}>
                {selectedTrack.artists.map(artist => artist.name).join(', ')}
              </p>
              <a 
                href={selectedTrack.external_urls.spotify}
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
                Spotifyで聴く
              </a>
            </div>
          </div>
          
          {/* Comparison Controls */}
          <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--light-gray)', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>楽曲比較</h3>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              {!comparisonTrack && (
                <button
                  onClick={startComparison}
                  disabled={comparingMode}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: comparingMode ? 'var(--sunset-orange)' : 'var(--electric-purple)',
                    color: 'white',
                    fontWeight: '600',
                    cursor: comparingMode ? 'default' : 'pointer',
                    fontSize: '0.875rem'
                  }}
                >
                  {comparingMode ? '比較楽曲を選択してください...' : '別の楽曲と比較'}
                </button>
              )}
              {comparisonTrack && (
                <button
                  onClick={clearComparison}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'var(--dark-gray)',
                    color: 'white',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}
                >
                  比較をクリア
                </button>
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
            <p style={{ marginTop: '1rem', color: 'var(--dark-gray)' }}>楽曲を分析中...</p>
          </div>
        </div>
      )}

      {/* Comparison Results */}
      {comparisonTrack && comparisonFeatures && similarity !== null && (
        <div className="card">
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem' }}>
            🎭 楽曲比較結果
          </h2>
          
          {/* Similarity Score */}
          <div style={{ 
            textAlign: 'center', 
            marginBottom: '2rem',
            padding: '1.5rem',
            background: 'var(--light-gray)',
            borderRadius: '12px'
          }}>
            <div style={{ fontSize: '3rem', fontWeight: '700', color: 'var(--electric-purple)' }}>
              {Math.round(similarity * 100)}%
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
              類似度
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--dark-gray)' }}>
              {similarity > 0.8 ? '🎯 極めて類似した楽曲です' : 
               similarity > 0.6 ? '🔥 とても似ている楽曲です' : 
               similarity > 0.4 ? '✨ やや似ている楽曲です' : 
               '🌟 異なる特徴を持つ楽曲です'}
            </div>
          </div>

          {/* Comparison Chart */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '2rem', alignItems: 'center' }}>
            {/* Track 1 */}
            <div style={{ textAlign: 'center' }}>
              {selectedTrack?.album.images[0] && (
                <img 
                  src={selectedTrack.album.images[0].url}
                  alt={selectedTrack.album.name}
                  style={{ width: '80px', height: '80px', borderRadius: '12px', margin: '0 auto 1rem' }}
                />
              )}
              <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                {selectedTrack?.name}
              </h3>
              <p style={{ color: 'var(--dark-gray)', fontSize: '0.875rem' }}>
                {selectedTrack?.artists.map(artist => artist.name).join(', ')}
              </p>
            </div>

            {/* VS */}
            <div style={{ 
              fontSize: '2rem', 
              fontWeight: '700', 
              color: 'var(--electric-purple)',
              textAlign: 'center'
            }}>
              VS
            </div>

            {/* Track 2 */}
            <div style={{ textAlign: 'center' }}>
              {comparisonTrack.album.images[0] && (
                <img 
                  src={comparisonTrack.album.images[0].url}
                  alt={comparisonTrack.album.name}
                  style={{ width: '80px', height: '80px', borderRadius: '12px', margin: '0 auto 1rem' }}
                />
              )}
              <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                {comparisonTrack.name}
              </h3>
              <p style={{ color: 'var(--dark-gray)', fontSize: '0.875rem' }}>
                {comparisonTrack.artists.map(artist => artist.name).join(', ')}
              </p>
            </div>
          </div>

          {/* Feature Comparison */}
          <div style={{ marginTop: '2rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>特徴比較</h3>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {[
                { key: 'energy', label: 'エネルギー', color: 'var(--neon-pink)' },
                { key: 'danceability', label: 'ダンス適性', color: 'var(--electric-purple)' },
                { key: 'valence', label: 'ポジティブ度', color: 'var(--sunset-orange)' },
                { key: 'acousticness', label: 'アコースティック度', color: 'var(--ocean-blue)' }
              ].map(feature => {
                const value1 = audioFeatures![feature.key as keyof AudioFeatures] as number
                const value2 = comparisonFeatures![feature.key as keyof AudioFeatures] as number
                const diff = Math.abs(value1 - value2)
                
                return (
                  <div key={feature.key} style={{ marginBottom: '1rem' }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: '0.5rem'
                    }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>
                        {feature.label}
                      </span>
                      <span style={{ 
                        fontSize: '0.75rem', 
                        color: diff < 0.2 ? 'var(--mint-green)' : diff < 0.4 ? 'var(--sunset-orange)' : 'var(--neon-pink)',
                        fontWeight: '600'
                      }}>
                        {diff < 0.2 ? '似ている' : diff < 0.4 ? 'やや異なる' : '大きく異なる'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <div style={{ flex: 1, background: 'var(--light-gray)', borderRadius: '4px', height: '8px', position: 'relative' }}>
                        <div style={{ 
                          width: `${value1 * 100}%`, 
                          height: '100%', 
                          background: feature.color, 
                          borderRadius: '4px' 
                        }} />
                      </div>
                      <span style={{ fontSize: '0.75rem', minWidth: '3rem', textAlign: 'center' }}>
                        {Math.round(value1 * 100)}%
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.25rem' }}>
                      <div style={{ flex: 1, background: 'var(--light-gray)', borderRadius: '4px', height: '8px', position: 'relative' }}>
                        <div style={{ 
                          width: `${value2 * 100}%`, 
                          height: '100%', 
                          background: `${feature.color}80`, 
                          borderRadius: '4px' 
                        }} />
                      </div>
                      <span style={{ fontSize: '0.75rem', minWidth: '3rem', textAlign: 'center' }}>
                        {Math.round(value2 * 100)}%
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
      
      {audioFeatures && (
        <div className="card">
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '2rem' }}>音楽的特徴</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>感情・エネルギー</h3>
              <div className="progress-item">
                <div className="progress-header">
                  <span className="progress-label">エネルギー</span>
                  <span className="progress-value">{Math.round(audioFeatures.energy * 100)}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${audioFeatures.energy * 100}%` }}></div>
                </div>
              </div>
              <div className="progress-item">
                <div className="progress-header">
                  <span className="progress-label">ポジティブ度</span>
                  <span className="progress-value">{Math.round(audioFeatures.valence * 100)}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${audioFeatures.valence * 100}%` }}></div>
                </div>
              </div>
              <div className="progress-item">
                <div className="progress-header">
                  <span className="progress-label">ダンス適性</span>
                  <span className="progress-value">{Math.round(audioFeatures.danceability * 100)}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${audioFeatures.danceability * 100}%` }}></div>
                </div>
              </div>
            </div>

            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>音響特性</h3>
              <div className="progress-item">
                <div className="progress-header">
                  <span className="progress-label">アコースティック度</span>
                  <span className="progress-value">{Math.round(audioFeatures.acousticness * 100)}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${audioFeatures.acousticness * 100}%` }}></div>
                </div>
              </div>
              <div className="progress-item">
                <div className="progress-header">
                  <span className="progress-label">インストゥルメンタル度</span>
                  <span className="progress-value">{Math.round(audioFeatures.instrumentalness * 100)}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${audioFeatures.instrumentalness * 100}%` }}></div>
                </div>
              </div>
              <div className="progress-item">
                <div className="progress-header">
                  <span className="progress-label">スピーチ度</span>
                  <span className="progress-value">{Math.round(audioFeatures.speechiness * 100)}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${audioFeatures.speechiness * 100}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '1rem',
            padding: '1.5rem',
            background: 'var(--light-gray)',
            borderRadius: '12px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--electric-purple)' }}>
                {Math.round(audioFeatures.tempo)} BPM
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--dark-gray)' }}>テンポ</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--electric-purple)' }}>
                {getKeyName(audioFeatures.key)}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--dark-gray)' }}>キー</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--electric-purple)' }}>
                {getModeName(audioFeatures.mode)}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--dark-gray)' }}>モード</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--electric-purple)' }}>
                {audioFeatures.time_signature}/4
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--dark-gray)' }}>拍子</div>
            </div>
          </div>
        </div>
      )}

      {!session && (
        <div className="card">
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
              楽曲分析を利用するにはログインが必要です
            </h3>
            <p style={{ color: 'var(--dark-gray)' }}>
              Spotifyアカウントでログインして、詳細な楽曲分析をお楽しみください。
            </p>
          </div>
        </div>
      )}
    </>
  )
}