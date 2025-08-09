"use client"

import { Button } from "@/components/ui/button"

interface DashboardHeaderProps {
  userEmail: string
  onLogout: () => void
}

export function DashboardHeader({ userEmail, onLogout }: DashboardHeaderProps) {
  return (
    <header className="bg-background shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <h1 className="text-1l font-bold white">Control de Gastos</h1>
          <div className="flex items-center space-x-4">
            <span className="text-gray-700">Hola, {userEmail}</span>
            <Button onClick={onLogout} variant="outline">
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}