# 🔥 Índice de Firestore Requerido

El error que viste indica que necesitas crear un índice en Firestore para consultar los dupes.

## 📋 Solución Rápida:

1. **Haz click en este link** que Firebase te dio en la consola:
   ```
   https://console.firebase.google.com/v1/r/project/dupe-ac52d/firestore/indexes?create_composite=...
   ```

2. O ve manualmente a:
   - **Firebase Console** → tu proyecto `dupe-ac52d`
   - **Firestore Database** → **Indexes** (pestaña)
   - Click en **"Create Index"**

3. **Configuración del índice:**
   - Collection: `dupes`
   - Fields to index:
     * `originalId` - Ascending
     * `nombre` - Ascending
   - Query scope: **Collection**

4. Click en **"Create"**

5. **Espera 1-2 minutos** a que el índice se construya

6. **Recarga tu app** - ahora deberías ver los dupes en la página del original

## ⚡ Nota:
Este índice es necesario porque estás filtrando por `originalId` Y ordenando por `nombre` al mismo tiempo. Firestore requiere índices compuestos para este tipo de queries.

---

## 🔧 Otros problemas arreglados:

✅ **Fotos de originales** ahora se muestran en la lista
✅ **Foto del dupe** ajustada para que se vea completa (no cortada)
✅ **Caché de Vite limpiado** - reinicia el servidor para ver los cambios

Después de crear el índice, todo debería funcionar perfectamente! 🎉
