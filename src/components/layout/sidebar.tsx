"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, Headphones, TrendingUp, LayoutDashboard } from "lucide-react"

const navItems = [
  {
    title: "概要",
    href: "/dashboard",
    icon: LayoutDashboard
  },
  {
    title: "分析", 
    href: "/analyze",
    icon: BarChart3
  },
  {
    title: "プレイリスト",
    href: "/playlists", 
    icon: Headphones
  },
  {
    title: "発見",
    href: "/recommendations",
    icon: TrendingUp
  }
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo">BeatLens</div>
      </div>
      
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-item ${isActive ? 'active' : ''}`}
            >
              <Icon className="sidebar-icon" />
              {item.title}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}