import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, ShieldCheck, MapPin, User, Calendar, Clock } from 'lucide-react';
import { DDPSStatus, Funcionario } from '../types';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Textarea } from '../components/Textarea';
import { Card } from '../components/Card';
import { formatarDataApenas, formatarHoraApenas } from '../utils/dateFormatter';

interface NewDDSViewProps {
  status: DDPSStatus | null;
  onCancel: () => void;
  onSubmit: (formData: {
    tema: string;
    conteudo: string;
    local: string;
    responsavel: string;
    observacoes?: string;
    encarregadoId?: string;
    encarregadoNome?: string;
  }) => Promise<void>;
  isLoading?: boolean;
  funcionarios: Funcionario[];
}

export const NewDDSView: React.FC<NewDDSViewProps> = ({
  status,
  onCancel,
  onSubmit,
  isLoading = false,
  funcionarios
}) => {
  const [tema, setTema] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [local, setLocal] = useState('');
  const [responsavel, setResponsavel] = useState(
    status?.responsavelPadrao || ''
  );
  const [encarregadoId, setEncarregadoId] = useState('');
  const [observacoes, setObservacoes] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!tema.trim()) {
      newErrors.tema = 'O tema do DDS é obrigatório.';
    }
    if (!conteudo.trim()) {
      newErrors.conteudo = 'O conteúdo programático é obrigatório.';
    }
    if (!local.trim()) {
      newErrors.local = 'O local de realização é obrigatório.';
    }
    if (!responsavel.trim()) {
      newErrors.responsavel = 'O responsável pela aplicação é obrigatório.';
    }
    if (!encarregadoId) {
      newErrors.encarregadoId = 'A seleção do encarregado responsável é obrigatória.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const encarregado = funcionarios.find(
      (f) => (f.idFuncionario || f.id) === encarregadoId
    );

    await onSubmit({
      tema: tema.trim(),
      conteudo: conteudo.trim(),
      local: local.trim(),
      responsavel: responsavel.trim(),
      observacoes: observacoes.trim() || undefined,
      encarregadoId: encarregadoId,
      encarregadoNome: encarregado ? encarregado.nome : ''
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-6 pb-12 animate-fadeIn">
      {/* Botão de Retorno e Título */}
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="md"
          onClick={onCancel}
          leftIcon={<ArrowLeft className="w-5 h-5 text-gray-700" />}
          className="shrink-0 bg-white border-gray-300 text-gray-700"
        >
          Voltar
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1A1C1E] tracking-tight">
            Novo Diálogo (DDS)
          </h1>
          <p className="text-xs sm:text-sm text-gray-500">
            Preencha os dados do DDS para liberar a lista de presença
          </p>
        </div>
      </div>

      <form onSubmit={handleContinue} className="flex flex-col gap-5">
        {/* Bloco 1: Campos Automáticos do Backend (Somente Leitura) */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-200 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-yellow-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-yellow-600" />
              Parâmetros de Auditoria (Backend)
            </span>
            <span className="text-[11px] text-gray-400 font-medium">
              Somente leitura
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Data"
              value={status?.data ? formatarDataApenas(status.data) : 'Carregando...'}
              isReadOnly
              leftIcon={<Calendar className="w-4 h-4 text-gray-400" />}
            />

            <Input
              label="Dia da semana"
              value={status?.diaSemana || 'Carregando...'}
              isReadOnly
            />

            <Input
              label="Horário"
              value={status?.horario ? formatarHoraApenas(status.horario) : 'Carregando...'}
              isReadOnly
              leftIcon={<Clock className="w-4 h-4 text-gray-400" />}
            />
          </div>
        </div>

        {/* Bloco 2: Informações do Diálogo */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-200 shadow-xs flex flex-col gap-5">
          <div className="border-b border-gray-100 pb-3">
            <h2 className="text-lg font-bold text-[#1A1C1E]">
              Informações do Diálogo
            </h2>
            <p className="text-xs text-gray-500">
              Campos com (*) são de preenchimento obrigatório para conformidade
            </p>
          </div>

          {/* Tema */}
          <Input
            label="Tema"
            required
            value={tema}
            onChange={(e) => {
              setTema(e.target.value);
              if (errors.tema) setErrors({ ...errors, tema: '' });
            }}
            placeholder="Ex: Trabalho em Altura, Bloqueio LOTO, Uso de EPI..."
            error={errors.tema}
          />

          {/* Conteúdo Programático */}
          <Textarea
            label="Conteúdo Programático"
            required
            rows={5}
            value={conteudo}
            onChange={(e) => {
              setConteudo(e.target.value);
              if (errors.conteudo) setErrors({ ...errors, conteudo: '' });
            }}
            placeholder="Descreva detalhadamente os pontos de segurança, procedimentos abordados, riscos identificados e medidas preventivas..."
            error={errors.conteudo}
          />

          {/* Local */}
          <Input
            label="Local"
            required
            value={local}
            onChange={(e) => {
              setLocal(e.target.value);
              if (errors.local) setErrors({ ...errors, local: '' });
            }}
            placeholder="Ex: Frente de Serviço 2, Canteiro Central, Subestação..."
            leftIcon={<MapPin className="w-4 h-4" />}
            error={errors.local}
          />

          {/* Responsável SHE */}
          <div className="flex flex-col gap-1.5" id="responsavel-she-container">
            <label className="text-sm font-bold text-gray-700 flex items-center gap-1">
              Responsável SHE (TST) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                id="select-responsavel-she"
                value={responsavel}
                onChange={(e) => {
                  setResponsavel(e.target.value);
                  if (errors.responsavel) setErrors({ ...errors, responsavel: '' });
                }}
                className={`w-full bg-white border ${
                  errors.responsavel ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'
                } rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0066FF] appearance-none transition-all`}
              >
                <option value="">Selecione o responsável SHE (apenas colaboradores ativos)...</option>
                {funcionarios
                  .filter((f) => {
                    const act = f.ativo;
                    if (typeof act === 'boolean') return act;
                    if (typeof act === 'string') {
                      const lower = act.toLowerCase().trim();
                      return lower === 'true' || lower === 'ativo' || lower === 'sim' || lower === 's';
                    }
                    return false;
                  })
                  .map((f) => (
                    <option key={f.id || f.idFuncionario} value={f.nome}>
                      {f.nome} {f.funcao ? `— ${f.funcao}` : ''}
                    </option>
                  ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
            {errors.responsavel ? (
              <span className="text-xs text-red-500 font-medium">{errors.responsavel}</span>
            ) : (
              <p className="text-[11px] text-gray-400">
                O responsável SHE deve ser um TST ativo cadastrado na aba FUNCIONARIOS.
              </p>
            )}
          </div>

          {/* Encarregado Responsável (Apenas Ativos) */}
          <div className="flex flex-col gap-1.5" id="encarregado-responsavel-container">
            <label className="text-sm font-bold text-gray-700 flex items-center gap-1">
              Encarregado Responsável pelo DDS <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                id="select-encarregado"
                value={encarregadoId}
                onChange={(e) => {
                  setEncarregadoId(e.target.value);
                  if (errors.encarregadoId) setErrors({ ...errors, encarregadoId: '' });
                }}
                className={`w-full bg-white border ${
                  errors.encarregadoId ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'
                } rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0066FF] appearance-none transition-all`}
              >
                <option value="">Selecione o encarregado responsável (apenas colaboradores ativos)...</option>
                {funcionarios
                  .filter((f) => {
                    // Trata ativo como booleano ou string 'true' / 'ATIVO' / 'Sim'
                    const act = f.ativo;
                    if (typeof act === 'boolean') return act;
                    if (typeof act === 'string') {
                      const lower = act.toLowerCase().trim();
                      return lower === 'true' || lower === 'ativo' || lower === 'sim' || lower === 's';
                    }
                    return false;
                  })
                  .map((f) => (
                    <option key={f.idFuncionario || f.id} value={f.idFuncionario || f.id}>
                      {f.nome} {f.funcao ? `— ${f.funcao}` : ''}
                    </option>
                  ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                </svg>
              </div>
            </div>
            {errors.encarregadoId ? (
              <span className="text-xs text-red-500 font-medium">
                {errors.encarregadoId}
              </span>
            ) : (
              <p className="text-[11px] text-gray-400">
                O encarregado responsável deve ser um colaborador ativo. Apenas colaboradores ativos são exibidos aqui.
              </p>
            )}
          </div>

          {/* Observações */}
          <Textarea
            label="Observações (Opcional)"
            rows={3}
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            placeholder="Alguma recomendação específica de campo, condições climáticas ou dúvidas levantadas..."
          />
        </div>

        {/* Botão de Ação: CONTINUAR */}
        <div className="pt-2 flex flex-col gap-2">
          <Button
            type="submit"
            variant="primary"
            size="xl"
            fullWidth
            disabled={isLoading}
            rightIcon={<CheckCircle2 className="w-6 h-6 stroke-[3]" />}
            className="uppercase tracking-wider font-extrabold py-4"
          >
            {isLoading ? 'Criando DDS na API...' : 'CONTINUAR'}
          </Button>

          <p className="text-center text-xs text-gray-500">
            Ao continuar, o DDS será registrado no Google Apps Script e o fluxo seguirá para a lista de presença.
          </p>
        </div>
      </form>
    </div>
  );
};
