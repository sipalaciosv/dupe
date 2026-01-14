import { db } from './index'
import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    Timestamp,
    CollectionReference,
    DocumentReference,
    QueryConstraint,
    addDoc,
} from 'firebase/firestore'

// Collection references
export const usersCollection = () => collection(db, 'users')
export const groupsCollection = () => collection(db, 'groups')
export const groupMembersCollection = (groupId: string) =>
    collection(db, `groups/${groupId}/members`)
export const originalsCollection = (groupId: string) =>
    collection(db, `groups/${groupId}/originals`)
export const dupesCollection = (groupId: string) =>
    collection(db, `groups/${groupId}/dupes`)
export const offersCollection = (groupId: string, dupeId: string) =>
    collection(db, `groups/${groupId}/dupes/${dupeId}/offers`)
export const votesCollection = (groupId: string, dupeId: string) =>
    collection(db, `groups/${groupId}/dupes/${dupeId}/votes`)
export const expeditionsCollection = (groupId: string) =>
    collection(db, `groups/${groupId}/expeditions`)
export const expeditionItemsCollection = (groupId: string, expeditionId: string) =>
    collection(db, `groups/${groupId}/expeditions/${expeditionId}/items`)

// Document references
export const userDoc = (userId: string) => doc(db, 'users', userId)
export const groupDoc = (groupId: string) => doc(db, 'groups', groupId)
export const memberDoc = (groupId: string, userId: string) =>
    doc(db, `groups/${groupId}/members`, userId)
export const originalDoc = (groupId: string, originalId: string) =>
    doc(db, `groups/${groupId}/originals`, originalId)
export const dupeDoc = (groupId: string, dupeId: string) =>
    doc(db, `groups/${groupId}/dupes`, dupeId)
export const offerDoc = (groupId: string, dupeId: string, offerId: string) =>
    doc(db, `groups/${groupId}/dupes/${dupeId}/offers`, offerId)
export const voteDoc = (groupId: string, dupeId: string, userId: string) =>
    doc(db, `groups/${groupId}/dupes/${dupeId}/votes`, userId)
export const expeditionDoc = (groupId: string, expeditionId: string) =>
    doc(db, `groups/${groupId}/expeditions`, expeditionId)

// Helper functions
export const createDocument = async (
    collectionRef: CollectionReference,
    data: any
) => {
    const docRef = await addDoc(collectionRef, {
        ...data,
        createdAt: Timestamp.now(),
    })
    return docRef
}

export const setDocument = async (docRef: DocumentReference, data: any) => {
    await setDoc(docRef, {
        ...data,
        createdAt: Timestamp.now(),
    })
}

export const updateDocument = async (docRef: DocumentReference, data: any) => {
    await updateDoc(docRef, data)
}

export const getDocument = async (docRef: DocumentReference) => {
    const snapshot = await getDoc(docRef)
    if (!snapshot.exists()) return null
    return { id: snapshot.id, ...snapshot.data() }
}

export const queryDocuments = async (
    collectionRef: CollectionReference,
    ...constraints: QueryConstraint[]
) => {
    const q = query(collectionRef, ...constraints)
    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
}

export const deleteDocument = async (docRef: DocumentReference) => {
    await deleteDoc(docRef)
}

// Timestamp helpers
export { Timestamp, where, orderBy }
