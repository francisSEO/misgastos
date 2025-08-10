"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getMonthlyReport, updateExpense } from "@/lib/firestore"
import type { MonthlyReport, Expense } from "@/lib/types"
import { LoadingSpinner } from "@/components/loading-spinner"
import { Download, Calendar, Edit2, Save, X, Check } from "lucide-react"

interface MonthlyReportViewProps {
  userId: string
}

// Categorías de ingresos (para filtrar)
const INCOME_CATEGORIES = [
  "Sueldo Francis",
  "Sueldo María",
  "Pagas extra Francis",
  "Pagas extra María",
  "Fondos indexados Francis",
  "Fondos indexados María",
  "Ingreso Manzanilla",
  "Ingreso Av. Constitución",
]

// Categorías de gastos (excluyendo ingresos)
const EXPENSE_CATEGORIES = [
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
  "Gastos Manzanilla",
  "Gastos Av. Constitución",
]

export function MonthlyReportView({ userId }: MonthlyReportViewProps) {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(String(new Date().getMonth() + 1).padStart(2, "0"))
  const [selectedUserId, setSelectedUserId] = useState<string>("todos")
  const [expenseFilter, setExpenseFilter] = useState<string>("todos")
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

  // Cargar reporte cuando cambie el mes, año o userid
  useEffect(() => {
    if (selectedYear && selectedMonth) {
      loadReport()
    }
  }, [selectedYear, selectedMonth, selectedUserId])

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

  // Filtrar gastos por userid seleccionado
  const getFilteredExpenses = () => {
    if (!report) return []
    
    if (selectedUserId === "todos") {
      return report.expenses
    }
    
    return report.expenses.filter(expense => expense.userId === selectedUserId)
  }

  // Separar gastos e ingresos
  const getExpenses = () => {
    return getFilteredExpenses().filter(expense => 
      !INCOME_CATEGORIES.includes(expense.category)
    )
  }

  const getIncomes = () => {
    return getFilteredExpenses().filter(expense => 
      INCOME_CATEGORIES.includes(expense.category) && 
      !expense.category.includes("Fondos indexados")
    )
  }

  // Obtener gastos compartidos
  const getSharedExpenses = () => {
    return getExpenses().filter(expense => expense.shared)
  }

  // Calcular totales por usuario
  const getExpensesByUser = () => {
    const expenses = getExpenses()
    const userTotals: Record<string, { total: number, count: number }> = {}
    
    expenses.forEach(expense => {
      if (!userTotals[expense.userId]) {
        userTotals[expense.userId] = { total: 0, count: 0 }
      }
      userTotals[expense.userId].total += expense.amount
      userTotals[expense.userId].count += 1
    })
    
    return userTotals
  }

  // Calcular deudas entre usuarios (gastos compartidos)
  const getSharedExpensesSummary = () => {
    const sharedExpenses = getSharedExpenses()
    const userTotals: Record<string, number> = {}
    
    sharedExpenses.forEach(expense => {
      if (!userTotals[expense.userId]) {
        userTotals[expense.userId] = 0
      }
      userTotals[expense.userId] += expense.amount
    })
    
    // Calcular deudas
    const users = Object.keys(userTotals)
    if (users.length !== 2) return []
    
    const [user1, user2] = users
    const total1 = userTotals[user1]
    const total2 = userTotals[user2]
    const totalShared = total1 + total2
    const half = totalShared / 2
    
    const debts = []
    if (total1 > half) {
      debts.push({
        from: user1,
        to: user2,
        amount: total1 - half
      })
    }
    if (total2 > half) {
      debts.push({
        from: user2,
        to: user1,
        amount: total2 - half
      })
    }
    
    return debts
  }

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
      await updateExpense(expenseId, editedValues)
      
      if (report) {
        const updatedExpenses = report.expenses.map(expense => 
          expense.id === expenseId 
            ? { ...expense, ...editedValues }
            : expense
        )
        
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
    } finally {
      setUpdating(false)
    }
  }

  const exportToCsv = () => {
    const expenses = getExpenses()
    if (!expenses.length) return

    const headers = ["Fecha", "Usuario", "Importe", "Categoría", "Descripción", "Compartido"]
    const csvContent = [
      headers.join(","),
      ...expenses.map((expense) =>
        [expense.date, expense.userId, expense.amount.toString(), expense.category, `"${expense.description}"`, expense.shared ? 'Sí' : 'No'].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `gastos-${selectedMonth}-${selectedYear}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return <LoadingSpinner />
  }

  const expenses = getExpenses()
  const incomes = getIncomes()
  const sharedExpenses = getSharedExpenses()
  const expensesByUser = getExpensesByUser()
  const sharedExpensesSummary = getSharedExpensesSummary()

  return (
    <div className="space-y-6">
      {/* Selector de mes y filtro por usuario */}
      <Card className="bg-[#1d1e22] border-none">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-white">
            <span>Seleccionar Período y Usuario</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
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

              {/* Filtro por Usuario */}
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="w-40 text-white border-none">
                  <SelectValue placeholder="Usuario" />
                </SelectTrigger>
                <SelectContent className="bg-[#1d1e22] text-white border-[#121315] shadow-none">
                  <SelectItem value="todos">Todos los usuarios</SelectItem>
                  <SelectItem value="Maria">Maria</SelectItem>
                  <SelectItem value="Francis">Francis</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {expenses.length > 0 && (
              <Button onClick={exportToCsv} variant="outline" className="bg-[#1d1e22] border-white/20 text-white hover:bg-white/10 cursor-pointer w-full sm:w-auto">
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {report && (
        <>
          {/* SECCIÓN DE GASTOS */}
          <div className="space-y-6">
            <Card className="bg-[#1d1e22] border-none">
              <CardHeader>
                <CardTitle className="text-white text-xl">📊 GASTOS</CardTitle>
                <CardDescription>Análisis detallado de gastos del período</CardDescription>
              </CardHeader>
            </Card>

            {/* Resumen de gastos por usuario */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-[#1d1e22] border-none">
                <CardHeader>
                  <CardTitle className="text-white">Resumen por Usuario</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(expensesByUser).map(([user, data]) => (
                      <div key={user} className="flex justify-between items-center p-3 bg-[#2A2B2F] rounded-lg">
                        <div>
                          <div className="text-white font-medium">{user}</div>
                          <div className="text-sm text-gray-400">{data.count} gastos</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-red-500">€{data.total.toFixed(2)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Gastos compartidos */}
              <Card className="bg-[#1d1e22] border-none">
                <CardHeader>
                  <CardTitle className="text-white">Gastos Compartidos</CardTitle>
                  <CardDescription>Deudas entre usuarios</CardDescription>
                </CardHeader>
                <CardContent>
                  {sharedExpensesSummary.length > 0 ? (
                    <div className="space-y-3">
                      {sharedExpensesSummary.map((debt, index) => (
                        <div key={index} className="p-3 bg-[#2A2B2F] rounded-lg">
                          <div className="text-white text-sm">
                            <span className="font-medium">{debt.from}</span> debe a{" "}
                            <span className="font-medium">{debt.to}</span>
                          </div>
                          <div className="text-lg font-bold text-yellow-500">€{debt.amount.toFixed(2)}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-400 text-center py-4">No hay gastos compartidos</div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Tabla de gastos por categoría y usuario */}
            <Card className="bg-[#1d1e22] border-none">
              <CardHeader>
                <CardTitle className="text-white">Gastos por Categoría y Usuario</CardTitle>
                <CardDescription>Desglose detallado de gastos</CardDescription>
                <div className="flex items-center space-x-4 mt-2">
                  <Select value={expenseFilter} onValueChange={setExpenseFilter}>
                    <SelectTrigger className="w-48 text-white border-[#3A3B3F]">
                      <SelectValue placeholder="Filtrar por tipo" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1d1e22] text-white border-[#3A3B3F]">
                      <SelectItem value="todos">Todos los gastos</SelectItem>
                      <SelectItem value="compartidos">Solo compartidos</SelectItem>
                      <SelectItem value="no-compartidos">Solo no compartidos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#3A3B3F]">
                        <th className="text-left p-2 text-[#767677] uppercase font-semibold text-xs">Categoría</th>
                        <th className="text-left p-2 text-[#767677] uppercase font-semibold text-xs">Maria</th>
                        <th className="text-left p-2 text-[#767677] uppercase font-semibold text-xs">Francis</th>
                        <th className="text-left p-2 text-[#767677] uppercase font-semibold text-xs">Total</th>
                      </tr>
                    </thead>
                    <tbody className="text-white">
                      {EXPENSE_CATEGORIES.map(category => {
                        let filteredExpenses = expenses.filter(e => e.category === category)
                        
                        // Aplicar filtro adicional si no es "todos"
                        if (selectedUserId !== "todos") {
                          if (selectedUserId === "compartidos") {
                            filteredExpenses = filteredExpenses.filter(e => e.shared)
                          } else if (selectedUserId === "no-compartidos") {
                            filteredExpenses = filteredExpenses.filter(e => !e.shared)
                          }
                        }
                        
                        const mariaExpenses = filteredExpenses.filter(e => e.userId === "Maria")
                        const francisExpenses = filteredExpenses.filter(e => e.userId === "Francis")
                        
                        const mariaTotal = mariaExpenses.reduce((sum, e) => sum + e.amount, 0)
                        const francisTotal = francisExpenses.reduce((sum, e) => sum + e.amount, 0)
                        const total = mariaTotal + francisTotal
                        
                        if (total === 0) return null
                        
                        return (
                          <tr key={category} className="border-b border-[#3A3B3F] hover:bg-[#2A2B2F]">
                            <td className="p-2 font-medium">{category}</td>
                            <td className="p-2">€{mariaTotal.toFixed(2)}</td>
                            <td className="p-2">€{francisTotal.toFixed(2)}</td>
                            <td className="p-2 font-bold text-red-500">€{total.toFixed(2)}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>



            {/* Tabla de Detalle de Gastos (mantenida como solicitaste) */}
            <Card className="bg-[#1d1e22] border-none">
              <CardHeader>
                <CardTitle className="text-white">Detalle de Gastos</CardTitle>
                <CardDescription>Todos los gastos del período seleccionado</CardDescription>
              </CardHeader>
              <CardContent>
                {expenses.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#3A3B3F]">
                          <th className="text-left p-2 text-[#767677] uppercase font-semibold text-xs">Fecha</th>
                          <th className="text-left p-2 text-[#767677] uppercase font-semibold text-xs">Usuario</th>
                          <th className="text-left p-2 text-[#767677] uppercase font-semibold text-xs">Importe</th>
                          <th className="text-left p-2 text-[#767677] uppercase font-semibold text-xs">Categoría</th>
                          <th className="text-left p-2 text-[#767677] uppercase font-semibold text-xs">Descripción</th>
                          <th className="text-left p-2 text-[#767677] uppercase font-semibold text-xs">Compartido</th>
                          <th className="text-left p-2 text-[#767677] uppercase font-semibold text-xs">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="text-white">
                        {expenses.map((expense, index) => {
                          const isEditing = editingExpense === expense.id
                          return (
                            <tr key={expense.id || index} className="hover:bg-[#2A2B2F]">
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
                              
                              {/* Usuario */}
                              <td className="p-2 font-medium">{expense.userId}</td>
                              
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
                                  <span className="font-medium text-red-500">€{expense.amount.toFixed(2)}</span>
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
                                      {EXPENSE_CATEGORIES.map((cat) => (
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
          </div>

          {/* SECCIÓN DE INGRESOS */}
          {incomes.length > 0 && (
            <div className="space-y-6">
              <Card className="bg-[#1d1e22] border-none">
                <CardHeader>
                  <CardTitle className="text-white text-xl">💰 INGRESOS</CardTitle>
                  <CardDescription>Ingresos del período (excluyendo fondos indexados)</CardDescription>
                </CardHeader>
              </Card>

              {/* Tabla de ingresos por usuario */}
              <Card className="bg-[#1d1e22] border-none">
                <CardHeader>
                  <CardTitle className="text-white">Ingresos por Usuario</CardTitle>
                  <CardDescription>Desglose de ingresos por persona</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#3A3B3F]">
                          <th className="text-left p-2 text-[#767677] uppercase font-semibold text-xs">Usuario</th>
                          <th className="text-left p-2 text-[#767677] uppercase font-semibold text-xs">Categoría</th>
                          <th className="text-left p-2 text-[#767677] uppercase font-semibold text-xs">Descripción</th>
                          <th className="text-left p-2 text-[#767677] uppercase font-semibold text-xs">Fecha</th>
                          <th className="text-left p-2 text-[#767677] uppercase font-semibold text-xs">Importe</th>
                        </tr>
                      </thead>
                      <tbody className="text-white">
                        {incomes.map((income, index) => (
                          <tr key={income.id || index} className="border-b border-[#3A3B3F] hover:bg-[#2A2B2F]">
                            <td className="p-2 font-medium">{income.userId}</td>
                            <td className="p-2">
                              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                                {income.category}
                              </span>
                            </td>
                            <td className="p-2">{income.description}</td>
                            <td className="p-2">{income.date}</td>
                            <td className="p-2 font-bold text-green-500">€{income.amount.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  )
}
