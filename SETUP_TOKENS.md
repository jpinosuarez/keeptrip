# Setup: Tokens y Configuración

## 🔴 ACCIÓN REQUERIDA: Tokens Reales

Tu `.env` ha sido actualizado con estructuras de variables, pero necesita **tokens reales** para funcionar en producción.

### 1. Mapbox Token

#### Obtener token:
1. Ve a https://account.mapbox.com/access-tokens/
2. Inicia sesión o crea una cuenta
3. Copia tu token público (comienza con `pk.`)

#### Configurar en `.env`:
```env
VITE_MAPBOX_TOKEN=pk.eyJu_TU_VERDADERO_TOKEN_AQUI
```

#### Configurar restricciones de dominio (RECOMENDADO):
1. En https://account.mapbox.com/access-tokens/
2. Edita tu token público
3. En "URL Restrictions", agrega estos dominios:
   ```
   https://keeptrip.app/*
   https://www.keeptrip.app/*
   https://keeptrip-app-b06b3.web.app/*
   https://keeptrip-app-b06b3.firebaseapp.com/*
   http://localhost:5173/*
   http://localhost:4173/*
   ```
4. Guarda cambios

### 2. Firebase Configuration

#### Para desarrollo local con emulators:
- Las variables actuales son correctas ✅
- `VITE_USE_EMULATORS=true` activa los emuladores

#### Para producción:
1. Ve a Firebase Console: https://console.firebase.google.com/
2. Usuario: `jpinosuarez`
3. Proyecto: `keeptrip-app-b06b3`
4. Settings → Project Settings → Your apps
5. Selecciona tu app web
6. Copia las credenciales y actualiza `.env`:

```env
VITE_FIREBASE_API_KEY=YOUR_REAL_API_KEY
VITE_FIREBASE_AUTH_DOMAIN=keeptrip-app-b06b3.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=keeptrip-app-b06b3
VITE_FIREBASE_STORAGE_BUCKET=keeptrip-app-b06b3.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=YOUR_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID=YOUR_APP_ID

# Para producción, desactiva emuladores:
VITE_USE_EMULATORS=false
```

---

## ✅ Lo que ya está corregido

### Console Errors Solucionados

| Error | Causa | Solución |
|-------|-------|----------|
| `VITE_MAPBOX_TOKEN=undefined` | Faltaba en `.env` | ✅ Agregado a `.env` |
| React key `undefined` warnings | Fotos/items sin ID | ✅ Agregadas claves de fallback |
| Firebase credentials warning | Config de emuladores | ✅ Es normal, sin acción |
| Mapbox GL initialization errors | Token faltante | ✅ Será resuelto al configurar token |
| Mapbox geocoding 401 errors | Token en `undefined` | ✅ Será resuelto al configurar token |

### Cambios Realizados

1. **`.env`** - Estructura completa con todas las variables necesarias
2. **`src/shared/ui/components/GalleryGrid.jsx`** - Claves únicas para fotos
3. **`src/features/search/ui/SearchPalette/SearchPalette.jsx`** - Claves seguras para resultados
4. **`src/features/search/ui/SearchModal/SearchModal.jsx`** - Claves con fallback
5. **`src/shared/ui/components/CityManager.jsx`** - Claves para ciudades

---

## 🧪 Testing Después de Configurar

```bash
# 1. Actualiza .env con tokens reales
# 2. Reinicia el servidor dev
npm run dev

# 3. Abre consola (F12)
# ✅ No debería haber: "VITE_MAPBOX_TOKEN=undefined"
# ✅ No debería haber: "two children with the same key, `undefined`"
# ✅ Mapbox map debería cargar
# ✅ Búsqueda de ciudades debería funcionar
```

---

## 📝 Notas

- **Emulators en dev**: Las credenciales "demo" son correctas cuando `VITE_USE_EMULATORS=true`
- **Tokens públicos**: Mapbox requiere que el token sea público (en el cliente)
- **Dominio restrictions**: Protegen el token de abuso desde otros dominios
- **Firebase**: Usa credenciales reales solo en producción

---

**Próximo paso**: Reemplaza los tokens placeholder y reinicia el servidor ✨
