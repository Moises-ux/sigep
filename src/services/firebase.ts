import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut as secondarySignOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { salvarPerfilUsuario } from './usuariosService';
import type { Role } from '../types';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

export const cadastrarNovoUsuarioPorAdmin = async (
  email: string,
  pass: string,
  nome: string,
  papel: Role,
  setor_id: string,
  telefone?: string
): Promise<string> => {
  const secondaryApp = getApps().find(a => a.name === 'SecondaryAdminApp') 
    || initializeApp(firebaseConfig, 'SecondaryAdminApp');
  const secondaryAuth = getAuth(secondaryApp);

  try {
    const credential = await createUserWithEmailAndPassword(secondaryAuth, email, pass);
    const uid = credential.user.uid;

    await salvarPerfilUsuario(uid, {
      nome,
      email,
      papel,
      setor_id,
      telefone,
      ativo: true,
    });

    await secondarySignOut(secondaryAuth);
    return uid;
  } catch (err) {
    await secondarySignOut(secondaryAuth);
    throw err;
  }
};
