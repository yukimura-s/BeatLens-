"use client"

import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Music } from "lucide-react"

export function LoginButton() {
  return (
    <Button
      onClick={() => signIn("spotify", { callbackUrl: "/dashboard" })}
      size="lg"
      className="bg-green-600 hover:bg-green-700 text-white"
    >
      <Music className="mr-2 h-5 w-5" />
      Continue with Spotify
    </Button>
  )
}