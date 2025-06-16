import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { BarChart3, Music, Headphones, TrendingUp } from "lucide-react"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  return (
    <div className="space-y-8">
      <div className="text-center py-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 bg-clip-text text-transparent mb-4">
          おかえりなさい、{session ? (session as { user?: { name?: string } }).user?.name || 'ユーザー' : 'ユーザー'}さん！
        </h1>
        <p className="text-muted-foreground text-lg">
          BeatLensであなたの音楽的嗜好に関する洞察を発見しましょう
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-900 border-green-200 dark:border-green-800 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">
              分析済み楽曲
            </CardTitle>
            <Music className="h-5 w-5 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-800 dark:text-green-200">0</div>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              楽曲分析を開始しましょう
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-blue-950 dark:to-cyan-900 border-blue-200 dark:border-blue-800 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">
              プレイリスト
            </CardTitle>
            <Headphones className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-800 dark:text-blue-200">0</div>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              プレイリストを接続
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-950 dark:to-pink-900 border-purple-200 dark:border-purple-800 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">
              おすすめ楽曲
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-800 dark:text-purple-200">0</div>
            <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
              パーソナライズされたおすすめ
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-orange-50 to-yellow-100 dark:from-orange-950 dark:to-yellow-900 border-orange-200 dark:border-orange-800 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">
              音響特徴
            </CardTitle>
            <BarChart3 className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-800 dark:text-orange-200">0</div>
            <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
              音楽特性を可視化
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Start</CardTitle>
            <CardDescription>
              Get started with BeatLens in just a few steps
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm">
              1. Search for tracks in the <strong>Analyze</strong> section
            </div>
            <div className="text-sm">
              2. View detailed audio features and visualizations
            </div>
            <div className="text-sm">
              3. Get recommendations based on your preferences
            </div>
            <div className="text-sm">
              4. Explore your playlists and their characteristics
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Your latest music analysis activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              No recent activity. Start by analyzing some tracks!
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}