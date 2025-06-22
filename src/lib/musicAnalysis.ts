// 音楽分析とおすすめシステムのヘルパー関数

export interface AudioFeatures {
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

export interface MusicProfile {
  avgDanceability: number
  avgEnergy: number
  avgAcousticness: number
  avgValence: number
  avgTempo: number
  avgLoudness: number
  preferredKeys: number[]
  preferredModes: number[]
  genrePreferences: string[]
  timeSignaturePreferences: number[]
}

export interface MoodCategory {
  name: string
  description: string
  criteria: {
    energy: [number, number]
    valence: [number, number]
    danceability?: [number, number]
    acousticness?: [number, number]
  }
  color: string
  emoji: string
}

// 音楽の気分カテゴリー定義
export const MOOD_CATEGORIES: MoodCategory[] = [
  {
    name: 'エネルギッシュ',
    description: 'ハイテンポで元気な楽曲',
    criteria: { energy: [0.7, 1.0], valence: [0.6, 1.0], danceability: [0.6, 1.0] },
    color: 'var(--neon-pink)',
    emoji: '🔥'
  },
  {
    name: 'ハッピー',
    description: '明るく楽しい気分の楽曲',
    criteria: { energy: [0.4, 0.8], valence: [0.7, 1.0] },
    color: 'var(--sunset-orange)',
    emoji: '😊'
  },
  {
    name: 'リラックス',
    description: 'ゆったりと落ち着いた楽曲',
    criteria: { energy: [0.0, 0.5], valence: [0.3, 0.7], acousticness: [0.3, 1.0] },
    color: 'var(--mint-green)',
    emoji: '🌊'
  },
  {
    name: 'メランコリック',
    description: '物思いにふけるような楽曲',
    criteria: { energy: [0.0, 0.6], valence: [0.0, 0.4] },
    color: 'var(--ocean-blue)',
    emoji: '🌙'
  },
  {
    name: 'ダンス',
    description: '踊りたくなるような楽曲',
    criteria: { energy: [0.6, 1.0], danceability: [0.7, 1.0], valence: [0.5, 1.0] },
    color: 'var(--electric-purple)',
    emoji: '💃'
  },
  {
    name: 'フォーカス',
    description: '集中したい時の楽曲',
    criteria: { energy: [0.2, 0.7], valence: [0.3, 0.8], instrumentalness: [0.5, 1.0] },
    color: 'var(--premium-gradient)',
    emoji: '🎯'
  }
]

// 音楽プロフィールを計算
export function calculateMusicProfile(audioFeatures: AudioFeatures[]): MusicProfile {
  if (audioFeatures.length === 0) {
    return {
      avgDanceability: 0,
      avgEnergy: 0,
      avgAcousticness: 0,
      avgValence: 0,
      avgTempo: 0,
      avgLoudness: 0,
      preferredKeys: [],
      preferredModes: [],
      genrePreferences: [],
      timeSignaturePreferences: []
    }
  }

  const profile: MusicProfile = {
    avgDanceability: average(audioFeatures.map(f => f.danceability)),
    avgEnergy: average(audioFeatures.map(f => f.energy)),
    avgAcousticness: average(audioFeatures.map(f => f.acousticness)),
    avgValence: average(audioFeatures.map(f => f.valence)),
    avgTempo: average(audioFeatures.map(f => f.tempo)),
    avgLoudness: average(audioFeatures.map(f => f.loudness)),
    preferredKeys: getMostFrequent(audioFeatures.map(f => f.key)),
    preferredModes: getMostFrequent(audioFeatures.map(f => f.mode)),
    genrePreferences: [],
    timeSignaturePreferences: getMostFrequent(audioFeatures.map(f => f.time_signature))
  }

  return profile
}

// 楽曲を気分カテゴリーに分類
export function categorizeMood(features: AudioFeatures): MoodCategory | null {
  for (const category of MOOD_CATEGORIES) {
    const { criteria } = category
    
    if (isInRange(features.energy, criteria.energy) &&
        isInRange(features.valence, criteria.valence) &&
        (!criteria.danceability || isInRange(features.danceability, criteria.danceability)) &&
        (!criteria.acousticness || isInRange(features.acousticness, criteria.acousticness))) {
      return category
    }
  }
  
  return null
}

// 2つの音楽プロフィール間の類似度を計算 (0-1)
export function calculateSimilarity(profile1: MusicProfile, profile2: MusicProfile): number {
  const weights = {
    danceability: 0.2,
    energy: 0.2,
    valence: 0.2,
    acousticness: 0.15,
    tempo: 0.1,
    loudness: 0.05,
    key: 0.05,
    mode: 0.03
  }

  let similarity = 0
  
  // 数値特徴の類似度
  similarity += (1 - Math.abs(profile1.avgDanceability - profile2.avgDanceability)) * weights.danceability
  similarity += (1 - Math.abs(profile1.avgEnergy - profile2.avgEnergy)) * weights.energy
  similarity += (1 - Math.abs(profile1.avgValence - profile2.avgValence)) * weights.valence
  similarity += (1 - Math.abs(profile1.avgAcousticness - profile2.avgAcousticness)) * weights.acousticness
  
  // テンポの類似度 (正規化)
  const tempoDiff = Math.abs(profile1.avgTempo - profile2.avgTempo) / 200 // 200 BPMで正規化
  similarity += Math.max(0, 1 - tempoDiff) * weights.tempo
  
  // ラウドネスの類似度
  const loudnessDiff = Math.abs(profile1.avgLoudness - profile2.avgLoudness) / 60 // 60dBで正規化
  similarity += Math.max(0, 1 - loudnessDiff) * weights.loudness

  return Math.max(0, Math.min(1, similarity))
}

// 音楽的特徴に基づくおすすめパラメータを生成
export function generateRecommendationParams(profile: MusicProfile, moodBoost?: string): any {
  const params: any = {
    target_danceability: profile.avgDanceability,
    target_energy: profile.avgEnergy,
    target_valence: profile.avgValence,
    target_acousticness: profile.avgAcousticness,
    target_tempo: Math.round(profile.avgTempo),
    target_loudness: Math.round(profile.avgLoudness),
    limit: 20
  }

  // 気分に応じた調整
  if (moodBoost) {
    const mood = MOOD_CATEGORIES.find(m => m.name === moodBoost)
    if (mood) {
      params.target_energy = (mood.criteria.energy[0] + mood.criteria.energy[1]) / 2
      params.target_valence = (mood.criteria.valence[0] + mood.criteria.valence[1]) / 2
      if (mood.criteria.danceability) {
        params.target_danceability = (mood.criteria.danceability[0] + mood.criteria.danceability[1]) / 2
      }
      if (mood.criteria.acousticness) {
        params.target_acousticness = (mood.criteria.acousticness[0] + mood.criteria.acousticness[1]) / 2
      }
    }
  }

  // 範囲を制限してバラエティを追加
  params.min_energy = Math.max(0, params.target_energy - 0.2)
  params.max_energy = Math.min(1, params.target_energy + 0.2)
  params.min_valence = Math.max(0, params.target_valence - 0.2)
  params.max_valence = Math.min(1, params.target_valence + 0.2)

  return params
}

// 楽曲の詳細分析
export function analyzeTrackDetails(features: AudioFeatures) {
  return {
    mood: categorizeMood(features),
    characteristics: {
      danceFloor: features.danceability > 0.7 ? 'ダンスフロア向き' : features.danceability > 0.4 ? '軽やかなリズム' : 'ゆったりしたテンポ',
      energy: features.energy > 0.7 ? 'ハイエナジー' : features.energy > 0.4 ? 'ミディアムエナジー' : 'ローエナジー',
      emotion: features.valence > 0.7 ? 'ポジティブ' : features.valence > 0.4 ? 'ニュートラル' : 'メランコリック',
      acoustic: features.acousticness > 0.7 ? 'アコースティック' : features.acousticness > 0.3 ? 'ハイブリッド' : '電子音楽',
      vocal: features.speechiness > 0.66 ? 'スピーチライク' : features.speechiness > 0.33 ? 'ラップ/トーク' : '楽器中心',
      instrumental: features.instrumentalness > 0.5 ? 'インストゥルメンタル' : 'ボーカル中心'
    },
    technical: {
      key: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'][features.key] || '不明',
      mode: features.mode === 1 ? 'メジャー' : 'マイナー',
      timeSignature: `${features.time_signature}/4`,
      tempo: `${Math.round(features.tempo)} BPM`,
      loudness: `${Math.round(features.loudness)} dB`
    }
  }
}

// ヘルパー関数
function average(numbers: number[]): number {
  return numbers.reduce((sum, num) => sum + num, 0) / numbers.length
}

function getMostFrequent<T>(array: T[]): T[] {
  const frequency: { [key: string]: number } = {}
  array.forEach(item => {
    const key = String(item)
    frequency[key] = (frequency[key] || 0) + 1
  })
  
  const maxFreq = Math.max(...Object.values(frequency))
  return Object.keys(frequency)
    .filter(key => frequency[key] === maxFreq)
    .map(key => array.find(item => String(item) === key)!)
    .filter(Boolean)
}

function isInRange(value: number, range: [number, number]): boolean {
  return value >= range[0] && value <= range[1]
}