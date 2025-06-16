"use client"

import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Music } from "lucide-react"

export function LoginButton() {
  return (
    <div className="relative group">
      <div className="absolute -inset-1 bg-gradient-to-r from-green-400 via-green-500 to-green-600 rounded-xl blur opacity-70 group-hover:opacity-100 transition duration-200"></div>
      <Button
        onClick={() => signIn("spotify", { callbackUrl: "/dashboard" })}
        size="lg"
        className="relative bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-4 text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200 border-0"
      >
        <Music className="mr-3 h-6 w-6" />
        Spotifyでログイン
      </Button>
    </div>
  )
}