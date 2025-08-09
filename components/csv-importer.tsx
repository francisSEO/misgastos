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
  date: string
  userid: string
  description: string
  amount: string
  category?: string
}

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
      const date = new Date(row.date)
      if (isNaN(date.getTime())) {
        throw new Error("Fecha inválida")
      }

      // Normalizar importe
      const amount = Number.parseFloat(
        typeof row.amount === "string" ? row.amount.replace(",", ".") : row.amount
      )
      if (isNaN(amount)) {
        throw new Error("Importe inválido")
      }

      // Asignar categoría
      const category = row.category || categorizeExpense(row.description)

      // Calcular mes
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`

      // Procesar campo compartido
      let shared = false
      if (row.shared !== undefined) {
        shared =
          row.shared === "true" ||
          row.shared === "1" ||
          row.shared === "TRUE" ||
          row.shared === "sí" ||
          row.shared === "Sí" ||
          row.shared === "SI" ||
          row.shared === "si"
      }

      return {
        userId: row.userid,
        date: date.toISOString().split("T")[0],
        amount: Math.abs(amount),
        category,
        description: row.description,
        month,
        createdAt: new Date().toISOString(),
        shared,
      }
    } catch (error) {
      console.error("Error procesando fila:", row, error)
      return null
    }
  }

  // Permitir editar la vista previa
  const handlePreviewChange = (index: number, field: keyof Expense, value: any) => {
    setPreview((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              [field]:
                field === "amount"
                  ? Number.parseFloat(value.replace(",", "."))
                  : field === "shared"
                  ? Boolean(value)
                  : value,
            }
          : item
      )
    )
  }

  const handleImport = async () => {
    if (!preview.length) return

    setLoading(true)
    setError("")
    setProgress(0)

    try {
      await addExpensesBatch(preview)
      setProgress(100)
      setSuccess(true)
      setFile(null)
      setPreview([])

      // Reset file input
      const fileInput = document.getElementById("csv-file") as HTMLInputElement
      if (fileInput) fileInput.value = ""
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
            Sube un archivo CSV con las columnas: date, userid, description, amount, category (opcional)
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

        </CardContent>
      </Card>

      {preview.length > 0 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Vista Previa (editable)</CardTitle>
              <CardDescription>
                Revisa y edita tus datos antes de importar. Puedes modificar cualquier campo.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Fecha</th>
                      <th className="text-left p-2">Usuario</th>
                      <th className="text-left p-2">Descripción</th>
                      <th className="text-left p-2">Importe</th>
                      <th className="text-left p-2">Categoría</th>
                      <th className="text-left p-2">Compartido</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((expense, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2">
                          <Input
                            type="date"
                            value={expense.date}
                            onChange={(e) => handlePreviewChange(index, "date", e.target.value)}
                            className="w-36"
                          />
                        </td>
                        <td className="p-2">
                          <select
                            value={expense.userId}
                            onChange={(e) => handlePreviewChange(index, "userId", e.target.value)}
                            className="w-32 border rounded px-2 py-1"
                          >
                            <option value="">Selecciona usuario</option>
                            <option value="Maria">Maria</option>
                            <option value="Francis">Francis</option>
                          </select>
                        </td>
                        <td className="p-2">
                          <Input
                            type="text"
                            value={expense.description}
                            onChange={(e) => handlePreviewChange(index, "description", e.target.value)}
                            className="w-64"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            value={expense.amount}
                            onChange={(e) => handlePreviewChange(index, "amount", e.target.value)}
                            className="w-24"
                          />
                        </td>
                        <td className="p-2">
                          <select
                            value={expense.category}
                            onChange={(e) => handlePreviewChange(index, "category", e.target.value)}
                            className="w-48 border rounded px-2 py-1"
                          >
                            <option value="">Selecciona categoría</option>
                            {CATEGORY_OPTIONS.map((cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-2 text-center">
                          <input
                            type="checkbox"
                            checked={!!expense.shared}
                            onChange={(e) => handlePreviewChange(index, "shared", e.target.checked)}
                            style={{ width: "22px", height: "22px" }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          {/* Botón de importación debajo de la previsualización */}
          <div className="mt-4">
            <Button onClick={handleImport} disabled={!preview.length || loading} className="w-full">
              {loading ? "Importando..." : "Importar Gastos"}
            </Button>
          </div>
        </>
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
                date,userid,description,amount,category,shared
                <br />
                2025-08-09,maria,"Cena en restaurante",45.20,Comida,TRUE
                <br />
                2025-08-08,maria,"Gasolina",25.50,Transporte,TRUE
                <br />
                2025-08-07,maria,"Supermercado Mercadona",12.30,FALSE
              </code>
            </div>
            
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
