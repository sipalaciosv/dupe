# Firebase Security Rules

Este documento contiene las reglas de seguridad de Firestore y Storage para DupeZOFRI.

## Firestore Security Rules

Copia y pega estas reglas en Firebase Console → Firestore Database → Rules:

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
    
    function isMember(groupId) {
      return isAuthenticated() && 
        exists(/databases/$(database)/documents/groups/$(groupId)/members/$(getUserId()));
    }
    
    function getMemberRole(groupId) {
      return get(/databases/$(database)/documents/groups/$(groupId)/members/$(getUserId())).data.role;
    }
    
    function isOwner(groupId) {
      return isMember(groupId) && getMemberRole(groupId) == 'owner';
    }
    
    function isEditor(groupId) {
      return isMember(groupId) && (getMemberRole(groupId) == 'owner' || getMemberRole(groupId) == 'editor');
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
      allow read: if isMember(groupId) || groupAllowsPublicRead(groupId);
      allow create: if isAuthenticated();
      allow update: if isOwner(groupId);
      allow delete: if isOwner(groupId);
      
      // Members subcollection
      match /members/{userId} {
        allow read: if isMember(groupId);
        allow create: if isAuthenticated(); // Joining group
        allow update, delete: if isOwner(groupId); // Only owner can change roles/remove members
      }
      
      // Originals subcollection
      match /originals/{originalId} {
        allow read: if isMember(groupId) || groupAllowsPublicRead(groupId);
        allow create, update, delete: if isEditor(groupId);
      }
      
      // Dupes subcollection
      match /dupes/{dupeId} {
        allow read: if isMember(groupId) || groupAllowsPublicRead(groupId);
        allow create, update, delete: if isEditor(groupId);
        
        // Offers subcollection
        match /offers/{offerId} {
          allow read: if isMember(groupId) || groupAllowsPublicRead(groupId);
          allow create, update, delete: if isEditor(groupId);
        }
        
        // Votes subcollection
        match /votes/{voteUserId} {
          // Members can see all votes, public users cannot
          allow read: if isMember(groupId);
          // Users can only create/update their own vote
          allow create, update: if isAuthenticated() && isMember(groupId) && getUserId() == voteUserId;
          allow delete: if isAuthenticated() && getUserId() == voteUserId;
        }
      }
      
      // Expeditions subcollection
      match /expeditions/{expeditionId} {
        allow read: if isMember(groupId);
        allow create, update, delete: if isEditor(groupId);
        
        // Expedition items
        match /items/{itemId} {
          allow read: if isMember(groupId);
          allow create, update, delete: if isEditor(groupId);
        }
      }
    }
  }
}
```

## Storage Security Rules

Copia y pega estas reglas en Firebase Console → Storage → Rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    // Helper function
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isMemberOfGroup(groupId) {
      return isAuthenticated() && 
        firestore.exists(/databases/(default)/documents/groups/$(groupId)/members/$(request.auth.uid));
    }
    
    function groupAllowsPublicRead(groupId) {
      return firestore.get(/databases/(default)/documents/groups/$(groupId)).data.publicRead == true;
    }
    
    // Dupe images
    match /groups/{groupId}/dupes/{dupeId}/{fileName} {
      // Members can read, public can read if group allows
      allow read: if isMemberOfGroup(groupId) || groupAllowsPublicRead(groupId);
      // Only authenticated members can upload
      allow write: if isMemberOfGroup(groupId);
      allow delete: if isMemberOfGroup(groupId);
    }
    
    // Prevent access to all other paths
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

## Explicación de las Reglas

### Firestore

1. **Users**: 
   - Cualquier usuario autenticado puede leer
   - Solo el propio usuario puede crear/actualizar su documento

2. **Groups**:
   - Lectura: miembros o vistas públicas (si `publicRead=true`)
   - Escritura: solo owner puede modificar grupo

3. **Members**:
   - Lectura: solo miembros del grupo
   - Creación: cualquier autenticado (unirse)
   - Modificación/eliminación: solo owner

4. **Originals, Dupes, Offers**:
   - Lectura: miembros o público (si habilitado)
   - Escritura: solo editors y owners

5. **Votes**:
   - **Lectura: SOLO MIEMBROS** (nunca público)
   - Escritura: cada usuario solo su propio voto

6. **Expeditions**:
   - Solo visibles para miembros
   - Escritura: editors y owners

### Storage

- Imágenes de dupes: lectura para miembros o público (si habilitado)
- Escritura: solo miembros
- Todo lo demás: denegado

## Desplegar Reglas

### Opción 1: Firebase Console (Manual)

1. Ve a Firebase Console
2. Firestore Database → Rules
3. Copia y pega las reglas de Firestore
4. Publicar

5. Storage → Rules
6. Copia y pega las reglas de Storage
7. Publicar

### Opción 2: Firebase CLI (Automático)

Crea archivos locales:

**firestore.rules**:
```
(Copia el contenido de arriba)
```

**storage.rules**:
```
(Copia el contenido de arriba)
```

Luego despliega con:
```bash
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
```

## Pruebas de Seguridad

Usa el simulador de reglas en Firebase Console para probar:

1. Usuario no autenticado intentando leer grupos privados → Debe fallar
2. Usuario no autenticado leyendo grupo público → Debe pasar
3. Viewer intentando crear dupe → Debe fallar
4. Editor creando dupe → Debe pasar
5. Usuario leyendo votos en vista pública → Debe fallar
6. Miembro leyendo votos → Debe pasar
