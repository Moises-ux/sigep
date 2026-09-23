import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Wrench, Lock, Mail, AlertCircle, Loader2, ArrowRight, ShieldCheck, Eye, EyeOff } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await signIn(email.trim(), password);
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Erro de autenticação:', err);
      if (err.message) {
        setError(err.message);
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('E-mail ou senha incorretos.');
      } else {
        setError('Falha ao autenticar. Tente novamente mais tarde.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden antialiased selection:bg-blue-500 selection:text-white">
      {/* Elementos de Fundo Ambientais / Efeitos de Luz */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl p-8 backdrop-blur-xl relative z-10 space-y-6">
        {/* Branding e Cabeçalho */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-14 h-14 bg-blue-600/15 border border-blue-500/30 rounded-2xl flex items-center justify-center text-blue-400 shadow-inner mb-1">
            <Wrench className="w-7 h-7" />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-white tracking-wider font-mono">SIGEP-TI</h1>
            <span className="text-[10px] font-mono font-medium px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md">
              Enterprise v2.0
            </span>
          </div>
          <p className="text-xs text-slate-400 font-medium">Prefeitura Municipal • Gestão de Assistência Externa</p>
        </div>

        {/* Alerta de Erro */}
        {error && (
          <div className="bg-red-950/40 border border-red-900/60 text-red-300 text-xs rounded-xl p-4 flex items-start gap-3 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-200">Acesso Recusado</p>
              <p className="text-red-300/80 text-[11px] mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Formulário de Login */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
              E-mail Institucional
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@prefeitura.gov.br"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 text-slate-100 placeholder-slate-500 text-xs font-mono rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
              Senha de Acesso
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-950/80 border border-slate-800 text-slate-100 placeholder-slate-500 text-xs font-mono rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                title={showPassword ? "Ocultar senha" : "Exibir senha"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-4 rounded-xl shadow-lg shadow-blue-600/20 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-xs mt-2 group"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Autenticando no Sistema...</span>
              </>
            ) : (
              <>
                <span>Acessar o Sistema</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>
        </form>

        {/* Rodapé / Informações de Segurança */}
        <div className="pt-4 border-t border-slate-800/80 text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>Controle de Acesso Restrito (RBAC)</span>
          </div>
          <p className="text-[10px] text-slate-400">
            Cadastros são efetuados exclusivamente pelo Administrador de TI.
          </p>
        </div>
      </div>
    </div>
  );
};
