"use client"

import { AudioFeatures } from "@/types"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface FeaturesBarChartProps {
  audioFeatures: AudioFeatures
  trackName?: string
  artistName?: string
}

export function FeaturesBarChart({ audioFeatures, trackName, artistName }: FeaturesBarChartProps) {
  const data = [
    {
      name: "Danceability",
      value: audioFeatures.danceability * 100,
      description: "How suitable the track is for dancing",
    },
    {
      name: "Energy",
      value: audioFeatures.energy * 100,
      description: "Perceptual measure of intensity and power",
    },
    {
      name: "Speechiness",
      value: audioFeatures.speechiness * 100,
      description: "Presence of spoken words in the track",
    },
    {
      name: "Acousticness",
      value: audioFeatures.acousticness * 100,
      description: "Confidence measure of whether the track is acoustic",
    },
    {
      name: "Instrumentalness",
      value: audioFeatures.instrumentalness * 100,
      description: "Predicts whether a track contains no vocals",
    },
    {
      name: "Liveness",
      value: audioFeatures.liveness * 100,
      description: "Detects the presence of an audience in the recording",
    },
    {
      name: "Valence",
      value: audioFeatures.valence * 100,
      description: "Musical positiveness conveyed by the track",
    },
  ]

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-background border rounded-lg p-3 shadow-md">
          <p className="font-semibold">{label}</p>
          <p className="text-primary">{`${payload[0].value.toFixed(1)}%`}</p>
          <p className="text-sm text-muted-foreground">{data.description}</p>
        </div>
      )
    }
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Audio Features Breakdown</CardTitle>
        {trackName && artistName && (
          <CardDescription>
            {trackName} by {artistName}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              angle={-45}
              textAnchor="end"
              height={100}
              fontSize={12}
            />
            <YAxis domain={[0, 100]} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" fill="#22c55e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}