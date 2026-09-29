import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';
import { deleteUser } from 'firebase/auth';
import { db, auth } from './firebase';
import { excluirContaAuthPorAdmin } from './adminAuthService';
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

export const deletarUsuario = async (id: string): Promise<void> => {
  // 1. Excluir a conta de autenticação do usuário no Firebase Auth via API Admin
  await excluirContaAuthPorAdmin(id);

  // 2. Se for o próprio usuário atualmente autenticado, excluir sessão local do Auth
  if (auth.currentUser && auth.currentUser.uid === id) {
    try {
      await deleteUser(auth.currentUser);
    } catch (authErr) {
      console.warn("Erro ao excluir sessão local do Firebase Auth:", authErr);
    }
  }

  // 3. Excluir o documento do usuário no Firestore após a exclusão da conta Auth
  const docRef = doc(db, USUARIOS_COLLECTION, id);
  await deleteDoc(docRef);
};
