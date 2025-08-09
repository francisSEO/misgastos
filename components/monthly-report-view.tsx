"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { getMonthlyReport } from "@/lib/firestore"
import type { MonthlyReport } from "@/lib/types"
import { ExpenseChart } from "@/components/expense-chart"
import { CategoryChart } from "@/components/category-chart"
import { LoadingSpinner } from "@/components/loading-spinner"
import { Download, Calendar } from "lucide-react"

interface MonthlyReportViewProps {
  userId: string
}

export function MonthlyReportView({ userId }: MonthlyReportViewProps) {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(String(new Date().getMonth() + 1).padStart(2, "0"))
  const [report, setReport] = useState<MonthlyReport | null>(null)
  const [loading, setLoading] = useState(false)

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

  const exportToCsv = () => {
    if (!report || !report.expenses.length) return

    const headers = ["Fecha", "Importe", "Categoría", "Descripción","Compartido"]
    const csvContent = [
      headers.join(","),
      ...report.expenses.map((expense) =>
        [expense.date, expense.amount.toString(), expense.category, `"${expense.description}"`].join(","),
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Seleccionar Período</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            {/* Año */}
            <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Año" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Mes */}
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Mes" />
              </SelectTrigger>
              <SelectContent>
                {months.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {report && report.expenses.length > 0 && (
              <Button onClick={exportToCsv} variant="outline">
                <Download className="h-4 w-4 mr-2" />
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
            <Card>
              <CardHeader>
                <CardTitle>Total del Mes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">€{report.totalAmount.toFixed(2)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Número de Gastos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">{report.expenses.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Promedio por Gasto</CardTitle>
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
              <Card>
                <CardHeader>
                  <CardTitle>Gastos por Categoría</CardTitle>
                  <CardDescription>Distribución de gastos</CardDescription>
                </CardHeader>
                <CardContent>
                  <CategoryChart data={report.categories} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Evolución Diaria</CardTitle>
                  <CardDescription>Gastos por día del mes</CardDescription>
                </CardHeader>
                <CardContent>
                  <ExpenseChart expenses={report.expenses} />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Lista de gastos */}
          <Card>
            <CardHeader>
              <CardTitle>Detalle de Gastos</CardTitle>
              <CardDescription>Todos los gastos del período seleccionado</CardDescription>
            </CardHeader>
            <CardContent>
              {report.expenses.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Fecha</th>
                        <th className="text-left p-2">Importe</th>
                        <th className="text-left p-2">Categoría</th>
                        <th className="text-left p-2">Descripción</th>
                        <th className="text-left p-2">Compartido</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.expenses.map((expense, index) => (
                        <tr key={expense.id || index} className="border-b hover:bg-gray-50">
                          <td className="p-2">{expense.date}</td>
                          <td className="p-2 font-medium">{expense.amount.toFixed(2)} €</td>
                          <td className="p-2">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                              {expense.category}
                            </span>
                          </td>
                          <td className="p-2">{expense.description}</td>
                          <td className="p-2">{expense.shared}</td>
                        </tr>
                      ))}
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
