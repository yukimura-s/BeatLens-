"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"

interface TrackSearchProps {
  onSearch: (query: string) => void
  isLoading?: boolean
}

export function TrackSearch({ onSearch, isLoading }: TrackSearchProps) {
  const [query, setQuery] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      onSearch(query.trim())
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        type="text"
        placeholder="Search for tracks, artists, or albums..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="flex-1"
      />
      <Button type="submit" disabled={!query.trim() || isLoading}>
        <Search className="h-4 w-4" />
      </Button>
    </form>
  )
}