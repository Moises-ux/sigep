/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { updatePassword } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  LogOut,
  ShieldAlert,
} from "lucide-react";
import { auth, db } from "../services/firebase";
import { useAuth } from "../contexts/AuthContext";

export const AlterarSenhaPrimeiroAcessoPage: React.FC = () => {
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [showNovaSenha, setShowNovaSenha] = useState(false);
  const [showConfirmarSenha, setShowConfirmarSenha] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { usuarioData, signOutUser, refreshUsuarioData } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (novaSenha.length < 6) {
      setError("A nova senha deve possuir pelo menos 6 caracteres.");
      return;
    }

    if (novaSenha === "Mudar@123456") {
      setError("Por favor, crie uma senha diferente da senha provisória.");
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setError("A confirmação de senha não confere com a nova senha digitada.");
      return;
    }

    if (!auth.currentUser) {
      setError("Sessão de usuário inválida ou expirada. Faça login novamente.");
      return;
    }

    setSubmitting(true);

    try {
      // 1. Atualiza a senha no Firebase Auth
      await updatePassword(auth.currentUser, novaSenha);

      // 2. Remove a flag de primeiro acesso no Firestore
      const userDocRef = doc(db, "usuarios", auth.currentUser.uid);
      await updateDoc(userDocRef, {
        primeiro_acesso: false,
      });

      // 3. Atualiza os dados do usuário no contexto e navega para o Dashboard
      await refreshUsuarioData();
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      console.error("Erro ao alterar senha de primeiro acesso:", err);
      if (err.code === "auth/requires-recent-login") {
        setError("Por motivos de segurança, sua sessão expirou. Faça login novamente para alterar sua senha.");
      } else {
        setError(err.message || "Erro ao atualizar a senha. Tente novamente.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden antialiased selection:bg-blue-500 selection:text-white">
      {/* Luzes de Fundo Ambientais */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl p-8 backdrop-blur-xl relative z-10 space-y-6">
        {/* Cabeçalho do Cartão */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-14 h-14 bg-amber-500/15 border border-amber-500/30 rounded-2xl flex items-center justify-center text-amber-400 shadow-inner mb-1">
            <KeyRound className="w-7 h-7" />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-white tracking-wider font-mono">
              SIGEP
            </h1>
          </div>
          <h2 className="text-sm font-bold text-slate-200">
            Alteração Obrigatória de Senha
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Bem-vindo(a), <span className="text-slate-200 font-semibold">{usuarioData?.nome || "Usuário"}</span>! Por motivos de segurança, você precisa criar uma nova senha pessoal no seu primeiro acesso.
          </p>
        </div>

        {/* Alerta de Erro */}
        {error && (
          <div className="bg-red-950/40 border border-red-900/60 text-red-300 text-xs rounded-xl p-4 flex items-start gap-3 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-200">Atenção</p>
              <p className="text-red-300/80 text-[11px] mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Formulário de Alteração de Senha */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
              Nova Senha Pessoal *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showNovaSenha ? "text" : "password"}
                required
                minLength={6}
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                placeholder="No mínimo 6 caracteres"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-950/80 border border-slate-800 text-slate-100 placeholder-slate-500 text-xs font-mono rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowNovaSenha(!showNovaSenha)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                title={showNovaSenha ? "Ocultar senha" : "Exibir senha"}
              >
                {showNovaSenha ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
              Confirmar Nova Senha *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showConfirmarSenha ? "text" : "password"}
                required
                minLength={6}
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                placeholder="Repita a nova senha"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-950/80 border border-slate-800 text-slate-100 placeholder-slate-500 text-xs font-mono rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowConfirmarSenha(!showConfirmarSenha)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                title={showConfirmarSenha ? "Ocultar senha" : "Exibir senha"}
              >
                {showConfirmarSenha ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Dica de Requisitos de Senha */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 space-y-1.5 text-[11px]">
            <div className="flex items-center gap-1.5 text-slate-300 font-medium">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Requisitos da Nova Senha:</span>
            </div>
            <ul className="text-[10px] text-slate-400 space-y-1 pl-5 list-disc">
              <li>Possuir no mínimo 6 caracteres</li>
              <li>Ser diferente da senha provisória ("Mudar@123456")</li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-4 rounded-xl shadow-lg shadow-blue-600/20 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-xs mt-2 group"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Atualizando Senha...</span>
              </>
            ) : (
              <>
                <span>Salvar Nova Senha e Continuar</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>
        </form>

        {/* Botão de Cancelar / Sair */}
        <div className="pt-4 border-t border-slate-800/80 text-center">
          <button
            type="button"
            onClick={signOutUser}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-400 transition-colors font-mono"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Cancelar e Sair do Sistema</span>
          </button>
        </div>
      </div>
    </div>
  );
};
