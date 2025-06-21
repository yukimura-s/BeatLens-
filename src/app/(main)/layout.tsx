import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="dashboard">
      <div className="dashboard-layout">
        <Sidebar />
        <main className="main-content">
          <Header />
          <div className="content-body">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}