import { Timestamp } from 'firebase/firestore'

// User types
export interface User {
    id: string
    email: string
    displayName: string
    photoURL?: string
    createdAt: Timestamp
}

// Role types
export type MemberRole = 'owner' | 'editor' | 'viewer'

export interface Member {
    userId: string
    role: MemberRole
    joinedAt: Timestamp
    displayName?: string
    photoURL?: string
}

// Group types
export interface Group {
    id: string
    name: string
    ownerId: string
    inviteCode: string
    publicRead: boolean
    publicSlug: string
    createdAt: Timestamp
    createdBy: string
}

// Store availability
export interface StoreAvailability {
    tiendaNombre: string
    precio: number
    fecha?: Timestamp
    nota?: string
    agotado?: boolean
}

// Group Store - reusable store list
export interface GroupStore {
    id: string
    groupId: string
    nombre: string
    tipo: 'fisica' | 'online'
    createdBy: string
    createdAt: Timestamp
}

// Original perfume types
export interface Original {
    id: string
    groupId: string
    nombre: string
    marca?: string
    ml?: number
    urlFragrantica?: string
    imagenPrincipal?: string
    tags?: string[]
    slug: string
    createdAt: { seconds: number; nanoseconds: number }
    createdBy: string
    createdByName?: string
    createdByPhoto?: string
    editedBy?: string
    editedByName?: string
    editedByPhoto?: string
    tiendas?: StoreAvailability[]
}

// Dupe types
export interface DupeUrls {
    fragrantica?: string
    marca?: string
    otros?: string[]
}

export interface Dupe {
    id: string
    groupId: string
    originalId: string
    nombre: string
    marca?: string
    ml?: number
    urls?: {
        [key: string]: string
    }
    imagenPrincipal?: string
    tags?: string[]
    slug: string
    createdAt: { seconds: number; nanoseconds: number }
    createdBy: string
    createdByName?: string
    createdByPhoto?: string
    editedBy?: string
    editedByName?: string
    editedByPhoto?: string
    tiendas?: StoreAvailability[]
    // Aggregated fields (calculated)
    avgParecido?: number
    avgGustoAlAplicar?: number
    avgGustoDespues?: number
    votesCount?: number
}

// Offer types
export interface Offer {
    id: string
    dupeId: string
    tienda: string
    precio: number
    fecha: Timestamp | string
    urlTienda?: string
    nota?: string
    createdBy: string
    createdAt: Timestamp
}

// Vote types
export interface Vote {
    dupeId: string
    userId: string
    parecido: number // 0-10
    gustoAlAplicar: number // 0-10
    gustoDespues: number // 0-10
    comentario?: string
    updatedAt: Timestamp
    displayName?: string
    photoURL?: string
}

// Expedition types
export type ExpeditionStatus = 'activa' | 'cerrada'
export type ExpeditionItemStatus = 'por_probar' | 'probado' | 'no_encontre' | 'me_lo_llevo'

export interface Expedition {
    id: string
    groupId: string
    nombre: string
    fecha: Timestamp
    estado: ExpeditionStatus
    createdBy: string
    createdAt: Timestamp
}

export interface ExpeditionItem {
    id: string
    expeditionId: string
    dupeId?: string
    nombre?: string // For quick draft items
    originalId?: string
    status: ExpeditionItemStatus
    notasRapidas?: string
    updatedAt: Timestamp
    updatedBy: string
}

// View models
export interface OriginalWithDupes extends Original {
    dupesCount: number
}

export interface DupeWithOriginal extends Dupe {
    originalNombre: string
    originalMarca?: string
    minPrice?: number
}

// Form types
export interface OriginalFormData {
    nombre: string
    marca: string
    ml: number | null
    urlFragrantica: string
    tags: string[]
    imageFile?: File | null
    tiendas?: StoreAvailability[]
}

export interface DupeFormData {
    originalId: string
    nombre: string
    marca: string
    ml: number | null
    urls: {
        fragrantica: string
        marca: string
        otros: string[]
    }
    tags: string[]
    imageFile?: File
    tiendas?: StoreAvailability[]
}

export interface OfferFormData {
    tienda: string
    precio: number
    fecha: string
    urlTienda: string
    nota: string
}

export interface VoteFormData {
    parecido: number
    gustoAlAplicar: number
    gustoDespues: number
    comentario: string
}
