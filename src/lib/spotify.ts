import { getServerSession } from "next-auth/next"
import { authOptions } from "./auth"
import { SpotifyTrack, AudioFeatures, SpotifySearchResponse, SpotifyPlaylist, RecommendationSeed } from "@/types"

const SPOTIFY_BASE_URL = "https://api.spotify.com/v1"

async function getAccessToken() {
  const session = await getServerSession(authOptions)
  if (!session?.accessToken) {
    throw new Error("No access token available")
  }
  return session.accessToken as string
}

async function spotifyFetch(endpoint: string, accessToken?: string) {
  const token = accessToken || await getAccessToken()
  
  const response = await fetch(`${SPOTIFY_BASE_URL}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Spotify API error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

export async function searchTracks(query: string, limit = 20): Promise<SpotifySearchResponse> {
  return spotifyFetch(`/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}`)
}

export async function getTrack(id: string): Promise<SpotifyTrack> {
  return spotifyFetch(`/tracks/${id}`)
}

export async function getAudioFeatures(id: string): Promise<AudioFeatures> {
  return spotifyFetch(`/audio-features/${id}`)
}

export async function getMultipleAudioFeatures(ids: string[]): Promise<{ audio_features: AudioFeatures[] }> {
  const idsParam = ids.join(',')
  return spotifyFetch(`/audio-features?ids=${idsParam}`)
}

export async function getRecommendations(seed: RecommendationSeed, limit = 20): Promise<{ tracks: SpotifyTrack[] }> {
  const params = new URLSearchParams()
  
  if (seed.seed_artists?.length) params.append('seed_artists', seed.seed_artists.join(','))
  if (seed.seed_tracks?.length) params.append('seed_tracks', seed.seed_tracks.join(','))
  if (seed.seed_genres?.length) params.append('seed_genres', seed.seed_genres.join(','))
  
  Object.entries(seed).forEach(([key, value]) => {
    if (key.startsWith('target_') && value !== undefined) {
      params.append(key, value.toString())
    }
  })
  
  params.append('limit', limit.toString())
  
  return spotifyFetch(`/recommendations?${params}`)
}

export async function getUserPlaylists(): Promise<{ items: SpotifyPlaylist[] }> {
  return spotifyFetch('/me/playlists')
}

export async function getPlaylist(id: string): Promise<SpotifyPlaylist> {
  return spotifyFetch(`/playlists/${id}`)
}

export async function createPlaylist(name: string, description?: string, isPublic = false): Promise<SpotifyPlaylist> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.name) {
    throw new Error("No user session available")
  }

  const response = await fetch(`${SPOTIFY_BASE_URL}/me/playlists`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${await getAccessToken()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      description: description || '',
      public: isPublic,
    }),
  })

  if (!response.ok) {
    throw new Error(`Failed to create playlist: ${response.status}`)
  }

  return response.json()
}