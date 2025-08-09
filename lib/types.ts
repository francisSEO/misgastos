export interface Expense {
  shared: boolean
  id?: string
  userId: string
  date: string
  amount: number
  category: string
  description: string
  month: string
  createdAt: string
}

export interface User {
  id: string
  name: string
  email: string
}

export interface CategorySummary {
  category: string
  total: number
  count: number
}

export interface MonthlyReport {
  userId: string
  month: string
  totalAmount: number
  categories: CategorySummary[]
  expenses: Expense[]
}
