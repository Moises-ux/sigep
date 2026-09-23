/* eslint-disable react-refresh/only-export-components */
import type { User } from "firebase/auth";
import {
  signOut as firebaseSignOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
} from "firebase/auth";
import React, { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../services/firebase";
import { getUsuarioById } from "../services/usuariosService";
import type { Usuario } from "../types";

interface AuthContextType {
  currentUser: User | null;
  usuarioData: Usuario | null;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  refreshUsuarioData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [usuarioData, setUsuarioData] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  const validateAndSetUser = async (user: User | null) => {
    if (!user) {
      setCurrentUser(null);
      setUsuarioData(null);
      return;
    }

    try {
      const data = await getUsuarioById(user.uid);
      if (!data || !data.ativo) {
        await firebaseSignOut(auth);
        setCurrentUser(null);
        setUsuarioData(null);
      } else {
        setCurrentUser(user);
        setUsuarioData(data);
      }
    } catch (error) {
      console.error("Erro ao verificar autorização do usuário:", error);
      await firebaseSignOut(auth);
      setCurrentUser(null);
      setUsuarioData(null);
    }
  };

  const refreshUsuarioData = async () => {
    if (currentUser) {
      await validateAndSetUser(currentUser);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      await validateAndSetUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, pass: string) => {
    const credential = await signInWithEmailAndPassword(auth, email, pass);
    const data = await getUsuarioById(credential.user.uid);

    if (!data || !data.ativo) {
      await firebaseSignOut(auth);
      throw new Error(
        "Acesso não autorizado ou inativo. Contate o Administrador de TI."
      );
    }
  };

  const signOutUser = async () => {
    await firebaseSignOut(auth);
    setCurrentUser(null);
    setUsuarioData(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        usuarioData,
        loading,
        signIn,
        signOutUser,
        refreshUsuarioData,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
};
