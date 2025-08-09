"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { onAuthStateChanged, type User } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { LoadingSpinner } from "@/components/loading-spinner"
import { MonthlyReportView } from "@/components/monthly-report-view"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { DashboardHeader } from "@/components/dashboard-header"

export default function ReportsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
      if (!user) {
        router.push("/")
      }
    })

    return () => unsubscribe()
  }, [router])

    const handleLogout = async () => {
    await auth.signOut()
    router.push("/")
  }
  
  if (loading) {
    return <LoadingSpinner />
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader userEmail={user.email ?? ""} onLogout={handleLogout} />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Elimina el CardContent con los selects de año y mes */}
          <MonthlyReportView userId={user.uid} />
        </div>
      </main>
    </div>
  )
}
