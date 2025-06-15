import { SpotifyTrack } from "@/types"
import { TrackCard } from "./track-card"
import { Skeleton } from "@/components/ui/skeleton"

interface TrackListProps {
  tracks: SpotifyTrack[]
  onAnalyze: (track: SpotifyTrack) => void
  isLoading?: boolean
}

export function TrackList({ tracks, onAnalyze, isLoading }: TrackListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    )
  }

  if (tracks.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No tracks found. Try searching for something else.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {tracks.map((track) => (
        <TrackCard
          key={track.id}
          track={track}
          onAnalyze={onAnalyze}
        />
      ))}
    </div>
  )
}