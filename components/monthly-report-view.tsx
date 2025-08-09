"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getMonthlyReport, updateExpense } from "@/lib/firestore"
import type { MonthlyReport, Expense } from "@/lib/types"
import { ExpenseChart } from "@/components/expense-chart"
import { CategoryChart } from "@/components/category-chart"
import { LoadingSpinner } from "@/components/loading-spinner"
import { Download, Calendar, Edit2, Save, X, Check } from "lucide-react"
import { categoryKeywords } from "@/lib/categories"

interface MonthlyReportViewProps {
  userId: string
}

export function MonthlyReportView({ userId }: MonthlyReportViewProps) {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(String(new Date().getMonth() + 1).padStart(2, "0"))
  const [report, setReport] = useState<MonthlyReport | null>(null)
  const [loading, setLoading] = useState(false)
  
  // Estados para edición
  const [editingExpense, setEditingExpense] = useState<string | null>(null)
  const [editedValues, setEditedValues] = useState<Partial<Expense>>({})
  const [updating, setUpdating] = useState(false)

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 12 }, (_, i) => currentYear - i)
  const months = [
    { value: "01", label: "Enero" },
    { value: "02", label: "Febrero" },
    { value: "03", label: "Marzo" },
    { value: "04", label: "Abril" },
    { value: "05", label: "Mayo" },
    { value: "06", label: "Junio" },
    { value: "07", label: "Julio" },
    { value: "08", label: "Agosto" },
    { value: "09", label: "Septiembre" },
    { value: "10", label: "Octubre" },
    { value: "11", label: "Noviembre" },
    { value: "12", label: "Diciembre" },
  ]

  // Cargar reporte cuando cambie el mes o el año
  useEffect(() => {
    if (selectedYear && selectedMonth) {
      loadReport()
    }
  }, [selectedYear, selectedMonth])

  const loadReport = async () => {
    const monthKey = `${selectedYear}-${selectedMonth}`
    setLoading(true)
    try {
      const reportData = await getMonthlyReport(userId, monthKey)
      setReport(reportData)
    } catch (error) {
      console.error("Error cargando reporte:", error)
    } finally {
      setLoading(false)
    }
  }

  // Obtener todas las categorías disponibles
  const availableCategories = [...Object.keys(categoryKeywords), "Otros"]

  // Funciones para edición
  const startEditing = (expense: Expense) => {
    setEditingExpense(expense.id!)
    setEditedValues({
      date: expense.date,
      amount: expense.amount,
      category: expense.category,
      description: expense.description,
      shared: expense.shared
    })
  }

  const cancelEditing = () => {
    setEditingExpense(null)
    setEditedValues({})
  }

  const saveExpense = async (expenseId: string) => {
    if (!editedValues || updating) return

    setUpdating(true)
    try {
      // Actualizar en la base de datos
      await updateExpense(expenseId, editedValues)
      
      // Actualizar el estado local del reporte
      if (report) {
        const updatedExpenses = report.expenses.map(expense => 
          expense.id === expenseId 
            ? { ...expense, ...editedValues }
            : expense
        )
        
        // Recalcular totales
        let totalAmount = 0
        const categoryTotals: Record<string, any> = {}
        
        updatedExpenses.forEach((expense) => {
          totalAmount += expense.amount
          if (!categoryTotals[expense.category]) {
            categoryTotals[expense.category] = {
              category: expense.category,
              total: 0,
              count: 0,
            }
          }
          categoryTotals[expense.category].total += expense.amount
          categoryTotals[expense.category].count += 1
        })

        setReport({
          ...report,
          expenses: updatedExpenses,
          totalAmount,
          categories: Object.values(categoryTotals)
        })
      }
      
      setEditingExpense(null)
      setEditedValues({})
    } catch (error) {
      console.error("Error actualizando gasto:", error)
      // Aquí podrías agregar una notificación de error
    } finally {
      setUpdating(false)
    }
  }

  const exportToCsv = () => {
    if (!report || !report.expenses.length) return

    const headers = ["Fecha", "Importe", "Categoría", "Descripción","Compartido"]
    const csvContent = [
      headers.join(","),
      ...report.expenses.map((expense) =>
        [expense.date, expense.amount.toString(), expense.category, `"${expense.description}"`, expense.shared ? 'Sí' : 'No'].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `gastos-${selectedMonth}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      {/* Selector de mes */}
      <Card className="bg-[#1d1e22] border-none">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-white">
            <span>Seleccionar Período</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-4">
              {/* Año */}
              <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
                <SelectTrigger className="w-32 text-white border-none hover:bg-[#1d1e22]">
                  <SelectValue placeholder="Año" />
                </SelectTrigger>
                <SelectContent className="bg-[#1d1e22] text-white border-[#121315] shadow-none">
                  {years.map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {/* Mes */}
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-48 text-white border-none">
                  <SelectValue placeholder="Mes" />
                </SelectTrigger>
                <SelectContent className="bg-[#1d1e22] text-white border-[#121315] shadow-none">
                  {months.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {report && report.expenses.length > 0 && (
              <Button onClick={exportToCsv} variant="outline" className="bg-[#1d1e22] border-white/20 text-white hover:bg-white/10 cursor-pointer w-full sm:w-auto">
                <Download className="h-4 w-4 mr-2  " />
                Exportar CSV
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {report && (
        <>
          {/* Resumen general */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-[#1d1e22] border-none">
              <CardHeader>
                <CardTitle className="text-white">Total del Mes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">€{report.totalAmount.toFixed(2)}</div>
              </CardContent>
            </Card>

            <Card className="bg-[#1d1e22] border-none">
              <CardHeader>
                <CardTitle className="text-white">Número de Gastos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">{report.expenses.length}</div>
              </CardContent>
            </Card>

            <Card className="bg-[#1d1e22] border-none">
              <CardHeader>
                <CardTitle className="text-white">Promedio por Gasto</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">
                  €{report.expenses.length > 0 ? (report.totalAmount / report.expenses.length).toFixed(2) : "0.00"}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gráficos */}
          {report.categories.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-[#1d1e22] border-none">
                <CardHeader>
                  <CardTitle className="text-white">Gastos por Categoría</CardTitle>
                  <CardDescription>Distribución de gastos</CardDescription>
                </CardHeader>
                <CardContent>
                  <CategoryChart data={report.categories} />
                </CardContent>
              </Card>

              <Card className="bg-[#1d1e22] border-none">
                <CardHeader>
                  <CardTitle className="text-white">Evolución Diaria</CardTitle>
                  <CardDescription>Gastos por día del mes</CardDescription>
                </CardHeader>
                <CardContent>
                  <ExpenseChart expenses={report.expenses} />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Lista de gastos */}
          <Card className="bg-[#1d1e22] border-none">
            <CardHeader>
              <CardTitle className="text-white">Detalle de Gastos</CardTitle>
              <CardDescription>Todos los gastos del período seleccionado</CardDescription>
            </CardHeader>
            <CardContent>
              {report.expenses.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 text-[#767677] uppercase font-semibold text-xs ">Fecha</th>
                        <th className="text-left p-2 text-[#767677] uppercase font-semibold text-xs ">Importe</th>
                        <th className="text-left p-2 text-[#767677] uppercase font-semibold text-xs ">Categoría</th>
                        <th className="text-left p-2 text-[#767677] uppercase font-semibold text-xs ">Descripción</th>
                        <th className="text-left p-2 text-[#767677] uppercase font-semibold text-xs ">Compartido</th>
                        <th className="text-left p-2 text-[#767677] uppercase font-semibold text-xs text-xs">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="text-white">
                      {report.expenses.map((expense, index) => {
                        const isEditing = editingExpense === expense.id
                        return (
                          <tr key={expense.id || index} className="hover:bg-[rgb(26 26 26)]">
                            {/* Fecha */}
                            <td className="p-2">
                              {isEditing ? (
                                <Input
                                  type="date"
                                  value={editedValues.date || expense.date}
                                  onChange={(e) => setEditedValues({...editedValues, date: e.target.value})}
                                  className="w-full text-sm"
                                />
                              ) : (
                                expense.date
                              )}
                            </td>
                            
                            {/* Importe */}
                            <td className="p-2">
                              {isEditing ? (
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={editedValues.amount || expense.amount}
                                  onChange={(e) => setEditedValues({...editedValues, amount: parseFloat(e.target.value)})}
                                  className="w-24 text-sm"
                                />
                              ) : (
                                <span className="font-medium">{expense.amount.toFixed(2)} €</span>
                              )}
                            </td>
                            
                            {/* Categoría */}
                            <td className="p-2">
                              {isEditing ? (
                                <Select
                                  value={editedValues.category || expense.category}
                                  onValueChange={(value) => setEditedValues({...editedValues, category: value})}
                                >
                                  <SelectTrigger className="w-32 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {availableCategories.map((cat) => (
                                      <SelectItem key={cat} value={cat} className="text-xs">
                                        {cat}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : (
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                  {expense.category}
                                </span>
                              )}
                            </td>
                            
                            {/* Descripción */}
                            <td className="p-2">
                              {isEditing ? (
                                <Input
                                  type="text"
                                  value={editedValues.description || expense.description}
                                  onChange={(e) => setEditedValues({...editedValues, description: e.target.value})}
                                  className="w-full text-sm"
                                />
                              ) : (
                                expense.description
                              )}
                            </td>
                            
                            {/* Compartido */}
                            <td className="p-2">
                              {isEditing ? (
                                <Select
                                  value={String(editedValues.shared ?? expense.shared)}
                                  onValueChange={(value) => setEditedValues({...editedValues, shared: value === 'true'})}
                                >
                                  <SelectTrigger className="w-20 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="true" className="text-xs">Sí</SelectItem>
                                    <SelectItem value="false" className="text-xs">No</SelectItem>
                                  </SelectContent>
                                </Select>
                              ) : (
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  expense.shared 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {expense.shared ? 'Sí' : 'No'}
                                </span>
                              )}
                            </td>
                            
                            {/* Acciones */}
                            <td className="p-2">
                              {isEditing ? (
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => saveExpense(expense.id!)}
                                    disabled={updating}
                                    className="h-7 w-7 p-0"
                                  >
                                    {updating ? (
                                      <div className="animate-spin h-3 w-3 border border-gray-300 border-t-blue-600 rounded-full"></div>
                                    ) : (
                                      <Check className="h-3 w-3 text-black" />
                                    )}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={cancelEditing}
                                    disabled={updating}
                                    className="h-7 w-7 p-0"
                                  >
                                    <X className="h-3 w-3 text-black" />
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => startEditing(expense)}
                                  className="h-7 w-7 p-0"
                                >
                                  <Edit2 className="h-3 w-3 text-black" />
                                </Button>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">No hay gastos registrados para este período</div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
