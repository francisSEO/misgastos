"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import type { Expense } from "@/lib/types"

interface ExpenseChartProps {
  expenses: Expense[]
}

export function ExpenseChart({ expenses }: ExpenseChartProps) {
  // Agrupar gastos por día
  const dailyExpenses = expenses.reduce(
    (acc, expense) => {
      const day = new Date(expense.date).getDate()
      if (!acc[day]) {
        acc[day] = 0
      }
      acc[day] += expense.amount
      return acc
    },
    {} as Record<number, number>,
  )

  // Convertir a array para el gráfico
  const chartData = Object.entries(dailyExpenses)
    .map(([day, amount]) => ({
      day: Number.parseInt(day),
      amount: amount,
    }))
    .sort((a, b) => a.day - b.day)

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">Día {label}</p>
          <p className="text-green-600">€{payload[0].value.toFixed(2)}</p>
        </div>
      )
    }
    return null
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="day" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `€${value}`} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="amount" fill="#0088FE" />
      </BarChart>
    </ResponsiveContainer>
  )
}
