import React, { useState } from 'react';
import { Funcionario } from '../types';
import { api } from '../services/api';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { 
  Users, 
  Plus, 
  Search, 
  Edit2, 
  UserX, 
  UserCheck, 
  Trash2, 
  ArrowLeft, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  ShieldAlert
} from 'lucide-react';

interface EmployeesViewProps {
  funcionarios: Funcionario[];
  onRefresh: () => Promise<void>;
  onBack: () => void;
}

export const EmployeesView: React.FC<EmployeesViewProps> = ({
  funcionarios,
  onRefresh,
  onBack
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [novoNome, setNovoNome] = useState('');
  const [novaFuncao, setNovaFuncao] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editFuncionario, setEditFuncionario] = useState<Funcionario | null>(null);
  const [editNome, setEditNome] = useState('');
  const [editFuncao, setEditFuncao] = useState('');

  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    action: () => Promise<void>;
    isDestructive?: boolean;
  } | null>(null);

  // Filtrar funcionários por nome ou ID
  const filteredFuncionarios = funcionarios.filter((f) => {
    const term = searchTerm.toLowerCase();
    const nome = (f.nome || '').toLowerCase();
    const id = (f.idFuncionario || f.id || '').toLowerCase();
    return nome.includes(term) || id.includes(term);
  });

  const handleCadastrar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoNome.trim()) {
      setFeedback({ type: 'error', message: 'Informe o nome do colaborador.' });
      return;
    }
    if (!novaFuncao.trim()) {
      setFeedback({ type: 'error', message: 'Informe a função do colaborador.' });
      return;
    }

    try {
      setIsSubmitting(true);
      setFeedback(null);
      const res = await api.cadastrarFuncionario(novoNome.trim(), novaFuncao.trim());
      if (res.sucesso) {
        setFeedback({ type: 'success', message: 'Colaborador cadastrado com sucesso!' });
        setNovoNome('');
        setNovaFuncao('');
        setShowAddModal(false);
        await onRefresh();
      } else {
        throw new Error(res.erro || 'Erro ao cadastrar colaborador.');
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erro ao cadastrar colaborador.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSalvarEdicao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFuncionario || !editNome.trim()) return;
    if (!editFuncao.trim()) {
      setFeedback({ type: 'error', message: 'Informe a função do colaborador.' });
      return;
    }

    try {
      setIsSubmitting(true);
      setFeedback(null);
      const id = editFuncionario.idFuncionario || editFuncionario.id;
      const res = await api.atualizarFuncionario(id, editNome.trim(), editFuncao.trim());
      if (res.sucesso) {
        setFeedback({ type: 'success', message: 'Colaborador atualizado com sucesso!' });
        setEditFuncionario(null);
        setEditFuncao('');
        await onRefresh();
      } else {
        throw new Error(res.erro || 'Erro ao atualizar colaborador.');
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erro ao atualizar colaborador.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = (func: Funcionario) => {
    const id = func.idFuncionario || func.id;
    const ativoAtual = func.ativo === true || func.ativo === 'SIM' || func.ativo === 'true';
    const novoStatus = !ativoAtual;
    const acaoTexto = novoStatus ? 'reativar' : 'inativar';

    setConfirmModal({
      title: `${novoStatus ? 'Reativar' : 'Inativar'} Colaborador`,
      message: `Tem certeza que deseja ${acaoTexto} o colaborador ${func.nome}?`,
      action: async () => {
        try {
          setIsLoading(true);
          const res = await api.alterarStatusFuncionario(id, novoStatus);
          if (res.sucesso) {
            setFeedback({ 
              type: 'success', 
              message: `Colaborador ${novoStatus ? 'reativado' : 'inativado'} com sucesso!` 
            });
            await onRefresh();
          } else {
            throw new Error(res.erro || 'Erro ao alterar status.');
          }
        } catch (err: any) {
          setFeedback({ type: 'error', message: err.message || 'Erro ao alterar status.' });
        } finally {
          setIsLoading(false);
          setConfirmModal(null);
        }
      }
    });
  };

  const handleExcluir = (func: Funcionario) => {
    const id = func.idFuncionario || func.id;

    setConfirmModal({
      title: 'Excluir Colaborador',
      message: 'Tem certeza que deseja excluir este colaborador?',
      isDestructive: true,
      action: async () => {
        try {
          setIsLoading(true);
          const res = await api.excluirFuncionario(id);
          if (res.sucesso) {
            setFeedback({ type: 'success', message: res.mensagem || 'Operação realizada com sucesso!' });
            await onRefresh();
          } else {
            throw new Error(res.erro || 'Erro ao excluir colaborador.');
          }
        } catch (err: any) {
          setFeedback({ type: 'error', message: err.message || 'Erro ao excluir colaborador.' });
        } finally {
          setIsLoading(false);
          setConfirmModal(null);
        }
      }
    });
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 space-y-6 animate-fadeIn">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-200 shadow-xs">
        <div className="flex items-center gap-3.5">
          <button
            type="button"
            onClick={onBack}
            className="p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
            title="Voltar"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-yellow-600 bg-yellow-50 px-2.5 py-0.5 rounded-full border border-yellow-200">
                Gestão de Pessoal
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight mt-0.5">
              Gerenciamento de Colaboradores
            </h1>
          </div>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => {
            setNovoNome('');
            setNovaFuncao('');
            setFeedback(null);
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 justify-center shadow-sm"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          Novo Colaborador
        </Button>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div className={`p-4 rounded-2xl border flex items-center gap-3 ${
          feedback.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <span className="text-sm font-medium">{feedback.message}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-3">
        <Search className="w-5 h-5 text-gray-400 shrink-0 ml-2" />
        <input
          type="text"
          placeholder="Pesquisar colaborador por nome ou matrícula..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-transparent text-gray-900 placeholder-gray-400 text-sm focus:outline-hidden"
        />
        {searchTerm && (
          <button 
            type="button" 
            onClick={() => setSearchTerm('')} 
            className="text-xs font-bold text-gray-500 hover:text-gray-700 px-3 py-1 bg-gray-100 rounded-lg"
          >
            Limpar
          </button>
        )}
      </div>

      {/* Employees Table / List */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-xs overflow-hidden">
        {filteredFuncionarios.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="font-semibold text-gray-700">Nenhum colaborador encontrado.</p>
            <p className="text-xs text-gray-400 mt-1">Tente buscar por outro termo ou cadastre um novo colaborador.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 text-xs font-bold uppercase tracking-wider text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4">Matrícula / ID</th>
                  <th className="px-6 py-4">Nome do Colaborador</th>
                  <th className="px-6 py-4">Função / Cargo</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredFuncionarios.map((func) => {
                  const id = func.idFuncionario || func.id;
                  const isAtivo = func.ativo === true || func.ativo === 'SIM' || func.ativo === 'true';
                  return (
                    <tr key={id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-gray-600">{id}</td>
                      <td className="px-6 py-4 font-bold text-gray-900">{func.nome}</td>
                      <td className="px-6 py-4 text-gray-600">{func.funcao || func.cargo || 'Colaborador'}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                          isAtivo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isAtivo ? 'bg-green-600' : 'bg-gray-400'}`}></span>
                          {isAtivo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Edit button */}
                          <button
                            type="button"
                            onClick={() => {
                              setEditFuncionario(func);
                              setEditNome(func.nome);
                              setEditFuncao(func.funcao || func.cargo || '');
                            }}
                            className="p-2 rounded-xl text-gray-600 hover:text-yellow-700 hover:bg-yellow-50 transition-colors"
                            title="Editar colaborador"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Toggle Status (Inativar/Reativar) */}
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(func)}
                            className={`p-2 rounded-xl transition-colors ${
                              isAtivo 
                                ? 'text-amber-600 hover:bg-amber-50' 
                                : 'text-green-600 hover:bg-green-50'
                            }`}
                            title={isAtivo ? 'Inativar colaborador' : 'Reativar colaborador'}
                          >
                            {isAtivo ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => handleExcluir(func)}
                            className="p-2 rounded-xl text-red-600 hover:bg-red-50 transition-colors"
                            title="Excluir / Inativar com segurança"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* Modal: Novo Colaborador */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
              <h3 className="text-lg font-bold text-gray-900">Cadastrar Novo Colaborador</h3>
              <button 
                type="button" 
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCadastrar} className="space-y-4">
              <Input
                label="Nome completo do colaborador"
                placeholder="Ex: João da Silva"
                value={novoNome}
                onChange={(e) => setNovoNome(e.target.value)}
                autoFocus
              />

              <Input
                label="Função do colaborador"
                placeholder="Ex: Eletricista"
                value={novaFuncao}
                onChange={(e) => setNovaFuncao(e.target.value)}
              />

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                  Cadastrar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Editar Colaborador */}
      {editFuncionario && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
              <h3 className="text-lg font-bold text-gray-900">Editar Colaborador</h3>
              <button 
                type="button" 
                onClick={() => setEditFuncionario(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvarEdicao} className="space-y-4">
              <Input
                label={`Nome (${editFuncionario.idFuncionario || editFuncionario.id})`}
                value={editNome}
                onChange={(e) => setEditNome(e.target.value)}
                autoFocus
              />

              <Input
                label="Função"
                placeholder="Ex: Eletricista"
                value={editFuncao}
                onChange={(e) => setEditFuncao(e.target.value)}
              />

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditFuncionario(null)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                  Salvar Alterações
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                confirmModal.isDestructive ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-700'
              }`}>
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{confirmModal.title}</h3>
                <p className="text-xs text-gray-500 mt-0.5">Confirmação de segurança</p>
              </div>
            </div>

            <p className="text-sm text-gray-700 leading-relaxed">
              {confirmModal.message}
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setConfirmModal(null)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant={confirmModal.isDestructive ? 'danger' : 'primary'}
                size="sm"
                onClick={confirmModal.action}
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                Confirmar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
