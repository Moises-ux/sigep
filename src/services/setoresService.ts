import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc,
  deleteDoc,
  serverTimestamp, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { db } from './firebase';
import type { Setor } from '../types';

const SETORES_COLLECTION = 'setores';

export const getSetores = async (): Promise<Setor[]> => {
  const q = query(collection(db, SETORES_COLLECTION), orderBy('nome', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as Setor[];
};

export const getSetorById = async (id: string): Promise<Setor | null> => {
  const docRef = doc(db, SETORES_COLLECTION, id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as Setor;
};

export const criarSetor = async (setor: Omit<Setor, 'id' | 'criado_em'>): Promise<string> => {
  const docRef = await addDoc(collection(db, SETORES_COLLECTION), {
    ...setor,
    criado_em: serverTimestamp(),
  });
  return docRef.id;
};

export const atualizarSetor = async (
  id: string,
  setor: Partial<Omit<Setor, 'id' | 'criado_em'>>
): Promise<void> => {
  const docRef = doc(db, SETORES_COLLECTION, id);
  await updateDoc(docRef, { ...setor });
};

export const excluirSetor = async (id: string): Promise<void> => {
  const docRef = doc(db, SETORES_COLLECTION, id);
  await deleteDoc(docRef);
};
