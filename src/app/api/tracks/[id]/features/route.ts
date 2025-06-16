import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

const SPOTIFY_BASE_URL = "https://api.spotify.com/v1"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!(session as { accessToken?: string })?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const response = await fetch(`${SPOTIFY_BASE_URL}/audio-features/${id}`, {
      headers: {
        Authorization: `Bearer ${(session as { accessToken?: string }).accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Spotify API error: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Audio features fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch audio features" },
      { status: 500 }
    )
  }
}