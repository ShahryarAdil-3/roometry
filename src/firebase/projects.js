import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'
import { db } from './firebase'

const PROJECTS_COLLECTION = 'rooms'

export const saveProjectSnapshot = async ({ uid, projectId, name, snapshot }) => {
  if (!uid) {
    throw new Error('User must be authenticated to save projects.')
  }

  const safeName = (name || 'Untitled Project').trim() || 'Untitled Project'
  const roomCount = snapshot?.floorPlan?.rooms?.length ?? 0

  if (projectId) {
    const projectRef = doc(db, PROJECTS_COLLECTION, projectId)
    const existing = await getDoc(projectRef)

    if (existing.exists() && existing.data()?.uid !== uid) {
      throw new Error('You do not have permission to edit this project.')
    }

    const basePayload = {
      uid,
      name: safeName,
      snapshot,
      roomCount,
      updatedAt: serverTimestamp(),
    }

    if (existing.exists()) {
      await setDoc(projectRef, basePayload, { merge: true })
    } else {
      await setDoc(projectRef, {
        ...basePayload,
        createdAt: serverTimestamp(),
      })
    }

    return projectId
  }

  const created = await addDoc(collection(db, PROJECTS_COLLECTION), {
    uid,
    name: safeName,
    snapshot,
    roomCount,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  return created.id
}

export const fetchProjectSnapshot = async ({ uid, projectId }) => {
  if (!uid || !projectId) {
    return null
  }

  const projectRef = doc(db, PROJECTS_COLLECTION, projectId)
  const snapshot = await getDoc(projectRef)
  if (!snapshot.exists()) {
    return null
  }

  const data = snapshot.data()
  if (data.uid !== uid) {
    throw new Error('You do not have permission to access this project.')
  }

  return {
    id: snapshot.id,
    ...data,
  }
}
