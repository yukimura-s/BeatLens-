import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { LoginButton } from "@/components/auth/login-button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Music2, BarChart3, Headphones, TrendingUp } from "lucide-react"

export default async function Home() {
  const session = await getServerSession(authOptions)

  if (session) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* パーティクル背景エフェクト */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 via-purple-900/30 to-pink-900/20"></div>
        {/* アニメーション粒子 */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGRlZnM+CjxwYXR0ZXJuIGlkPSJwYXJ0aWNsZXMiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+CjxjaXJjbGUgY3g9IjIwIiBjeT0iMjAiIHI9IjEiIGZpbGw9InJnYmEoMTAyLDEyNiwyMzQsMC41KSI+CjxhbmltYXRlIGF0dHJpYnV0ZU5hbWU9Im9wYWNpdHkiIHZhbHVlcz0iMDsxOzAiIGR1cj0iM3MiIHJlcGVhdENvdW50PSJpbmRlZmluaXRlIi8+CjwvY2lyY2xlPgo8L3BhdHRlcm4+CjwvZGVmcz4KPHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNwYXJ0aWNsZXMpIi8+Cjwvc3ZnPg==')] opacity-30 animate-pulse"></div>
      </div>
      
      <div className="container mx-auto px-6 py-20 relative z-10">
        <div className="text-center mb-24">
          <div className="flex justify-center mb-10">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full blur-lg opacity-30 animate-pulse"></div>
              <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center shadow-2xl">
                <Music2 className="h-12 w-12 text-white" />
              </div>
            </div>
          </div>
          <h1 className="text-7xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-6 animate-pulse">
            BeatLens
          </h1>
          <div className="w-32 h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent mx-auto mb-8"></div>
          <p className="text-xl text-slate-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            Spotify楽曲分析で音楽の新しい側面を発見しよう。<br />
            最先端のAIが音響特徴を解析し、あなただけの音楽体験を創造します。
          </p>
          <div className="flex justify-center">
            <LoginButton />
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-24">
          <Card className="bg-slate-800/60 backdrop-blur-xl border border-purple-500/20 hover:border-purple-400/40 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-transparent to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardHeader className="text-center pb-6 relative z-10">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-white text-lg font-bold">音響分析</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <CardDescription className="text-slate-300 text-sm leading-relaxed text-center">
                ダンサビリティ、エネルギー、ヴァレンスなど、音楽の特徴を最先端AIで分析
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/60 backdrop-blur-xl border border-cyan-500/20 hover:border-cyan-400/40 hover:shadow-2xl hover:shadow-cyan-500/20 transition-all duration-500 group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/10 via-transparent to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardHeader className="text-center pb-6 relative z-10">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Headphones className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-white text-lg font-bold">プレイリスト分析</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <CardDescription className="text-slate-300 text-sm leading-relaxed text-center">
                プレイリストの傾向を理解し、コレクションのムードを深く発見
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/60 backdrop-blur-xl border border-pink-500/20 hover:border-pink-400/40 hover:shadow-2xl hover:shadow-pink-500/20 transition-all duration-500 group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-pink-600/10 via-transparent to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardHeader className="text-center pb-6 relative z-10">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-white text-lg font-bold">おすすめ楽曲</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <CardDescription className="text-slate-300 text-sm leading-relaxed text-center">
                あなたの好みに基づいたパーソナライズされた音楽レコメンデーション
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/60 backdrop-blur-xl border border-emerald-500/20 hover:border-emerald-400/40 hover:shadow-2xl hover:shadow-emerald-500/20 transition-all duration-500 group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/10 via-transparent to-cyan-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardHeader className="text-center pb-6 relative z-10">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Music2 className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-white text-lg font-bold">楽曲比較</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <CardDescription className="text-slate-300 text-sm leading-relaxed text-center">
                複数の楽曲を並べて比較し、それぞれのユニークな特徴を発見
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        <div className="text-center bg-slate-800/60 backdrop-blur-xl rounded-3xl p-16 border border-purple-500/30 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-pink-900/20"></div>
          <div className="relative z-10">
            <div className="w-32 h-px bg-gradient-to-r from-transparent via-purple-400 to-transparent mx-auto mb-8"></div>
            <h2 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-8">
              音楽の未来へようこそ
            </h2>
            <p className="text-slate-300 mb-12 text-xl leading-relaxed max-w-3xl mx-auto">
              Spotifyアカウントを接続して、AI駆動の音楽分析の世界に足を踏み入れよう。<br />
              あなたの音楽体験を次のレベルへと押し上げます。
            </p>
            <LoginButton />
            <div className="w-32 h-px bg-gradient-to-r from-transparent via-purple-400 to-transparent mx-auto mt-8"></div>
          </div>
        </div>
      </div>
    </div>
  )
}