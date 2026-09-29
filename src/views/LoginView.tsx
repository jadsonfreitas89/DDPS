import React, { useState } from 'react';
import { HardHat, Lock, User, AlertCircle, Loader2, KeyRound, ArrowLeft, Copy, Check, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { Usuario } from '../types';
import { api } from '../services/api';
import { PWAInstallButton } from '../components/PWAInstallButton';

interface LoginViewProps {
  onLoginSuccess: (user: Usuario) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  
  // Visibilidade de senha
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);

  // Sincronização inicial pós-login
  const [isSyncingInitial, setIsSyncingInitial] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [loggedInUserCache, setLoggedInUserCache] = useState<Usuario | null>(null);
  
  // Modos de Primeiro Acesso e Recuperação
  const [isPrimeiroAcesso, setIsPrimeiroAcesso] = useState(false);
  const [isEsqueciSenha, setIsEsqueciSenha] = useState(false);
  
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  // Credencial temporária gerada na recuperação
  const [credencialTemp, setCredencialTemp] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucessoMsg, setSucessoMsg] = useState<string | null>(null);

  const executarSincronizacaoInicial = async (user: Usuario) => {
    setIsSyncingInitial(true);
    setSyncError(null);
    setSucessoMsg('Login realizado com sucesso.\n🔄 Sincronizando dados...');

    try {
      // Sincronização inicial completa obrigatória antes de liberar o acesso
      await Promise.all([
        api.sincronizar(),
        api.getFuncionarios()
      ]);

      setSucessoMsg('✓ Dados sincronizados.');
      setTimeout(() => {
        onLoginSuccess(user);
      }, 600);
    } catch (err: any) {
      console.error('[LoginView] Erro na sincronização inicial:', err);
      setIsSyncingInitial(false);
      setSyncError(err?.message || 'Não foi possível sincronizar os dados com o servidor.');
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario.trim()) {
      setErro('Informe o usuário.');
      return;
    }

    setLoading(true);
    setErro(null);
    setSyncError(null);
    setSucessoMsg(null);

    try {
      const res = await api.login(usuario.trim(), senha.trim());
      
      if (res.sucesso) {
        if (res.primeiroAcesso) {
          setIsPrimeiroAcesso(true);
          setLoading(false);
          setSucessoMsg('Credencial/Primeiro acesso validado! Por favor, crie sua nova senha pessoal.');
        } else if (res.usuario) {
          setLoggedInUserCache(res.usuario);
          await executarSincronizacaoInicial(res.usuario);
        }
      } else {
        setLoading(false);
        setErro(res.mensagem || 'Usuário ou senha inválidos.');
      }
    } catch (err: any) {
      setLoading(false);
      setErro(err.message || 'Erro ao conectar ao servidor. Tente novamente.');
    }
  };

  const handleCriarSenhaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaSenha.trim()) {
      setErro('Informe a nova senha.');
      return;
    }

    if (novaSenha.trim().length < 3) {
      setErro('A senha deve ter pelo menos 3 caracteres.');
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setErro('As senhas não coincidem. Digite novamente.');
      return;
    }

    setLoading(true);
    setErro(null);

    try {
      const res = await api.definirPrimeiraSenha(usuario.trim(), novaSenha.trim());
      if (res.sucesso && res.usuario) {
        setLoggedInUserCache(res.usuario);
        await executarSincronizacaoInicial(res.usuario);
      } else {
        setLoading(false);
        setErro(res.mensagem || 'Erro ao criar a senha. Tente novamente.');
      }
    } catch (err: any) {
      setLoading(false);
      setErro(err.message || 'Erro de comunicação ao criar senha.');
    }
  };

  const handleRecuperarSenhaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario.trim()) {
      setErro('Informe seu usuário para recuperação.');
      return;
    }

    setLoading(true);
    setErro(null);
    setSucessoMsg(null);
    setCredencialTemp(null);

    try {
      const res = await api.solicitarRecuperacaoSenha(usuario.trim());
      if (res.sucesso) {
        setSucessoMsg(res.mensagem || 'Solicitação processada com sucesso.');
        if (res.credencialTemporaria) {
          setCredencialTemp(res.credencialTemporaria);
        }
      } else {
        setErro(res.mensagem || 'Não foi possível processar a solicitação.');
      }
    } catch (err: any) {
      setErro(err.message || 'Erro de comunicação ao solicitar recuperação.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopiarCredencial = () => {
    if (credencialTemp) {
      navigator.clipboard.writeText(credencialTemp);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    }
  };

  const voltarParaLogin = () => {
    setIsPrimeiroAcesso(false);
    setIsEsqueciSenha(false);
    setNovaSenha('');
    setConfirmarSenha('');
    setCredencialTemp(null);
    setErro(null);
    setSucessoMsg(null);
  };

  const usarCredencialParaLogin = () => {
    if (credencialTemp) {
      setSenha(credencialTemp);
    }
    setIsEsqueciSenha(false);
    setCredencialTemp(null);
    setErro(null);
    setSucessoMsg(null);
  };

  return (
    <div className="min-h-screen bg-[#111214] text-white flex flex-col justify-center items-center p-4">
      {/* Container Principal */}
      <div className="w-full max-w-md bg-[#1A1C1E] border border-gray-800 rounded-2xl shadow-2xl overflow-hidden p-6 sm:p-8">
        
        {/* Header / Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-yellow-400 text-black mb-4 shadow-lg">
            <HardHat className="w-10 h-10 stroke-[2.5]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            DDPS
          </h1>
          <p className="text-xs font-semibold text-yellow-400 uppercase tracking-widest mt-1">
            Diálogo Diário Participativo de Segurança
          </p>
          <div className="mt-2 text-xs text-gray-400 font-medium">
            {isPrimeiroAcesso
              ? 'Primeiro Acesso • Criação de Nova Senha'
              : isEsqueciSenha
              ? 'Recuperação de Acesso'
              : 'Acesso Restrito ao Sistema'}
          </div>
        </div>

        {/* Form de Primeiro Acesso */}
        {isPrimeiroAcesso ? (
          <form onSubmit={handleCriarSenhaSubmit} className="space-y-5">
            {sucessoMsg && (
              <div className="p-3.5 rounded-xl bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 text-xs font-medium whitespace-pre-line flex items-center gap-2.5">
                <KeyRound className="w-5 h-5 shrink-0" />
                <span>{sucessoMsg}</span>
              </div>
            )}

            {erro && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{erro}</span>
              </div>
            )}

            <div className="p-3 bg-gray-900/60 border border-gray-800 rounded-xl text-xs">
              <span className="text-gray-400 block mb-0.5">Usuário:</span>
              <span className="text-yellow-400 font-bold text-sm tracking-wide">@{usuario.toLowerCase()}</span>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">
                Nova Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={mostrarNovaSenha ? 'text' : 'password'}
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  placeholder="Crie sua nova senha"
                  disabled={loading || isSyncingInitial}
                  autoFocus
                  className="w-full bg-gray-900/80 border border-gray-700 rounded-xl pl-11 pr-12 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setMostrarNovaSenha(!mostrarNovaSenha)}
                  disabled={loading || isSyncingInitial}
                  aria-label={mostrarNovaSenha ? "Ocultar senha" : "Mostrar senha"}
                  title={mostrarNovaSenha ? "Ocultar senha" : "Mostrar senha"}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-white transition-colors p-1"
                >
                  {mostrarNovaSenha ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">
                Confirmar Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={mostrarConfirmarSenha ? 'text' : 'password'}
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  placeholder="Digite novamente a nova senha"
                  disabled={loading || isSyncingInitial}
                  className="w-full bg-gray-900/80 border border-gray-700 rounded-xl pl-11 pr-12 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setMostrarConfirmarSenha(!mostrarConfirmarSenha)}
                  disabled={loading || isSyncingInitial}
                  aria-label={mostrarConfirmarSenha ? "Ocultar senha" : "Mostrar senha"}
                  title={mostrarConfirmarSenha ? "Ocultar senha" : "Mostrar senha"}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-white transition-colors p-1"
                >
                  {mostrarConfirmarSenha ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {syncError && (
              <div className="p-4 rounded-xl bg-yellow-400/10 border border-yellow-400/40 space-y-3">
                <div className="flex items-center gap-2.5 text-yellow-400 text-xs font-medium">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{syncError}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => loggedInUserCache && executarSincronizacaoInicial(loggedInUserCache)}
                    className="flex-1 py-2.5 px-3 bg-yellow-400 hover:bg-yellow-300 text-black font-bold text-xs uppercase tracking-wider rounded-lg transition-colors"
                  >
                    Tentar Novamente
                  </button>
                  <button
                    type="button"
                    onClick={() => loggedInUserCache && onLoginSuccess(loggedInUserCache)}
                    className="py-2.5 px-3 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white font-medium text-xs rounded-lg transition-colors"
                  >
                    Entrar (Ignorar)
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || isSyncingInitial}
              className="w-full py-3.5 px-4 bg-yellow-400 hover:bg-yellow-300 disabled:bg-gray-700 disabled:text-gray-500 text-black font-black uppercase text-sm tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
            >
              {loading || isSyncingInitial ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{isSyncingInitial ? 'SINCRONIZANDO...' : 'CRIANDO SENHA...'}</span>
                </>
              ) : (
                <span>CRIAR NOVA SENHA</span>
              )}
            </button>

            <button
              type="button"
              onClick={voltarParaLogin}
              disabled={loading || isSyncingInitial}
              className="w-full py-2 text-xs text-gray-400 hover:text-white transition-colors flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar ao Login</span>
            </button>
          </form>
        ) : isEsqueciSenha ? (
          /* Form de Esqueci Minha Senha */
          <form onSubmit={handleRecuperarSenhaSubmit} className="space-y-5">
            {sucessoMsg && (
              <div className="p-3.5 rounded-xl bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 text-xs font-medium space-y-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 shrink-0 text-yellow-400" />
                  <span>{sucessoMsg}</span>
                </div>
              </div>
            )}

            {credencialTemp && (
              <div className="p-4 rounded-xl bg-gray-900 border border-yellow-400/40 text-center space-y-3">
                <span className="text-xs text-gray-400 block">Sua credencial temporária é:</span>
                <div className="flex items-center justify-center gap-2 bg-black/50 p-2.5 rounded-lg border border-gray-800 font-mono text-lg font-black text-yellow-400 tracking-wider">
                  <span>{credencialTemp}</span>
                  <button
                    type="button"
                    onClick={handleCopiarCredencial}
                    className="p-1.5 rounded hover:bg-gray-800 text-gray-300 hover:text-white transition-colors"
                    title="Copiar Credencial"
                  >
                    {copiado ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Anotou a credencial? Utilize-a como senha na tela de login para cadastrar sua nova senha definitiva.
                </p>
                <button
                  type="button"
                  onClick={usarCredencialParaLogin}
                  className="w-full py-2.5 px-3 bg-yellow-400 hover:bg-yellow-300 text-black font-bold text-xs uppercase tracking-wider rounded-lg transition-colors"
                >
                  Ir para Login com esta Credencial
                </button>
              </div>
            )}

            {erro && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{erro}</span>
              </div>
            )}

            {!credencialTemp && (
              <>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">
                    Nome de Usuário
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <User className="w-5 h-5" />
                    </div>
                    <input
                      type="text"
                      value={usuario}
                      onChange={(e) => setUsuario(e.target.value)}
                      placeholder="Informe seu nome de usuário"
                      disabled={loading}
                      autoFocus
                      className="w-full bg-gray-900/80 border border-gray-700 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 bg-yellow-400 hover:bg-yellow-300 disabled:bg-gray-700 disabled:text-gray-500 text-black font-black uppercase text-sm tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>SOLICITANDO...</span>
                    </>
                  ) : (
                    <span>SOLICITAR RECUPERAÇÃO</span>
                  )}
                </button>
              </>
            )}

            <button
              type="button"
              onClick={voltarParaLogin}
              disabled={loading}
              className="w-full py-2 text-xs text-gray-400 hover:text-white transition-colors flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar ao Login</span>
            </button>
          </form>
        ) : (
          /* Form de Login Padrão */
          <form onSubmit={handleLoginSubmit} className="space-y-5">
            {sucessoMsg && (
              <div className="p-3.5 rounded-xl bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 text-xs font-medium whitespace-pre-line flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 shrink-0" />
                <span>{sucessoMsg}</span>
              </div>
            )}

            {erro && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{erro}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">
                Usuário
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  placeholder="Informe seu usuário"
                  disabled={loading || isSyncingInitial}
                  autoFocus
                  className="w-full bg-gray-900/80 border border-gray-700 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300">
                  Senha
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsEsqueciSenha(true);
                    setErro(null);
                    setSucessoMsg(null);
                  }}
                  disabled={loading || isSyncingInitial}
                  className="text-xs text-yellow-400 hover:text-yellow-300 transition-colors font-medium"
                >
                  Esqueci minha senha
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Informe sua senha"
                  disabled={loading || isSyncingInitial}
                  className="w-full bg-gray-900/80 border border-gray-700 rounded-xl pl-11 pr-12 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  disabled={loading || isSyncingInitial}
                  aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                  title={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-white transition-colors p-1"
                >
                  {mostrarSenha ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {syncError && (
              <div className="p-4 rounded-xl bg-yellow-400/10 border border-yellow-400/40 space-y-3">
                <div className="flex items-center gap-2.5 text-yellow-400 text-xs font-medium">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{syncError}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => loggedInUserCache && executarSincronizacaoInicial(loggedInUserCache)}
                    className="flex-1 py-2.5 px-3 bg-yellow-400 hover:bg-yellow-300 text-black font-bold text-xs uppercase tracking-wider rounded-lg transition-colors"
                  >
                    Tentar Novamente
                  </button>
                  <button
                    type="button"
                    onClick={() => loggedInUserCache && onLoginSuccess(loggedInUserCache)}
                    className="py-2.5 px-3 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white font-medium text-xs rounded-lg transition-colors"
                  >
                    Entrar (Ignorar)
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || isSyncingInitial}
              className="w-full py-3.5 px-4 bg-yellow-400 hover:bg-yellow-300 disabled:bg-gray-700 disabled:text-gray-500 text-black font-black uppercase text-sm tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
            >
              {loading || isSyncingInitial ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{isSyncingInitial ? 'SINCRONIZANDO...' : 'ENTRANDO...'}</span>
                </>
              ) : (
                <span>ENTRAR</span>
              )}
            </button>
          </form>
        )}

        <div className="mt-8 pt-4 border-t border-gray-800 flex flex-col items-center gap-3 text-center text-[11px] text-gray-500 font-medium">
          <PWAInstallButton />
          <div>DDPS Campo • Sistema de Segurança do Trabalho</div>
        </div>
      </div>
    </div>
  );
};
