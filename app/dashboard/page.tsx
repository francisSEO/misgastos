"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { onAuthStateChanged, type User, signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingSpinner } from "@/components/loading-spinner"
import { Upload, BarChart3, FileText } from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
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
    try {
      await signOut(auth)
      router.push("/")
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">Control de Gastos</h1>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Hola, {user.email}</span>
              <Button onClick={handleLogout} variant="outline">
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <Link href="/import">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Upload className="h-5 w-5" />
                    <span>Importar Gastos</span>
                  </CardTitle>
                  <CardDescription>Sube un archivo CSV con tus gastos</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Importa gastos masivamente desde un archivo CSV y asígnalos automáticamente a categorías.
                  </p>
                </CardContent>
              </Link>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <Link href="/reports">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5" />
                    <span>Resumen Mensual</span>
                  </CardTitle>
                  <CardDescription>Ve tus gastos por mes y categoría</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Analiza tus gastos con gráficos detallados y reportes mensuales.
                  </p>
                </CardContent>
              </Link>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <Link href="/expenses">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5" />
                    <span>Gestionar Gastos</span>
                  </CardTitle>
                  <CardDescription>Edita y exporta tus gastos</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">Edita gastos individuales y exporta datos filtrados a CSV.</p>
                </CardContent>
              </Link>
            </Card>
          </div>

          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Bienvenido a tu Control de Gastos</CardTitle>
                <CardDescription>Gestiona tus finanzas de forma inteligente</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-gray-600">Esta aplicación te permite:</p>
                  <ul className="list-disc list-inside space-y-2 text-gray-600">
                    <li>Importar gastos masivamente desde archivos CSV</li>
                    <li>Categorizar automáticamente tus gastos</li>
                    <li>Ver resúmenes mensuales con gráficos detallados</li>
                    <li>Editar y gestionar gastos individuales</li>
                    <li>Exportar datos filtrados para análisis externos</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
