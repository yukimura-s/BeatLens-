"use client"

import { AudioFeatures } from "@/types"
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface AudioFeaturesRadarProps {
  audioFeatures: AudioFeatures
  trackName?: string
  artistName?: string
}

export function AudioFeaturesRadar({ audioFeatures, trackName, artistName }: AudioFeaturesRadarProps) {
  const data = [
    {
      feature: "Danceability",
      value: audioFeatures.danceability * 100,
      fullMark: 100,
    },
    {
      feature: "Energy",
      value: audioFeatures.energy * 100,
      fullMark: 100,
    },
    {
      feature: "Speechiness",
      value: audioFeatures.speechiness * 100,
      fullMark: 100,
    },
    {
      feature: "Acousticness",
      value: audioFeatures.acousticness * 100,
      fullMark: 100,
    },
    {
      feature: "Instrumentalness",
      value: audioFeatures.instrumentalness * 100,
      fullMark: 100,
    },
    {
      feature: "Liveness",
      value: audioFeatures.liveness * 100,
      fullMark: 100,
    },
    {
      feature: "Valence",
      value: audioFeatures.valence * 100,
      fullMark: 100,
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Audio Features Radar</CardTitle>
        {trackName && artistName && (
          <CardDescription>
            {trackName} by {artistName}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={data}>
            <PolarGrid />
            <PolarAngleAxis dataKey="feature" />
            <PolarRadiusAxis angle={90} domain={[0, 100]} />
            <Radar
              name="Audio Features"
              dataKey="value"
              stroke="#22c55e"
              fill="#22c55e"
              fillOpacity={0.3}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
        
        <div className="mt-4 space-y-2">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Tempo:</span> {Math.round(audioFeatures.tempo)} BPM
            </div>
            <div>
              <span className="font-medium">Key:</span> {audioFeatures.key}
            </div>
            <div>
              <span className="font-medium">Loudness:</span> {audioFeatures.loudness.toFixed(1)} dB
            </div>
            <div>
              <span className="font-medium">Time Signature:</span> {audioFeatures.time_signature}/4
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}