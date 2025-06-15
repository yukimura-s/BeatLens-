"use client"

import { useState } from "react"
import { TrackSearch } from "@/components/tracks/track-search"
import { TrackList } from "@/components/tracks/track-list"
import { AudioFeaturesRadar } from "@/components/charts/audio-features-radar"
import { FeaturesBarChart } from "@/components/charts/features-bar-chart"
import { SpotifyTrack, AudioFeatures } from "@/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import * as Tabs from "@radix-ui/react-tabs"

export default function AnalyzePage() {
  const [tracks, setTracks] = useState<SpotifyTrack[]>([])
  const [selectedTrack, setSelectedTrack] = useState<SpotifyTrack | null>(null)
  const [audioFeatures, setAudioFeatures] = useState<AudioFeatures | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const handleSearch = async (query: string) => {
    setIsSearching(true)
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
      if (response.ok) {
        const data = await response.json()
        setTracks(data.tracks.items)
      }
    } catch (error) {
      console.error("Search error:", error)
    }
    setIsSearching(false)
  }

  const handleAnalyze = async (track: SpotifyTrack) => {
    setSelectedTrack(track)
    setIsAnalyzing(true)
    try {
      const response = await fetch(`/api/tracks/${track.id}/features`)
      if (response.ok) {
        const features = await response.json()
        setAudioFeatures(features)
      }
    } catch (error) {
      console.error("Analysis error:", error)
    }
    setIsAnalyzing(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analyze Tracks</h1>
        <p className="text-muted-foreground">
          Search for tracks and analyze their audio features
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search Tracks</CardTitle>
          <CardDescription>
            Enter a track name, artist, or album to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TrackSearch onSearch={handleSearch} isLoading={isSearching} />
        </CardContent>
      </Card>

      {tracks.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Search Results</CardTitle>
            </CardHeader>
            <CardContent>
              <TrackList
                tracks={tracks}
                onAnalyze={handleAnalyze}
                isLoading={isSearching}
              />
            </CardContent>
          </Card>

          {selectedTrack && (
            <div className="space-y-6">
              {isAnalyzing ? (
                <Card>
                  <CardContent className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="mt-2 text-sm text-muted-foreground">Analyzing track...</p>
                    </div>
                  </CardContent>
                </Card>
              ) : audioFeatures ? (
                <Tabs.Root defaultValue="radar" className="w-full">
                  <Tabs.List className="grid w-full grid-cols-2 mb-6">
                    <Tabs.Trigger 
                      value="radar"
                      className="flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow"
                    >
                      Radar Chart
                    </Tabs.Trigger>
                    <Tabs.Trigger 
                      value="bar"
                      className="flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow"
                    >
                      Bar Chart
                    </Tabs.Trigger>
                  </Tabs.List>
                  <Tabs.Content value="radar">
                    <AudioFeaturesRadar
                      audioFeatures={audioFeatures}
                      trackName={selectedTrack.name}
                      artistName={selectedTrack.artists.map(a => a.name).join(", ")}
                    />
                  </Tabs.Content>
                  <Tabs.Content value="bar">
                    <FeaturesBarChart
                      audioFeatures={audioFeatures}
                      trackName={selectedTrack.name}
                      artistName={selectedTrack.artists.map(a => a.name).join(", ")}
                    />
                  </Tabs.Content>
                </Tabs.Root>
              ) : (
                <Card>
                  <CardContent className="text-center py-8 text-muted-foreground">
                    Select a track to view its audio features
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}