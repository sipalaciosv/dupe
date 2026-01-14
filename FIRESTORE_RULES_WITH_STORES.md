```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function getUserId() {
      return request.auth.uid;
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create, update: if isAuthenticated() && getUserId() == userId;
    }
    
    // Groups collection - SIMPLIFIED FOR MVP
    match /groups/{groupId} {
      // Allow authenticated users to list groups (they'll filter by membership in code)
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update, delete: if isAuthenticated() && 
        get(/databases/$(database)/documents/groups/$(groupId)/members/$(getUserId())).data.role == 'owner';
      
      // Members subcollection
      match /members/{userId} {
        allow read: if isAuthenticated();
        allow create: if isAuthenticated();
        allow update, delete: if isAuthenticated() && 
          get(/databases/$(database)/documents/groups/$(groupId)/members/$(getUserId())).data.role == 'owner';
      }
      
      // Stores subcollection
      match /stores/{storeId} {
        allow read: if isAuthenticated();
        allow create, update, delete: if isAuthenticated();
      }
      
      // Originals subcollection
      match /originals/{originalId} {
        allow read: if isAuthenticated();
        allow create, update, delete: if isAuthenticated();
        
        // **NEW: Original votes subcollection**
        match /votes/{voteUserId} {
          allow read: if isAuthenticated();
          allow create, update: if isAuthenticated() && getUserId() == voteUserId;
          allow delete: if isAuthenticated() && getUserId() == voteUserId;
        }
      }
      
      // Dupes subcollection
      match /dupes/{dupeId} {
        allow read: if isAuthenticated();
        allow create, update, delete: if isAuthenticated();
        
        match /offers/{offerId} {
          allow read: if isAuthenticated();
          allow create, update, delete: if isAuthenticated();
        }
        
        match /votes/{voteUserId} {
          allow read: if isAuthenticated();
          allow create, update: if isAuthenticated() && getUserId() == voteUserId;
          allow delete: if isAuthenticated() && getUserId() == voteUserId;
        }
      }
      
      // Expeditions subcollection
      match /expeditions/{expeditionId} {
        allow read: if isAuthenticated();
        allow create, update, delete: if isAuthenticated();
        
        match /items/{itemId} {
          allow read: if isAuthenticated();
          allow create, update, delete: if isAuthenticated();
        }
      }
    }
  }
}
```

## Cambios Realizados

1. **Stores subcollection** (líneas 37-40) - Ya agregada antes
2. **✨ NUEVO: Original votes subcollection** (líneas 47-51)
   - Permite leer todos los votos
   - Crear/actualizar solo tu propio voto
   - Eliminar solo tu propio voto

## Cómo Actualizar en Firebase

1. Ve a Firebase Console
2. Firestore → Rules
3. Copia todo el contenido de arriba
4. Pega en el editor
5. Click **Publicar**

Sin esto, los votos de originales darán error de permisos.
