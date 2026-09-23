import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import type { AssistenciaTecnica } from '../types';

const ASSISTENCIAS_COLLECTION = 'assistencias_tecnicas';

export const getAssistenciasTecnicas = async (): Promise<AssistenciaTecnica[]> => {
  try {
    const snapshot = await getDocs(collection(db, ASSISTENCIAS_COLLECTION));
    const list = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as AssistenciaTecnica[];
    return list.sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
  } catch (err) {
    console.error('Erro ao buscar assistências técnicas:', err);
    return [];
  }
};

export const getAssistenciaById = async (id: string): Promise<AssistenciaTecnica | null> => {
  const docRef = doc(db, ASSISTENCIAS_COLLECTION, id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as AssistenciaTecnica;
};

export const criarAssistenciaTecnica = async (
  dados: Omit<AssistenciaTecnica, 'id' | 'criado_em'>
): Promise<string> => {
  const docRef = await addDoc(collection(db, ASSISTENCIAS_COLLECTION), {
    ...dados,
    ativo: dados.ativo ?? true,
    criado_em: serverTimestamp(),
  });
  return docRef.id;
};

export const atualizarAssistenciaTecnica = async (
  id: string,
  dados: Partial<Omit<AssistenciaTecnica, 'id' | 'criado_em'>>
): Promise<void> => {
  const docRef = doc(db, ASSISTENCIAS_COLLECTION, id);
  await updateDoc(docRef, dados);
};

export const excluirAssistenciaTecnica = async (id: string): Promise<void> => {
  const docRef = doc(db, ASSISTENCIAS_COLLECTION, id);
  await deleteDoc(docRef);
};
