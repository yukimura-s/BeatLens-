"use client"

import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Music } from "lucide-react"

export function LoginButton() {
  return (
    <div className="relative group">
      <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-full blur opacity-70 group-hover:opacity-100 transition duration-300"></div>
      <Button
        onClick={() => signIn("spotify", { callbackUrl: "/dashboard" })}
        className="relative bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white font-bold px-12 py-6 text-lg rounded-full shadow-xl hover:shadow-2xl transform hover:scale-110 transition-all duration-300 border-0"
      >
        <Music className="mr-3 h-6 w-6" />
        Spotifyで開始
      </Button>
    </div>
  )
}