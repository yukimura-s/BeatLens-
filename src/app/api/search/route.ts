import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

const SPOTIFY_BASE_URL = "https://api.spotify.com/v1"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!(session as { accessToken?: string })?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")
    const limit = searchParams.get("limit") || "20"

    if (!query) {
      return NextResponse.json({ error: "Query parameter is required" }, { status: 400 })
    }

    const response = await fetch(
      `${SPOTIFY_BASE_URL}/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${(session as { accessToken?: string }).accessToken}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Spotify API error: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json(
      { error: "Failed to search tracks" },
      { status: 500 }
    )
  }
}