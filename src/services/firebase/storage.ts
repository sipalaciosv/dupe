import { storage } from './index'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'

export const uploadImage = async (
    file: File,
    path: string
): Promise<string> => {
    try {
        const storageRef = ref(storage, path)
        await uploadBytes(storageRef, file)
        const downloadURL = await getDownloadURL(storageRef)
        return downloadURL
    } catch (error) {
        console.error('Error uploading image:', error)
        throw error
    }
}

export const deleteImage = async (path: string): Promise<void> => {
    try {
        const storageRef = ref(storage, path)
        await deleteObject(storageRef)
    } catch (error) {
        console.error('Error deleting image:', error)
        throw error
    }
}

export const getDupeImagePath = (groupId: string, dupeId: string, fileName: string) => {
    return `groups/${groupId}/dupes/${dupeId}/${fileName}`
}
