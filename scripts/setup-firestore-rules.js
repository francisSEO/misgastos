// Script para configurar las reglas de Firestore
// Ejecuta este script después de crear el proyecto

const admin = require("firebase-admin")

// Reglas de seguridad recomendadas para Firestore
const firestoreRules = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Regla para la colección de gastos
    match /expenses/{expenseId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.userId;
    }
    
    // Regla para perfiles de usuario (opcional para futuras funcionalidades)
    match /users/{userId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == userId;
    }
  }
}
`

console.log("Reglas de Firestore recomendadas:")
console.log(firestoreRules)
console.log("\nCopia estas reglas en la consola de Firebase:")
console.log("1. Ve a https://console.firebase.google.com/project/misgastos-f8a32/firestore/rules")
console.log("2. Reemplaza las reglas existentes con las de arriba")
console.log('3. Haz clic en "Publicar"')
