"use client"

import type React from "react"

import { useState } from "react"
import Papa from "papaparse"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { addExpensesBatch } from "@/lib/firestore"
import { categorizeExpense } from "@/lib/categories"
import type { Expense } from "@/lib/types"
import { Upload, CheckCircle, AlertCircle } from "lucide-react"

interface CsvImporterProps {
  userId: string
}

interface CsvRow {
  fecha: string
  importe: string
  descripcion: string
  categoria?: string
}

export function CsvImporter({ userId }: CsvImporterProps) {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [preview, setPreview] = useState<Expense[]>([])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setError("")
      setSuccess(false)
      setPreview([])
      previewCsv(selectedFile)
    }
  }

  const previewCsv = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const previewData = results.data
          .slice(0, 5)
          .map((row: any) => processCsvRow(row as CsvRow))
          .filter(Boolean) as Expense[]

        setPreview(previewData)
      },
      error: (error) => {
        setError("Error al leer el archivo CSV: " + error.message)
      },
    })
  }

  const processCsvRow = (row: CsvRow): Expense | null => {
    try {
      // Normalizar fecha
      const date = new Date(row.fecha)
      if (isNaN(date.getTime())) {
        throw new Error("Fecha inválida")
      }

      // Normalizar importe
      const amount = Number.parseFloat(row.importe.replace(",", "."))
      if (isNaN(amount)) {
        throw new Error("Importe inválido")
      }

      // Asignar categoría
      const category = row.categoria || categorizeExpense(row.descripcion)

      // Calcular mes
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`

      return {
        userId,
        date: date.toISOString().split("T")[0],
        amount: Math.abs(amount), // Asegurar que sea positivo
        category,
        description: row.descripcion,
        month,
        createdAt: new Date().toISOString(),
      }
    } catch (error) {
      console.error("Error procesando fila:", row, error)
      return null
    }
  }

  const handleImport = async () => {
    if (!file) return

    setLoading(true)
    setError("")
    setProgress(0)

    try {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          const expenses: Expense[] = []
          const total = results.data.length

          for (let i = 0; i < results.data.length; i++) {
            const row = results.data[i] as CsvRow
            const expense = processCsvRow(row)

            if (expense) {
              expenses.push(expense)
            }

            // Actualizar progreso
            setProgress(Math.round(((i + 1) / total) * 50))
          }

          if (expenses.length === 0) {
            throw new Error("No se pudieron procesar gastos del archivo")
          }

          // Guardar en Firestore
          await addExpensesBatch(expenses)
          setProgress(100)
          setSuccess(true)
          setFile(null)
          setPreview([])

          // Reset file input
          const fileInput = document.getElementById("csv-file") as HTMLInputElement
          if (fileInput) fileInput.value = ""
        },
        error: (error) => {
          throw new Error("Error al procesar CSV: " + error.message)
        },
      })
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5" />
            <span>Subir Archivo CSV</span>
          </CardTitle>
          <CardDescription>
            Sube un archivo CSV con las columnas: fecha, importe, descripcion, categoria (opcional)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="csv-file">Seleccionar archivo CSV</Label>
            <Input id="csv-file" type="file" accept=".csv" onChange={handleFileChange} disabled={loading} />
          </div>

          {file && (
            <div className="text-sm text-gray-600">
              Archivo seleccionado: {file.name} ({(file.size / 1024).toFixed(1)} KB)
            </div>
          )}

          {loading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Procesando...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          <Button onClick={handleImport} disabled={!file || loading} className="w-full">
            {loading ? "Importando..." : "Importar Gastos"}
          </Button>
        </CardContent>
      </Card>

      {preview.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Vista Previa (primeros 5 registros)</CardTitle>
            <CardDescription>Revisa cómo se procesarán tus datos antes de importar</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Fecha</th>
                    <th className="text-left p-2">Importe</th>
                    <th className="text-left p-2">Categoría</th>
                    <th className="text-left p-2">Descripción</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((expense, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-2">{expense.date}</td>
                      <td className="p-2">€{expense.amount.toFixed(2)}</td>
                      <td className="p-2">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          {expense.category}
                        </span>
                      </td>
                      <td className="p-2">{expense.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            ¡Gastos importados exitosamente! Puedes ver el resumen en la sección de reportes.
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Formato del archivo CSV</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Tu archivo CSV debe tener las siguientes columnas (con estos nombres exactos):
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <code className="text-sm">
                fecha,importe,descripcion,categoria
                <br />
                2025-08-09,45.20,"Cena en restaurante",Comida
                <br />
                2025-08-08,25.50,"Gasolina",Transporte
                <br />
                2025-08-07,12.30,"Supermercado Mercadona"
              </code>
            </div>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>
                <strong>fecha:</strong> Formato YYYY-MM-DD
              </li>
              <li>
                <strong>importe:</strong> Número decimal (usa punto o coma)
              </li>
              <li>
                <strong>descripcion:</strong> Descripción del gasto
              </li>
              <li>
                <strong>categoria:</strong> Opcional, se asignará automáticamente si no se especifica
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
