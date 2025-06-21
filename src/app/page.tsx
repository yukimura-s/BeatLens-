import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { LoginButton } from "@/components/auth/login-button"
import "../styles/premium.css"

export default async function Home() {
  const session = await getServerSession(authOptions)

  if (session) {
    redirect("/dashboard")
  }

  return (
    <div className="landing-page">
      <div className="mesh-background"></div>
      
      {/* Navigation */}
      <nav className="navbar">
        <div className="navbar-content">
          <div className="logo">BeatLens</div>
          <div className="nav-links">
            <a href="#features" className="nav-link">機能</a>
            <a href="#analytics" className="nav-link">分析</a>
            <a href="#pricing" className="nav-link">料金</a>
            <LoginButton />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">あなたの音楽を、<br />解き明かす。</h1>
          <p className="hero-subtitle">
            Spotifyの高度な分析。これまでにない方法で音楽を理解する。
          </p>
          <LoginButton />
        </div>
      </section>
    </div>
  )
}