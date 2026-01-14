# Reglas de Firestore ACTUALIZADAS

Reemplaza las reglas actuales con estas (arregladas):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function getUserId() {
      return request.auth.uid;
    }
    
    function isMemberOfGroup(groupId) {
      return isAuthenticated() && 
        exists(/databases/$(database)/documents/groups/$(groupId)/members/$(getUserId()));
    }
    
    function getMemberRole(groupId) {
      return get(/databases/$(database)/documents/groups/$(groupId)/members/$(getUserId())).data.role;
    }
    
    function isOwner(groupId) {
      return isMemberOfGroup(groupId) && getMemberRole(groupId) == 'owner';
    }
    
    function isEditor(groupId) {
      return isMemberOfGroup(groupId) && (getMemberRole(groupId) == 'owner' || getMemberRole(groupId) == 'editor');
    }
    
    function groupAllowsPublicRead(groupId) {
      return get(/databases/$(database)/documents/groups/$(groupId)).data.publicRead == true;
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create, update: if isAuthenticated() && getUserId() == userId;
    }
    
    // Groups collection
    match /groups/{groupId} {
      // Allow reading own groups via members subcollection query
      allow read: if isMemberOfGroup(groupId) || groupAllowsPublicRead(groupId);
      allow create: if isAuthenticated();
      allow update: if isOwner(groupId);
      allow delete: if isOwner(groupId);
      
      // Members subcollection - CRITICAL FIX
      match /members/{userId} {
        // Users can read their own membership to determine group access
        allow read: if isAuthenticated() && (getUserId() == userId || isMemberOfGroup(groupId));
        allow create: if isAuthenticated() && getUserId() == userId; // Can create own membership
        allow update, delete: if isOwner(groupId); // Only owner can modify others
      }
      
      // Originals subcollection
      match /originals/{originalId} {
        allow read: if isMemberOfGroup(groupId) || groupAllowsPublicRead(groupId);
        allow create, update, delete: if isEditor(groupId);
      }
      
      // Dupes subcollection
      match /dupes/{dupeId} {
        allow read: if isMemberOfGroup(groupId) || groupAllowsPublicRead(groupId);
        allow create, update, delete: if isEditor(groupId);
        
        // Offers subcollection
        match /offers/{offerId} {
          allow read: if isMemberOfGroup(groupId) || groupAllowsPublicRead(groupId);
          allow create, update, delete: if isEditor(groupId);
        }
        
        // Votes subcollection
        match /votes/{voteUserId} {
          allow read: if isMemberOfGroup(groupId);
          allow create, update: if isAuthenticated() && isMemberOfGroup(groupId) && getUserId() == voteUserId;
          allow delete: if isAuthenticated() && getUserId() == voteUserId;
        }
      }
      
      // Expeditions subcollection
      match /expeditions/{expeditionId} {
        allow read: if isMemberOfGroup(groupId);
        allow create, update, delete: if isEditor(groupId);
        
        match /items/{itemId} {
          allow read: if isMemberOfGroup(groupId);
          allow create, update, delete: if isEditor(groupId);
        }
      }
    }
  }
}
```

## Cambios Importantes:

1. **Renombrado `isMember` a `isMemberOfGroup`** para evitar confusión
2. **FIX CRÍTICO en `/members/{userId}`**: Ahora permite que cualquier usuario autenticado lea su propia membresía, lo cual es necesario para el collection group query
3. Permite crear propia membresía al unirse a grupos

## Cómo Aplicar:

1. Ve a Firebase Console → Firestore Database → Rules
2. **Reemplaza TODO** el contenido con el código de arriba
3. Click en **"Publicar"**

Esto resolverá el error de permisos.
