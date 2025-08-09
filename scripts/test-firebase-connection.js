// Script para probar la conexión con Firebase
import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyD_vecioAlnVbSnsJYv4ixp1m1I4cGxd3o",
  authDomain: "misgastos-f8a32.firebaseapp.com",
  projectId: "misgastos-f8a32",
  storageBucket: "misgastos-f8a32.firebasestorage.app",
  messagingSenderId: "863876741202",
  appId: "1:863876741202:web:535109efc8537901e3078b",
}

try {
  const app = initializeApp(firebaseConfig)
  const auth = getAuth(app)
  const db = getFirestore(app)

  console.log("✅ Firebase inicializado correctamente")
  console.log("📊 Proyecto ID:", firebaseConfig.projectId)
  console.log("🔐 Auth Domain:", firebaseConfig.authDomain)
  console.log("💾 Firestore conectado")
} catch (error) {
  console.error("❌ Error conectando con Firebase:", error)
}
