"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { onAuthStateChanged, type User } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { LoginForm } from "@/components/login-form"
import { LoadingSpinner } from "@/components/loading-spinner"

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
      if (user) {
        router.push("/dashboard")
      }
    })

    return () => unsubscribe()
  }, [router])

  if (loading) {
    return <LoadingSpinner />
  }

  if (user) {
    return null // Will redirect to dashboard
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Control de Gastos</h1>
          <p className="mt-2 text-gray-600">Gestiona tus gastos de forma inteligente</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
