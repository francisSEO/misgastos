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
  const expenses = await getExpensesByUserAndMonth(userId, month)

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
