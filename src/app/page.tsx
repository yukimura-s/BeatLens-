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
      {/* 背景アニメーション */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGRlZnM+CjxwYXR0ZXJuIGlkPSJncmlkIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPgo8cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz4KPC9wYXR0ZXJuPgo8L2RlZnM+CjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz4KPHN2Zz4=')] opacity-20"></div>
      
      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="text-center mb-20">
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-green-400 to-blue-500 rounded-full blur-lg opacity-30 animate-pulse"></div>
              <Music2 className="h-20 w-20 text-green-400 relative z-10" />
            </div>
          </div>
          <h1 className="text-7xl font-bold bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 bg-clip-text text-transparent mb-6">
            BeatLens
          </h1>
          <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            音楽の隠れたパターンを発見しよう。音響特徴を分析し、あなたの音楽的嗜好を可視化し、
            パーソナライズされたおすすめ楽曲を見つけよう。
          </p>
          <div className="flex justify-center">
            <LoginButton />
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/10 transition-all duration-300 group">
            <CardHeader className="text-center pb-4">
              <div className="relative mx-auto mb-4">
                <div className="absolute -inset-2 bg-gradient-to-r from-green-400 to-emerald-600 rounded-full blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
                <BarChart3 className="h-10 w-10 text-green-400 relative z-10" />
              </div>
              <CardTitle className="text-white text-lg font-semibold">音響分析</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-300 text-sm leading-relaxed">
                ダンサビリティ、エネルギー、ヴァレンスなど、音楽の特徴を詳細に分析
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/10 transition-all duration-300 group">
            <CardHeader className="text-center pb-4">
              <div className="relative mx-auto mb-4">
                <div className="absolute -inset-2 bg-gradient-to-r from-blue-400 to-cyan-600 rounded-full blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
                <Headphones className="h-10 w-10 text-blue-400 relative z-10" />
              </div>
              <CardTitle className="text-white text-lg font-semibold">プレイリスト分析</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-300 text-sm leading-relaxed">
                プレイリストの傾向を理解し、コレクションのムードを発見
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/10 transition-all duration-300 group">
            <CardHeader className="text-center pb-4">
              <div className="relative mx-auto mb-4">
                <div className="absolute -inset-2 bg-gradient-to-r from-purple-400 to-pink-600 rounded-full blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
                <TrendingUp className="h-10 w-10 text-purple-400 relative z-10" />
              </div>
              <CardTitle className="text-white text-lg font-semibold">おすすめ楽曲</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-300 text-sm leading-relaxed">
                あなたの好みに基づいたパーソナライズされた音楽レコメンデーション
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/10 transition-all duration-300 group">
            <CardHeader className="text-center pb-4">
              <div className="relative mx-auto mb-4">
                <div className="absolute -inset-2 bg-gradient-to-r from-yellow-400 to-orange-600 rounded-full blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
                <Music2 className="h-10 w-10 text-yellow-400 relative z-10" />
              </div>
              <CardTitle className="text-white text-lg font-semibold">楽曲比較</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-300 text-sm leading-relaxed">
                複数の楽曲を並べて比較し、それぞれのユニークな特徴を発見
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        <div className="text-center bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-xl rounded-3xl p-12 border border-white/10">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-6">
            音楽の世界を探索する準備はできましたか？
          </h2>
          <p className="text-gray-300 mb-10 text-lg leading-relaxed max-w-2xl mx-auto">
            Spotifyアカウントを接続して、お気に入りの楽曲に関する洞察の発見を始めましょう
          </p>
          <LoginButton />
        </div>
      </div>
    </div>
  )
}