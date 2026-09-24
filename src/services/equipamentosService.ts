import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import type { Equipamento, EquipamentoStatus } from '../types';

const EQUIPAMENTOS_COLLECTION = 'equipamentos';

export const getEquipamentos = async (): Promise<Equipamento[]> => {
  const q = query(collection(db, EQUIPAMENTOS_COLLECTION), orderBy('patrimonio', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as Equipamento[];
};

export const getEquipamentosBySetor = async (setor_id: string): Promise<Equipamento[]> => {
  const q = query(
    collection(db, EQUIPAMENTOS_COLLECTION), 
    where('setor_id', '==', setor_id)
  );
  const snapshot = await getDocs(q);
  const list = snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as Equipamento[];
  return list.sort((a, b) => (a.patrimonio || '').localeCompare(b.patrimonio || ''));
};

export const getEquipamentoById = async (id: string): Promise<Equipamento | null> => {
  const docRef = doc(db, EQUIPAMENTOS_COLLECTION, id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as Equipamento;
};

export const criarEquipamento = async (
  equipamento: Omit<Equipamento, 'id' | 'criado_em'>
): Promise<string> => {
  const docRef = await addDoc(collection(db, EQUIPAMENTOS_COLLECTION), {
    ...equipamento,
    criado_em: serverTimestamp(),
  });
  return docRef.id;
};

export const atualizarStatusEquipamento = async (
  id: string, 
  status: EquipamentoStatus
): Promise<void> => {
  const docRef = doc(db, EQUIPAMENTOS_COLLECTION, id);
  await updateDoc(docRef, { status });
};

export const atualizarEquipamento = async (
  id: string,
  dados: Partial<Omit<Equipamento, 'id' | 'criado_em'>>
): Promise<void> => {
  const docRef = doc(db, EQUIPAMENTOS_COLLECTION, id);
  await updateDoc(docRef, dados);
};

export const excluirEquipamento = async (id: string): Promise<void> => {
  const docRef = doc(db, EQUIPAMENTOS_COLLECTION, id);
  await deleteDoc(docRef);
};
