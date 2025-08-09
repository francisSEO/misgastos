# Control de Gastos - Firebase App

Aplicación web para gestión de gastos personales con Firebase como backend.

## 🚀 Configuración Inicial

### 1. Configuración de Firebase

Tu proyecto Firebase ya está configurado:
- **Project ID**: misgastos-f8a32
- **Auth Domain**: misgastos-f8a32.firebaseapp.com

### 2. Habilitar Servicios en Firebase Console

Ve a [Firebase Console](https://console.firebase.google.com/project/misgastos-f8a32) y habilita:

#### Authentication
1. Ve a Authentication > Sign-in method
2. Habilita "Email/Password"
3. Opcionalmente habilita "Google" para login social

#### Firestore Database
1. Ve a Firestore Database
2. Crea la base de datos en modo "production"
3. Selecciona una región (recomendado: europe-west1)

### 3. Configurar Reglas de Firestore

Ve a Firestore > Rules y reemplaza con:

\`\`\`javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /expenses/{expenseId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.userId;
    }
  }
}
\`\`\`

### 4. Crear Índices en Firestore

Ve a Firestore > Indexes y crea estos índices compuestos:

**Índice 1:**
- Collection: `expenses`
- Fields: `userId` (Ascending), `month` (Ascending), `date` (Descending)

**Índice 2:**
- Collection: `expenses`  
- Fields: `userId` (Ascending), `date` (Descending)

## 📊 Estructura de Datos

### Colección: expenses
\`\`\`json
{
  "userId": "string",
  "date": "YYYY-MM-DD",
  "amount": "number",
  "category": "string", 
  "description": "string",
  "month": "YYYY-MM",
  "createdAt": "ISO string"
}
\`\`\`

## 🔧 Instalación Local

\`\`\`bash
# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Construir para producción
npm run build
\`\`\`

## 📁 Formato CSV para Importación

Tu archivo CSV debe tener estas columnas:

\`\`\`csv
fecha,importe,descripcion,categoria
2025-08-09,45.20,"Cena en restaurante",Comida
2025-08-08,25.50,"Gasolina",Transporte
2025-08-07,12.30,"Supermercado Mercadona"
\`\`\`

**Notas:**
- `fecha`: Formato YYYY-MM-DD
- `importe`: Número decimal (punto o coma)
- `descripcion`: Texto descriptivo
- `categoria`: Opcional, se asigna automáticamente si no se especifica

## 🏷️ Categorías Automáticas

El sistema categoriza automáticamente basándose en palabras clave:

- **Comida**: supermercado, restaurante, café, etc.
- **Transporte**: gasolina, uber, taxi, etc.
- **Entretenimiento**: cine, netflix, gym, etc.
- **Salud**: farmacia, médico, hospital, etc.
- **Hogar**: alquiler, luz, agua, internet, etc.

## 🚀 Despliegue

### Vercel (Recomendado)
1. Conecta tu repositorio con Vercel
2. Las variables de entorno ya están configuradas
3. Deploy automático

### Firebase Hosting
\`\`\`bash
npm install -g firebase-tools
firebase login
firebase init hosting
npm run build
firebase deploy
\`\`\`

## 🔒 Seguridad

- Autenticación requerida para todas las operaciones
- Reglas de Firestore que protegen datos por usuario
- Validación de datos en cliente y servidor
- HTTPS obligatorio en producción

## 📱 Características

✅ Importación masiva CSV
✅ Categorización automática  
✅ Gráficos interactivos
✅ Exportación de datos
✅ Responsive design
✅ Autenticación segura
✅ Tiempo real con Firestore

## 🛠️ Próximas Funcionalidades

- [ ] Edición individual de gastos
- [ ] Múltiples usuarios/familias
- [ ] Integración con IA para categorización
- [ ] Notificaciones y alertas
- [ ] Dashboard avanzado con predicciones
