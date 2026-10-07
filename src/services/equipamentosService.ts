/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import type { Equipamento, EquipamentoStatus } from "../types";
import { db, storage } from "./firebase";

const EQUIPAMENTOS_COLLECTION = "equipamentos";

export const uploadImagemEquipamento = async (file: File): Promise<string> => {
  const timestamp = Date.now();
  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storageRef = ref(storage, `equipamentos/${timestamp}_${sanitizedFileName}`);
  const snapshot = await uploadBytes(storageRef, file);
  return await getDownloadURL(snapshot.ref);
};

export const excluirImagemEquipamentoStorage = async (url: string): Promise<void> => {
  if (!url) return;
  try {
    const fileRef = ref(storage, url);
    await deleteObject(fileRef);
  } catch (err) {
    console.warn("Erro ao excluir imagem do storage:", err);
  }
};

export const getEquipamentos = async (): Promise<Equipamento[]> => {
  const q = query(
    collection(db, EQUIPAMENTOS_COLLECTION),
    orderBy("patrimonio", "asc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as Equipamento[];
};

export const getEquipamentosBySetor = async (
  setor_id: string
): Promise<Equipamento[]> => {
  const q = query(
    collection(db, EQUIPAMENTOS_COLLECTION),
    where("setor_id", "==", setor_id)
  );
  const snapshot = await getDocs(q);
  const list = snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as Equipamento[];
  return list.sort((a, b) =>
    (a.patrimonio || "").localeCompare(b.patrimonio || "")
  );
};

export const getEquipamentoById = async (
  id: string
): Promise<Equipamento | null> => {
  const docRef = doc(db, EQUIPAMENTOS_COLLECTION, id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as Equipamento;
};

export const criarEquipamento = async (
  equipamento: Omit<Equipamento, "id" | "criado_em">
): Promise<string> => {
  const dadosLimpos = Object.fromEntries(
    Object.entries(equipamento).filter(([_, v]) => v !== undefined)
  );

  const docRef = await addDoc(collection(db, EQUIPAMENTOS_COLLECTION), {
    ...dadosLimpos,
    total_manutencoes_concluidas: 0,
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

export const incrementarManutencoesConcluidas = async (
  id: string,
  novoStatus?: EquipamentoStatus
): Promise<void> => {
  const docRef = doc(db, EQUIPAMENTOS_COLLECTION, id);
  const payload: Record<string, any> = {
    total_manutencoes_concluidas: increment(1),
  };
  if (novoStatus) {
    payload.status = novoStatus;
  }
  await updateDoc(docRef, payload);
};

export const atualizarEquipamento = async (
  id: string,
  dados: Record<string, any>
): Promise<void> => {
  const dadosLimpos = Object.fromEntries(
    Object.entries(dados).filter(([_, v]) => v !== undefined)
  );
  const docRef = doc(db, EQUIPAMENTOS_COLLECTION, id);
  await updateDoc(docRef, dadosLimpos);
};

export const excluirEquipamento = async (id: string, imagemUrl?: string): Promise<void> => {
  if (imagemUrl) {
    await excluirImagemEquipamentoStorage(imagemUrl);
  }
  const docRef = doc(db, EQUIPAMENTOS_COLLECTION, id);
  await deleteDoc(docRef);
};

