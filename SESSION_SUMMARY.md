# Resumen de Sesión: Sistema de Tiendas

## ✅ COMPLETADO

### Sistema de Tiendas Reutilizables
- Selector de tiendas en formularios (crear)
- Botón "+ Agregar Tienda" en perfumes existentes
- Autocomplete con tiendas del grupo
- Lista de tiendas con precio y fecha
- Backend completo (`useStores.ts`)

### Simplificaciones
- Tipo concentración eliminado de dupes
- Campo ML agregado a originales
- Imágenes visibles en `CardOriginal`
- Link Fragrantica visible en dupes

### Permisos Arreglados
- Botón tiendas visible para todos (`canVote()`)
- Reglas Firestore preparadas (debes publicarlas)

## ⏳ PENDIENTE

### Votos para Originales
Actualmente NO puedes votar originales. Solo dupes tienen sistema de votos.

**¿Quieres que agregue votos a originales?**

Sería similar a dupes:
- Botón "Votar este perfume"
- Parecido/Gusto al aplicar/Gusto después
- Promedio del grupo
- Tu voto editable

**Tiempo:** 15-20 minutos

## 📝 Archivos Importantes

- `FIRESTORE_RULES_WITH_STORES.md` - Debes publicar estas reglas
- `useStores.ts` - Composable de tiendas
- `OriginalDetail.vue` - Lista tiendas + agregar
- `DupeDetail.vue` - Lista tiendas + agregar
- `NewItem.vue` - Selector tiendas en crear

¿Procedo con votos para originales?
