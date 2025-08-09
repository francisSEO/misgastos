"use client"

import { Button } from "@/components/ui/button"

interface DashboardHeaderProps {
  userEmail: string
  onLogout: () => void
}

export function DashboardHeader({ userEmail, onLogout }: DashboardHeaderProps) {
  return (
    <header className="backdrop-blur-sm bg-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <a href="/" className="cursor-pointer"><h1 className="text-l font-semibold text-white">Control de Gastos</h1></a>
          <div className="flex items-center space-x-4">
            <Button onClick={onLogout} variant="outline" className="bg-[#1d1e22] border-white/20 text-white hover:bg-white/10">
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}