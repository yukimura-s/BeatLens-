import { SpotifyTrack } from "@/types"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Play, ExternalLink } from "lucide-react"
import { formatDuration } from "@/lib/utils"
import Image from "next/image"

interface TrackCardProps {
  track: SpotifyTrack
  onAnalyze: (track: SpotifyTrack) => void
}

export function TrackCard({ track, onAnalyze }: TrackCardProps) {
  const albumImage = track.album.images[0]?.url
  const artists = track.artists.map(artist => artist.name).join(", ")

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            {albumImage ? (
              <Image
                src={albumImage}
                alt={`${track.album.name} album cover`}
                width={64}
                height={64}
                className="rounded-md"
              />
            ) : (
              <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center">
                <Play className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{track.name}</h3>
            <p className="text-sm text-muted-foreground truncate">{artists}</p>
            <p className="text-xs text-muted-foreground truncate">
              {track.album.name} • {formatDuration(track.duration_ms)}
            </p>
            
            <div className="flex gap-2 mt-2">
              <Button
                size="sm"
                onClick={() => onAnalyze(track)}
                className="text-xs"
              >
                Analyze
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(track.external_urls.spotify, "_blank")}
                className="text-xs"
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}