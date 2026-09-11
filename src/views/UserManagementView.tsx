import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Edit3, Key, Shield, ShieldAlert, CheckCircle, XCircle, ArrowLeft, Loader2, RefreshCw, AlertCircle, Copy, Check } from 'lucide-react';
import { Usuario, PerfilUsuario } from '../types';
import { api } from '../services/api';

interface UserManagementViewProps {
  onBack: () => void;
  currentUser: Usuario;
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({ onBack, currentUser }) => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isResetPassOpen, setIsResetPassOpen] = useState(false);

  // Temp Credential Modal Result
  const [resetTempPassResult, setResetTempPassResult] = useState<{ user: string; tempPass: string } | null>(null);
  const [copiedTempPass, setCopiedTempPass] = useState(false);

  // Form States - Novo Usuário
  const [novoUsuario, setNovoUsuario] = useState('');
  const [novoNome, setNovoNome] = useState('');
  const [novoPerfil, setNovoPerfil] = useState<PerfilUsuario>('TST');
  const [savingUser, setSavingUser] = useState(false);

  // Form States - Editar Usuário
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);
  const [editNome, setEditNome] = useState('');
  const [editPerfil, setEditPerfil] = useState<PerfilUsuario>('TST');
  const [editAtivo, setEditAtivo] = useState(true);

  const carregarUsuarios = async () => {
    setLoading(true);
    setError(null);
    try {
      const lista = await api.listarUsuarios();
      setUsuarios(lista);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar lista de usuários.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarUsuarios();
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoUsuario.trim() || !novoNome.trim()) {
      setError('Preencha o usuário e o nome completo.');
      return;
    }

    setSavingUser(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await api.cadastrarUsuario({
        usuario: novoUsuario.trim(),
        nome: novoNome.trim(),
        perfil: novoPerfil
      });

      if (res.sucesso) {
        setSuccessMsg('Usuário cadastrado com sucesso! O usuário criará sua senha no primeiro acesso.');
        setIsCreateOpen(false);
        setNovoUsuario('');
        setNovoNome('');
        setNovoPerfil('TST');
        carregarUsuarios();
      } else {
        setError(res.mensagem || 'Erro ao cadastrar usuário.');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao cadastrar usuário.');
    } finally {
      setSavingUser(false);
    }
  };

  const handleOpenEdit = (u: Usuario) => {
    setSelectedUser(u);
    setEditNome(u.nome);
    setEditPerfil(u.perfil);
    setEditAtivo(u.ativo !== false);
    setIsEditOpen(true);
    setError(null);
    setSuccessMsg(null);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setSavingUser(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await api.editarUsuario({
        idUsuario: selectedUser.idUsuario,
        nome: editNome.trim(),
        perfil: editPerfil,
        ativo: editAtivo
      });

      if (res.sucesso) {
        setSuccessMsg('Usuário atualizado com sucesso!');
        setIsEditOpen(false);
        setSelectedUser(null);
        carregarUsuarios();
      } else {
        setError(res.mensagem || 'Erro ao editar usuário.');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao editar usuário.');
    } finally {
      setSavingUser(false);
    }
  };

  const handleOpenResetPass = (u: Usuario) => {
    setSelectedUser(u);
    setIsResetPassOpen(true);
    setError(null);
    setSuccessMsg(null);
  };

  const handleResetPassSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setSavingUser(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await api.redefinirSenhaUsuario({
        idUsuario: selectedUser.idUsuario
      });

      if (res.sucesso) {
        setIsResetPassOpen(false);
        if (res.credencialTemporaria) {
          setResetTempPassResult({
            user: selectedUser.usuario,
            tempPass: res.credencialTemporaria
          });
        } else {
          setSuccessMsg(`Senha do usuário @${selectedUser.usuario} foi redefinida com sucesso! Ele deverá criar uma nova senha no próximo acesso.`);
        }
        setSelectedUser(null);
      } else {
        setError(res.mensagem || 'Erro ao redefinir senha.');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao redefinir senha.');
    } finally {
      setSavingUser(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#111214] text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#1A1C1E] p-4 sm:p-6 rounded-2xl border border-gray-800 shadow-md">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
              title="Voltar"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <Users className="w-6 h-6 text-yellow-400" />
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                  Gerenciamento de Usuários
                </h1>
              </div>
              <p className="text-xs text-gray-400 font-medium mt-0.5">
                Cadastre, edite e gerencie permissões de acesso ao sistema DDPS
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={carregarUsuarios}
              disabled={loading}
              className="p-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors border border-gray-700"
              title="Atualizar lista"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => {
                setError(null);
                setSuccessMsg(null);
                setIsCreateOpen(true);
              }}
              className="py-2.5 px-4 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-sm shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>Novo Usuário</span>
            </button>
          </div>
        </div>

        {/* Feedback Messages */}
        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-xs uppercase underline font-bold">
              Fechar
            </button>
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <CheckCircle className="w-5 h-5 shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg(null)} className="text-xs uppercase underline font-bold">
              Fechar
            </button>
          </div>
        )}

        {/* User Table */}
        <div className="bg-[#1A1C1E] rounded-2xl border border-gray-800 shadow-md overflow-hidden">
          {loading ? (
            <div className="py-16 text-center text-gray-400 flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-yellow-400" />
              <p className="text-sm font-medium">Carregando usuários...</p>
            </div>
          ) : usuarios.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <p className="text-sm font-medium">Nenhum usuário cadastrado.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-300">
                <thead className="bg-gray-900/60 text-xs font-bold uppercase tracking-wider text-gray-400 border-b border-gray-800">
                  <tr>
                    <th className="px-6 py-4">Usuário / Nome</th>
                    <th className="px-6 py-4">Perfil</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {usuarios.map((u) => {
                    const isSelf = u.idUsuario === currentUser.idUsuario;
                    return (
                      <tr key={u.idUsuario} className="hover:bg-gray-800/40 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-white text-base flex items-center gap-2">
                            <span>{u.nome}</span>
                            {isSelf && (
                              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-yellow-400/20 text-yellow-400 border border-yellow-400/30">
                                Você
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-400 font-mono mt-0.5">
                            @{u.usuario}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {u.perfil === 'ADMIN' ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                              <Shield className="w-3.5 h-3.5" />
                              ADMINISTRADOR
                            </span>
                          ) : u.perfil === 'ENCARREGADO' ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                              ENCARREGADO
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              <ShieldAlert className="w-3.5 h-3.5" />
                              TÉCNICO TST
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {u.ativo !== false ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                              <CheckCircle className="w-4 h-4" />
                              Ativo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-400">
                              <XCircle className="w-4 h-4" />
                              Inativo
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEdit(u)}
                              className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
                              title="Editar Usuário"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenResetPass(u)}
                              className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-yellow-400 hover:text-yellow-300 transition-colors"
                              title="Redefinir Senha"
                            >
                              <Key className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal - Novo Usuário */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1A1C1E] border border-gray-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-gray-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-yellow-400" />
                Cadastrar Novo Usuário
              </h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-gray-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-300 mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={novoNome}
                  onChange={(e) => setNovoNome(e.target.value)}
                  placeholder="Ex: João da Silva"
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-300 mb-1">
                  Usuário (Login)
                </label>
                <input
                  type="text"
                  value={novoUsuario}
                  onChange={(e) => setNovoUsuario(e.target.value.toLowerCase())}
                  placeholder="Ex: joaosilva"
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-400 font-mono"
                  required
                />
              </div>

              <p className="text-xs text-yellow-400 bg-yellow-400/10 border border-yellow-400/30 p-3 rounded-xl">
                O usuário criará sua própria senha no primeiro acesso ao sistema.
              </p>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-300 mb-1">
                  Perfil de Acesso
                </label>
                <select
                  value={novoPerfil}
                  onChange={(e) => setNovoPerfil(e.target.value as PerfilUsuario)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-400"
                >
                  <option value="TST">TÉCNICO TST (Operacional)</option>
                  <option value="ENCARREGADO">ENCARREGADO (Operacional)</option>
                  <option value="ADMIN">ADMINISTRADOR (Acesso Total)</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-xs uppercase"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingUser}
                  className="px-5 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black font-bold text-xs uppercase flex items-center gap-2"
                >
                  {savingUser && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Salvar Usuário</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Editar Usuário */}
      {isEditOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1A1C1E] border border-gray-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-gray-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-yellow-400" />
                Editar Usuário @{selectedUser.usuario}
              </h3>
              <button
                onClick={() => setIsEditOpen(false)}
                className="text-gray-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-300 mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={editNome}
                  onChange={(e) => setEditNome(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-300 mb-1">
                  Perfil
                </label>
                <select
                  value={editPerfil}
                  onChange={(e) => setEditPerfil(e.target.value as PerfilUsuario)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-400"
                >
                  <option value="TST">TÉCNICO TST (Operacional)</option>
                  <option value="ENCARREGADO">ENCARREGADO (Operacional)</option>
                  <option value="ADMIN">ADMINISTRADOR (Acesso Total)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-300 mb-1">
                  Status do Usuário
                </label>
                <select
                  value={editAtivo ? 'true' : 'false'}
                  onChange={(e) => setEditAtivo(e.target.value === 'true')}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-400"
                >
                  <option value="true">ATIVO (Acesso liberado)</option>
                  <option value="false">INATIVO (Acesso bloqueado)</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-xs uppercase"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingUser}
                  className="px-5 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black font-bold text-xs uppercase flex items-center gap-2"
                >
                  {savingUser && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Salvar Alterações</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Redefinir Senha */}
      {isResetPassOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1A1C1E] border border-gray-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-gray-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Key className="w-5 h-5 text-yellow-400" />
                Redefinir Senha de @{selectedUser.usuario}
              </h3>
              <button
                onClick={() => setIsResetPassOpen(false)}
                className="text-gray-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleResetPassSubmit} className="space-y-4">
              <div className="p-4 bg-gray-900/80 border border-gray-800 rounded-xl text-sm text-gray-300 space-y-2">
                <p>
                  Deseja redefinir a senha do usuário <strong className="text-yellow-400 font-mono">@{selectedUser.usuario}</strong>?
                </p>
                <p className="text-xs text-gray-400">
                  A senha atual será desativada e o usuário precisará criar uma nova senha pessoal no próximo login (Primeiro Acesso).
                </p>
              </div>

              <div className="pt-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsResetPassOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-xs uppercase"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingUser}
                  className="px-5 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black font-bold text-xs uppercase flex items-center gap-2"
                >
                  {savingUser && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Redefinir Senha</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal - Credencial Temporária Gerada */}
      {resetTempPassResult && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1A1C1E] border border-gray-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-gray-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Key className="w-5 h-5 text-yellow-400" />
                Senha Redefinida
              </h3>
              <button
                onClick={() => setResetTempPassResult(null)}
                className="text-gray-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-gray-300">
                A senha do usuário <strong className="text-yellow-400">@{resetTempPassResult.user}</strong> foi redefinida com sucesso.
              </p>

              <div className="p-4 bg-gray-900 border border-yellow-400/40 rounded-xl text-center space-y-2">
                <span className="text-xs text-gray-400 block">Credencial Temporária de Acesso:</span>
                <div className="flex items-center justify-center gap-2 bg-black/60 p-3 rounded-lg border border-gray-800 font-mono text-xl font-black text-yellow-400 tracking-wider">
                  <span>{resetTempPassResult.tempPass}</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(resetTempPassResult.tempPass);
                      setCopiedTempPass(true);
                      setTimeout(() => setCopiedTempPass(false), 2000);
                    }}
                    className="p-1.5 rounded hover:bg-gray-800 text-gray-300 hover:text-white transition-colors"
                    title="Copiar Credencial"
                  >
                    {copiedTempPass ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <p className="text-xs text-gray-400 leading-relaxed">
                Passe esta credencial ao usuário. Ao fazer login com ela, o sistema exigirá que ele crie uma nova senha pessoal.
              </p>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setResetTempPassResult(null)}
                  className="px-5 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black font-bold text-xs uppercase"
                >
                  Entendido / Concluído
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
