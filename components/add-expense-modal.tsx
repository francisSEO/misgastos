'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Plus, CheckCircle } from 'lucide-react'

interface AddExpenseModalProps {
  isOpen: boolean
  onClose: () => void
}

// Categorías consistentes con csv-importer.tsx
const CATEGORY_OPTIONS = [
  "Hogar",
  "Servicios",
  "Supermercado",
  "Coche",
  "Ocio",
  "Transporte",
  "Comer fuera",
  "Salud",
  "Gym",
  "Compras varias",
  "Viajes",
  "Regalos",
  "Otros",
  "Tabaco",
  "Formación",
  "Harry",
  "Sueldo Francis",
  "Sueldo María",
  "Pagas extra Francis",
  "Pagas extra María",
  "Fondos indexados Francis",
  "Fondos indexados María",
  "Gastos Manzanilla",
  "Ingreso Manzanilla",
  "Gastos Av. Constitución",
  "Ingreso Av. Constitución",
]

export function AddExpenseModal({ isOpen, onClose }: AddExpenseModalProps) {
  const [formData, setFormData] = useState({
    userid: '',
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    shared: false
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.userid || !formData.amount || !formData.category || !formData.description || !formData.date) {
      alert('Por favor completa todos los campos obligatorios')
      return
    }

    setIsSubmitting(true)

    try {
      const expenseData = {
        ...formData,
        amount: parseFloat(formData.amount),
        date: formData.date, // Mantener como string "YYYY-MM-DD"
        month: new Date(formData.date).toISOString().slice(0, 7), // YYYY-MM format
        createdAt: serverTimestamp()
        // Eliminado updatedAt
      }

      await addDoc(collection(db, 'expenses'), expenseData)
      
      setIsSuccess(true)
    } catch (error) {
      console.error('Error al añadir gasto:', error)
      alert('Error al añadir el gasto')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddAnother = () => {
    setIsSuccess(false)
    setFormData({
      userid: '',
      amount: '',
      category: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      shared: false
    })
  }

  const handleClose = () => {
    setIsSuccess(false)
    setFormData({
      userid: '',
      amount: '',
      category: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      shared: false
    })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-[#1E1F23] border-[#2A2B2F] text-white">
        {!isSuccess ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-white">
                Añadir nuevo movimiento
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Usuario */}
              <div className="space-y-2">
                <Label htmlFor="userid" className="text-white">Usuario *</Label>
                <Select 
                  value={formData.userid} 
                  onValueChange={(value) => handleInputChange('userid', value)}
                >
                  <SelectTrigger className="bg-[#2A2B2F] border-[#3A3B3F] text-white">
                    <SelectValue placeholder="Selecciona un usuario" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2A2B2F] border-[#3A3B3F] text-white">
                    <SelectItem value="Maria">Maria</SelectItem>
                    <SelectItem value="Francis">Francis</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Cantidad */}
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-white">Cantidad (€) *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  className="bg-[#2A2B2F] border-[#3A3B3F] text-white placeholder:text-[#767677]"
                  placeholder="0.00"
                />
              </div>

              {/* Categoría */}
              <div className="space-y-2">
                <Label htmlFor="category" className="text-white">Categoría *</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => handleInputChange('category', value)}
                >
                  <SelectTrigger className="bg-[#2A2B2F] border-[#3A3B3F] text-white">
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2A2B2F] border-[#3A3B3F] text-white">
                    {CATEGORY_OPTIONS.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Descripción */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-white">Descripción *</Label>
                <Input
                  id="description"
                  type="text"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="bg-[#2A2B2F] border-[#3A3B3F] text-white placeholder:text-[#767677]"
                  placeholder="Descripción del gasto"
                />
              </div>

              {/* Fecha */}
              <div className="space-y-2">
                <Label htmlFor="date" className="text-white">Fecha *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  className="bg-[#2A2B2F] border-[#3A3B3F] text-white"
                />
              </div>

              {/* Compartido */}
              <div className="flex items-center space-x-2">
                <input
                  id="shared"
                  type="checkbox"
                  checked={formData.shared}
                  onChange={(e) => handleInputChange('shared', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-[#2A2B2F] border-[#3A3B3F] rounded focus:ring-blue-500 focus:ring-2"
                />
                <Label htmlFor="shared" className="text-white">Gasto compartido</Label>
              </div>

              {/* Botones */}
              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1 bg-transparent border-[#3A3B3F] text-white hover:bg-[#2A2B2F]"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-[#81a1c1] hover:bg-white text-black font-medium"
                >
                  {isSubmitting ? 'Guardando...' : 'Guardar'}
                </Button>
              </div>
            </form>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-white text-center">
                Guardado!
              </DialogTitle>
            </DialogHeader>
            
            <div className="text-center space-y-6 py-4">
              <div className="flex justify-center">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>
              
              <p className="text-white text-lg">
                El gasto se ha guardado correctamente
              </p>
              
              <div className="flex space-x-3 pt-4">
                <Button
                  onClick={handleAddAnother}
                  className="flex-1 bg-[#81a1c1] hover:bg-white text-black font-medium"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Añadir Otro Gasto
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
