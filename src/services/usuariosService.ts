import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import type { Usuario } from '../types';

const USUARIOS_COLLECTION = 'usuarios';

export const getUsuarios = async (): Promise<Usuario[]> => {
  const q = query(collection(db, USUARIOS_COLLECTION), orderBy('nome', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as Usuario[];
};

export const getUsuarioById = async (id: string): Promise<Usuario | null> => {
  const docRef = doc(db, USUARIOS_COLLECTION, id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as Usuario;
};

export const salvarPerfilUsuario = async (
  id: string, 
  dados: Omit<Usuario, 'id' | 'criado_em'>
): Promise<void> => {
  const docRef = doc(db, USUARIOS_COLLECTION, id);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    await setDoc(docRef, {
      ...dados,
      criado_em: serverTimestamp(),
    });
  } else {
    await updateDoc(docRef, {
      ...dados,
    });
  }
};
