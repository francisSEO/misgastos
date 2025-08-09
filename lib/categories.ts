// Diccionario de palabras clave para categorización automática
export const categoryKeywords: Record<string, string[]> = {
  Comida: [
    "supermercado",
    "mercado",
    "restaurante",
    "comida",
    "cena",
    "almuerzo",
    "desayuno",
    "pizza",
    "hamburguesa",
    "café",
    "bar",
    "panadería",
    "carnicería",
  ],
  Transporte: [
    "gasolina",
    "combustible",
    "uber",
    "taxi",
    "metro",
    "autobús",
    "parking",
    "estacionamiento",
    "peaje",
    "mecánico",
    "taller",
  ],
  Entretenimiento: [
    "cine",
    "teatro",
    "concierto",
    "netflix",
    "spotify",
    "juego",
    "libro",
    "revista",
    "gym",
    "gimnasio",
    "deporte",
  ],
  Salud: ["farmacia", "médico", "hospital", "dentista", "seguro", "medicina", "consulta", "análisis"],
  Hogar: ["alquiler", "luz", "agua", "gas", "internet", "teléfono", "limpieza", "muebles", "decoración", "ferretería"],
  Ropa: ["ropa", "zapatos", "tienda", "moda", "vestido", "camisa", "pantalón"],
  Educación: ["curso", "libro", "universidad", "colegio", "matrícula", "material"],
}

export function categorizeExpense(description: string): string {
  const lowerDescription = description.toLowerCase()

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    for (const keyword of keywords) {
      if (lowerDescription.includes(keyword)) {
        return category
      }
    }
  }

  return "Otros"
}
