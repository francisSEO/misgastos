import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  orderBy,
  updateDoc,
  deleteDoc,
  doc,
  writeBatch,
} from "firebase/firestore"
import { db } from "./firebase"
import type { Expense, MonthlyReport, CategorySummary } from "./types"

const EXPENSES_COLLECTION = "expenses"

export async function addExpense(expense: Omit<Expense, "id">): Promise<string> {
  const docRef = await addDoc(collection(db, EXPENSES_COLLECTION), expense)
  return docRef.id
}

export async function addExpensesBatch(expenses: Omit<Expense, "id">[]): Promise<void> {
  const batch = writeBatch(db)

  expenses.forEach((expense) => {
    const docRef = doc(collection(db, EXPENSES_COLLECTION))
    batch.set(docRef, expense)
  })

  await batch.commit()
}

export async function getExpensesByUserAndMonth(userId: string, month: string): Promise<Expense[]> {
  const q = query(
    collection(db, EXPENSES_COLLECTION),
    where("userId", "==", userId),
    where("month", "==", month),
    orderBy("date", "desc"),
  )

  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map(
    (doc) =>
      ({
        id: doc.id,
        ...doc.data(),
      }) as Expense,
  )
}

export async function getMonthlyReport(userId: string, month: string): Promise<MonthlyReport> {
  console.log("getMonthlyReport llamado con:", userId, month)
  const expenses = await getExpensesByMonth(month)

  const categoryTotals: Record<string, CategorySummary> = {}
  let totalAmount = 0

  expenses.forEach((expense) => {
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

  return {
    userId,
    month,
    totalAmount,
    categories: Object.values(categoryTotals),
    expenses,
  }
}

export async function updateExpense(id: string, updates: Partial<Expense>): Promise<void> {
  const docRef = doc(db, EXPENSES_COLLECTION, id)
  await updateDoc(docRef, updates)
}

export async function deleteExpense(id: string): Promise<void> {
  const docRef = doc(db, EXPENSES_COLLECTION, id)
  await deleteDoc(docRef)
}

export async function getAllExpensesByUser(userId: string): Promise<Expense[]> {
  const q = query(collection(db, EXPENSES_COLLECTION), where("userId", "==", userId), orderBy("date", "desc"))

  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map(
    (doc) =>
      ({
        id: doc.id,
        ...doc.data(),
      }) as Expense,
  )
}

export async function getExpensesByMonth(month: string): Promise<Expense[]> {
  console.log("getExpensesByMonth llamado con:", month)
  const q = query(
    collection(db, EXPENSES_COLLECTION),
    where("month", "==", month),
    orderBy("date", "desc"),
  )
  const querySnapshot = await getDocs(q)
  console.log("Gastos encontrados para", month, ":", querySnapshot.size)
  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    // Convierte el campo date si es Timestamp
    let date = data.date;
    if (date && typeof date === "object" && date.seconds) {
      date = new Date(date.seconds * 1000).toISOString().split("T")[0];
    }
    return {
      id: doc.id,
      ...data,
      date,
    } as Expense;
  });
}

interface CsvRow {
  date: string
  userid: string
  description: string
  amount: string
  category?: string
  shared?: string // Puede venir como "true", "false", "1", "0", etc.
}

const processCsvRow = (row: CsvRow): Expense | null => {
  try {
    // Procesar campo date
    const date = new Date(row.date)
    if (isNaN(date.getTime())) throw new Error("Fecha inválida")

    // Procesar campo amount
    const amount = parseFloat(row.amount)
    if (isNaN(amount)) throw new Error("Monto inválido")

    // Procesar campo category
    const category = row.category ? row.category.trim() : undefined

    // Procesar campo shared
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
      shared, // <-- nuevo campo
    }
  } catch (error) {
    console.error("Error procesando fila:", row, error)
    return null
  }
}

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


