# DupeZOFRI

**MVP para registro y comparación de perfumes árabes (dupes) en ZOFRI**

Mobile-first web app construida con Vue 3, TypeScript, Firebase y TailwindCSS para que tú y tus amigos registren perfumes árabes, comparen precios por tiendas/módulos, y colaboren en grupo.

## 🚀 Stack Tecnológico

- **Frontend**: Vue 3 + Vite + TypeScript
- **Router**: Vue Router 4
- **State Management**: Pinia
- **UI**: TailwindCSS
- **Backend**: Firebase (Auth + Firestore + Storage)
- **Deploy**: Vercel

## 📋 Funcionalidades Principales

### Autenticación
- Google Sign-In (Firebase Auth)
- Gestión de usuarios autenticados

### Grupos Colaborativos
- Crear grupos con amigos
- Sistema de invitación por código
- Roles (owner/editor/viewer) para control de permisos
- Vista pública compartible (solo lectura con promedios)

### Gestión de Perfumes
- **Originales**: Perfumes caros de referencia
- **Dupes**: Perfumes árabes alternativos
  - Subir fotografías
  - Tipo de concentración (EDP, EDT, Extrait, etc.)
  - Tags personalizados
  - Links a Fragrantica y páginas de marca

### Ofertas y Precios
- Registrar precios por tienda/módulo
- Historial de precios
- Destacar la oferta más barata

### Sistema de Votación
- Votar parecido (0-10)
- Gusto al aplicar (0-10)
- Gusto después (0-10)
- Comentarios (solo visibles para miembros)
- Promedios automáticos del grupo

### Modo Expedición
- Crear sesiones de compras en ZOFRI
- Marcar items: por probar, probado, no encontré, me lo llevo
- Votar rápidamente en terreno

## 📦 Instalación

### 1. Clonar el repositorio

```bash
cd dupe
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar Firebase

#### 3.1 Crear Proyecto Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Crea un nuevo proyecto
3. Habilita **Google Sign-In** en Authentication → Sign-in method
4. Crea una base de datos **Firestore**
5. Crea un bucket de **Storage**

#### 3.2 Obtener Credenciales

1. Project Settings → General
2. Scroll a "Your apps" → Web app
3. Copia las credenciales de configuración

#### 3.3 Configurar Variables de Entorno

Crea un archivo `.env` basado en `.env.example`:

```bash
cp .env.example .env
```

Edita `.env` con tus credenciales de Firebase:

```env
VITE_FIREBASE_API_KEY=tu_api_key
VITE_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu_proyecto_id
VITE_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
VITE_FIREBASE_APP_ID=tu_app_id
```

### 4. Configurar Reglas de Seguridad

Ver archivo `SECURITY_RULES.md` para las reglas de Firestore y Storage.

### 5. Ejecutar en Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

## 🚢 Deploy en Vercel

### 1. Preparar para Deploy

```bash
npm run build
```

### 2. Deploy con Vercel CLI

```bash
npm install -g vercel
vercel
```

### 3. Configurar Variables de Entorno en Vercel

En el dashboard de Vercel:
- Settings → Environment Variables
- Agregar todas las variables `VITE_FIREBASE_*` del archivo `.env`

### 4. Deploy Automático

Conecta tu repositorio de GitHub a Vercel para deploys automáticos en cada push.

## 📁 Estructura del Proyecto

```
dupe/
├── src/
│   ├── components/
│   │   ├── cards/          # CardOriginal, CardDupe
│   │   └── layout/         # TopBar, BottomNav
│   ├── composables/        # Lógica de negocio reutilizable
│   │   ├── useAuth.ts
│   │   ├── useGroups.ts
│   │   ├── useOriginals.ts
│   │   ├── useDupes.ts
│   │   ├── useOffers.ts
│   │   ├── useVotes.ts
│   │   ├── useExpeditions.ts
│   │   └── usePermissions.ts
│   ├── router/             # Vue Router
│   ├── services/           # Firebase
│   │   └── firebase/
│   │       ├── index.ts
│   │       ├── auth.ts
│   │       ├── firestore.ts
│   │       └── storage.ts
│   ├── stores/             # Pinia stores
│   │   ├── auth.ts
│   │   ├── groups.ts
│   │   └── currentGroup.ts
│   ├── types/              # TypeScript types
│   ├── views/              # Páginas/rutas
│   │   ├── Login.vue
│   │   ├── Home.vue
│   │   ├── Profile.vue
│   │   ├── OriginalDetail.vue
│   │   ├── DupeDetail.vue
│   │   ├── NewItem.vue
│   │   ├── Expedition.vue
│   │   └── PublicView.vue
│   ├── App.vue
│   ├── main.ts
│   └── style.css
├── .env.example
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── README.md
```

## 🗄️ Estructura Firestore

```
users/{userId}
groups/{groupId}
  - fields: name, ownerId, inviteCode, publicRead, publicSlug
  /members/{userId}
    - fields: role, joinedAt, displayName, photoURL
  /originals/{originalId}
    - fields: nombre, marca, urlFragrantica, tags, slug, createdAt, createdBy
  /dupes/{dupeId}
    - fields: originalId, nombre, marca, tipoConcentracion, ml, urls, imagenPrincipal, tags, slug, avgParecido, avgGustoAlAplicar, avgGustoDespues, votesCount, createdAt, createdBy
    /offers/{offerId}
      - fields: tienda, precio, fecha, urlTienda, nota, createdAt, createdBy
    /votes/{userId}
      - fields: parecido, gustoAlAplicar, gustoDespues, comentario, updatedAt, displayName, photoURL
  /expeditions/{expeditionId}
    - fields: nombre, fecha, estado, createdAt, createdBy
    /items/{itemId}
      - fields: dupeId, nombre, originalId, status, notasRapidas, updatedAt, updatedBy
```

## 🔐 Seguridad

- Solo usuarios autenticados pueden escribir
- Lectura privada: solo miembros del grupo
- Roles: owner (todo), editor (CRUD), viewer (solo lectura + votar)
- Vista pública: cuando `publicRead=true`, permite lectura anónima de originals, dupes, offers (sin votos individuales ni comentarios)

Ver `SECURITY_RULES.md` para detalles completos.

## 📱 Diseño Mobile-First

La aplicación está optimizada para uso en móvil con:
- Bottom navigation para fácil acceso con el pulgar
- Diseño responsive
- Touch-optimized interactions
- Quick actions para uso en terreno (ZOFRI)

## 🎯 TODOs Futuros

- [ ] Agregados consistentes con Cloud Functions (actualmente client-side)
- [ ] PWA con modo offline
- [ ] Familias olfativas y notas (scraping Fragrantica con Cloud Functions)
- [ ] Importar/exportar datos
- [ ] Notificaciones push para nuevas ofertas
- [ ] Búsqueda avanzada con filtros múltiples
- [ ] Gráficos de historial de precios
- [ ] Modo oscuro
- [ ] Tests automatizados (Vitest + Testing Library)

## 👥 Contribuir

Este es un MVP personal. Si quieres contribuir:
1. Fork el proyecto
2. Crea una feature branch
3. Commit tus cambios
4. Push a la branch
5. Abre un Pull Request

## 📄 Licencia

MIT License - siéntete libre de usar este código para tus propios proyectos.

## 🙏 Agradecimientos

Creado para organizar compras de perfumes árabes en ZOFRI con amigos. ¡Que disfrutes encontrando los mejores dupes!
