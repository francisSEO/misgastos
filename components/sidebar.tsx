'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { 
  BarChart3, 
  Upload, 
  Plus, 
  LogOut, 
  Menu, 
  X,
  Home
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { AddExpenseModal } from './add-expense-modal'

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const pathname = usePathname()

  const handleSignOut = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    }
  }

  const navigation = [
    
    {
      name: 'Reportes',
      href: '/reports',
      icon: BarChart3,
      current: pathname === '/reports'
    },
    {
      name: 'Importar',
      href: '/import',
      icon: Upload,
      current: pathname === '/import'
    }
  ]

  return (
    <>
      {/* Botón móvil para abrir/cerrar sidebar */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="bg-[#1E1F23] text-white hover:bg-[#2A2B2F] border border-[#2A2B2F]"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </Button>
      </div>

      {/* Overlay móvil */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed left-0 top-0 h-full w-64 bg-[#1E1F23] border-r border-[#2A2B2F] z-30 transform transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-[#2A2B2F]">
            <h1 className="text-l font-semibold text-white">Mis Gastos</h1>
          </div>

          {/* Navegación */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200",
                    item.current
                      ? "text-white"
                      : "text-[#767677] hover:text-white"
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* Botón Añadir Gasto */}
          <div className="px-4 pb-4">
            <Button
              className="w-full bg-[#81a1c1] hover:from-blue-700 hover:to-blue-800 text-black font-medium py-3 rounded-lg transition-all duration-200 shadow-lg hover:bg-white cursor-pointer"
              onClick={() => {
                setIsModalOpen(true)
                setIsOpen(false)
              }}
            >
              <Plus className="mr-2 h-5 w-5" />
              Añadir movimiento
            </Button>
          </div>

          {/* Cerrar Sesión */}
          <div className="px-4 pb-6 mt-auto">
            <Button
              variant="ghost"
              className="w-full text-[#767677] hover:text-white hover:bg-[#2A2B2F] justify-start cursor-pointer"
              onClick={handleSignOut}
            >
              <LogOut className="mr-3 h-5 w-5" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </div>

      {/* Espacio para el contenido principal */}
      <div className="lg:ml-64" />

      {/* Modal de Añadir Gasto */}
      <AddExpenseModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  )
}
