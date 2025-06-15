"use client"

import { UserMenu } from "@/components/auth/user-menu"
import { Music2 } from "lucide-react"
import Link from "next/link"

export function Header() {
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/dashboard" className="mr-6 flex items-center space-x-2">
            <Music2 className="h-6 w-6 text-green-600" />
            <span className="font-bold">BeatLens</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link
              href="/dashboard"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Dashboard
            </Link>
            <Link
              href="/analyze"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Analyze
            </Link>
            <Link
              href="/playlists"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Playlists
            </Link>
            <Link
              href="/recommendations"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Recommendations
            </Link>
          </nav>
        </div>
        <div className="ml-auto flex items-center space-x-2">
          <UserMenu />
        </div>
      </div>
    </header>
  )
}