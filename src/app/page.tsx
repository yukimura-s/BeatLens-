import { getServerSession } from "next-auth"
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
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <Music2 className="h-16 w-16 text-green-500" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">BeatLens</h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Discover the hidden patterns in your music. Analyze audio features, 
            visualize your taste, and get personalized recommendations.
          </p>
          <LoginButton />
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="bg-white/10 backdrop-blur border-white/20">
            <CardHeader className="text-center">
              <BarChart3 className="h-8 w-8 text-green-400 mx-auto mb-2" />
              <CardTitle className="text-white">Audio Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-300">
                Deep dive into danceability, energy, valence, and more musical characteristics
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur border-white/20">
            <CardHeader className="text-center">
              <Headphones className="h-8 w-8 text-blue-400 mx-auto mb-2" />
              <CardTitle className="text-white">Playlist Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-300">
                Understand your playlist trends and discover the mood of your collections
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur border-white/20">
            <CardHeader className="text-center">
              <TrendingUp className="h-8 w-8 text-purple-400 mx-auto mb-2" />
              <CardTitle className="text-white">Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-300">
                Get personalized music recommendations based on your preferences
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur border-white/20">
            <CardHeader className="text-center">
              <Music2 className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
              <CardTitle className="text-white">Track Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-300">
                Compare multiple tracks side by side to see what makes them unique
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to explore your music?</h2>
          <p className="text-gray-300 mb-8">
            Connect your Spotify account and start discovering insights about your favorite tracks
          </p>
          <LoginButton />
        </div>
      </div>
    </div>
  )
}