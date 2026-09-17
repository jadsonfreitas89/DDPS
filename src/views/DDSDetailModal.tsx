import React, { useEffect, useState } from 'react';
import { DDPSStatus, DDS, Participante, Usuario } from '../types';
import { api } from '../services/api';
import { Button } from '../components/Button';
import { X, MapPin, User, Users, ShieldCheck, FileDown, Trash2, AlertTriangle } from 'lucide-react';
import { formatarDataHora } from '../utils/dateFormatter';
import { gerarPDFSemanalDDPS } from '../utils/pdfGenerator';

interface DDSDetailModalProps {
  dds: DDS | null;
  status?: DDPSStatus | null;
  ddsSemana?: DDS[];
  currentUser?: Usuario | null;
  onClose: () => void;
  onDeleteSuccess?: (idDDS: string) => void;
}

export const DDSDetailModal: React.FC<DDSDetailModalProps> = ({
  dds,
  status = null,
  ddsSemana = [],
  currentUser = null,
  onClose,
  onDeleteSuccess
}) => {
  const [currentDDS, setCurrentDDS] = useState<DDS | null>(dds);
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [isLoadingParts, setIsLoadingParts] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Estados para exclusão
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const statusUpper = String(currentDDS?.status || '').toUpperCase();
  const isFinalizado = statusUpper === 'FINALIZADO' || statusUpper === 'REALIZADO' || statusUpper === 'CONCLUIDO';
  const isAdmin = currentUser?.perfil === 'ADMIN';

  const handleDelete = async () => {
    if (!currentDDS) return;
    if (isDeleting) return;

    setIsDeleting(true);
    setDeleteError(null);
    try {
      const result = await api.excluirDDS(currentDDS.idDDS);
      if (result.success) {
        setIsConfirmingDelete(false);
        onDeleteSuccess?.(currentDDS.idDDS);
        onClose();
      } else {
        throw new Error(result.message || 'Falha ao excluir o DDPS.');
      }
    } catch (err: any) {
      console.error('Erro ao excluir DDPS:', err);
      setDeleteError(err?.message || 'Falha ao excluir o DDPS. Tente novamente.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportPDF = async () => {
    if (isGeneratingPdf) return;
    if (!currentDDS) return;
    setIsGeneratingPdf(true);
    try {
      const listParaPDF = ddsSemana && ddsSemana.length > 0 ? ddsSemana : [currentDDS];
      await gerarPDFSemanalDDPS(status, listParaPDF);
    } catch (err) {
      console.error('Erro ao gerar PDF semanal a partir do modal:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  useEffect(() => {
    setCurrentDDS(dds);
    if (!dds) return;
    const fetchFullDDS = async () => {
      setIsLoadingParts(true);
      try {
        const result = await api.getDDSCompleto(dds.idDDS);
        if (result && result.sucesso) {
          if (result.dds) {
            setCurrentDDS(result.dds);
          }
          if (result.participantes) {
            setParticipantes(result.participantes);
          }
        }
      } catch (err) {
        console.warn('Erro ao carregar dados completos do DDS:', err);
        try {
          const list = await api.getParticipantes(dds.idDDS);
          setParticipantes(list);
        } catch (err2) {
          console.warn('Erro ao carregar participantes (fallback):', err2);
        }
      } finally {
        setIsLoadingParts(false);
      }
    };
    fetchFullDDS();
  }, [dds]);

  if (!currentDDS) return null;

  const contagemBom = participantes.filter((p) => p.emociograma === 'BOM').length;
  const contagemRegular = participantes.filter((p) => p.emociograma === 'REGULAR').length;
  const contagemRuim = participantes.filter((p) => p.emociograma === 'RUIM').length;

  if (isConfirmingDelete) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-sm animate-fadeIn" id="modal-excluir-confirmacao">
        <div className="w-full max-w-md bg-slate-900 border-2 border-red-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col gap-5 text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center text-red-400 border border-red-500/20">
            <Trash2 className="w-7 h-7" />
          </div>
          
          <div>
            <h3 className="text-xl font-extrabold text-white">
              Excluir este DDPS?
            </h3>
            <p className="mt-2 text-sm text-slate-400">
              Esta ação excluirá o DDPS e todos os dados relacionados. Essa operação não poderá ser desfeita.
            </p>
          </div>

          {/* Dados identificadores do DDPS */}
          <div className="p-4 rounded-2xl bg-slate-850 border border-slate-800 text-left flex flex-col gap-2.5 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">ID_DDS</span>
              <span className="text-white font-bold font-mono text-sm">{currentDDS.idDDS}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Data</span>
              <span className="text-white font-semibold">{formatarDataHora(currentDDS.data, currentDDS.horario)}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Tema</span>
              <span className="text-white font-semibold line-clamp-2">{currentDDS.tema}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Responsável</span>
              <span className="text-white font-semibold truncate block">{currentDDS.responsavel || currentDDS.encarregadoNome || 'Não informado'}</span>
            </div>
          </div>

          {deleteError && (
            <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-left leading-snug flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              <span>{deleteError}</span>
            </div>
          )}

          <div className="flex flex-col gap-2.5 pt-2">
            <Button
              type="button"
              variant="danger"
              size="md"
              fullWidth
              disabled={isDeleting}
              onClick={handleDelete}
              id="btn-confirmar-exclusao"
              className="py-3 text-sm font-bold uppercase tracking-wider bg-red-600 hover:bg-red-700 active:bg-red-800"
            >
              {isDeleting ? 'EXCLUINDO...' : 'EXCLUIR'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="md"
              fullWidth
              disabled={isDeleting}
              onClick={() => {
                setIsConfirmingDelete(false);
                setDeleteError(null);
              }}
              id="btn-cancelar-exclusao"
              className="py-2.5 text-sm"
            >
              CANCELAR
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-2xl bg-slate-900 border-2 border-slate-700 rounded-3xl p-5 sm:p-7 shadow-2xl flex flex-col gap-5 max-h-[92vh] overflow-y-auto">
        {/* Topo */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold uppercase">
                {currentDDS.diaSemana || 'DDS Realizado'}
              </span>
              {isFinalizado && (
                <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-amber-300 border border-amber-500/40 text-xs font-bold uppercase flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  SOMENTE LEITURA
                </span>
              )}
              <span className="text-xs text-slate-400">
                {formatarDataHora(currentDDS.data, currentDDS.horario)}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              {currentDDS.tema}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Conteúdo do DDS */}
        <div className="flex flex-col gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Conteúdo Programático
            </span>
            <div className="mt-1 p-3.5 rounded-xl bg-slate-850 border border-slate-700/60 text-sm text-slate-200 leading-relaxed whitespace-pre-line">
              {currentDDS.conteudo}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
            <div className="p-3 rounded-xl bg-slate-850 border border-slate-700/60 flex items-center gap-2.5">
              <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="text-[11px] text-slate-400 block font-semibold">Local</span>
                <span className="text-white font-bold">{currentDDS.local}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-850 border border-slate-700/60 flex items-center gap-2.5">
              <User className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="text-[11px] text-slate-400 block font-semibold">Responsável</span>
                <span className="text-white font-bold">{currentDDS.responsavel}</span>
              </div>
            </div>
          </div>

          {/* Encarregado Responsável e Assinatura */}
          <div className="p-3.5 rounded-xl bg-slate-850 border border-slate-700/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm">
            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <User className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="text-[11px] text-slate-400 block font-semibold">Encarregado Responsável pelo DDS</span>
                <span className="text-white font-bold">{currentDDS.encarregadoNome || currentDDS.responsavel || 'Não informado'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-between sm:justify-end">
              {currentDDS.assinaturaEncarregado ? (
                <>
                  <span className="text-[10px] text-emerald-400 font-bold border border-emerald-500/30 px-2 py-0.5 rounded bg-emerald-500/10">
                    ASSINADO
                  </span>
                  <div className="w-28 h-10 bg-white rounded border border-slate-300 flex items-center justify-center p-0.5 overflow-hidden">
                    <img
                      src={currentDDS.assinaturaEncarregado}
                      alt="Assinatura Encarregado"
                      className="max-h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </>
              ) : (
                <span className="text-[10px] text-amber-400 font-bold border border-amber-500/30 px-2 py-0.5 rounded bg-amber-500/10 shrink-0">
                  SEM ASSINATURA
                </span>
              )}
            </div>
          </div>

          {currentDDS.observacoes && (
            <div className="p-3 rounded-xl bg-slate-850 border border-slate-700/60 text-xs">
              <span className="text-slate-400 font-bold block mb-1">Observações:</span>
              <p className="text-slate-300">{currentDDS.observacoes}</p>
            </div>
          )}

          {/* Participantes */}
          <div className="border-t border-slate-800 pt-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-bold text-white">
                  Participantes ({participantes.length || currentDDS.participantesQtd || 0})
                </span>
              </div>

              {participantes.length > 0 && (
                <div className="flex items-center gap-2 text-xs font-bold">
                  <span className="text-emerald-400">🙂 {contagemBom}</span>
                  <span className="text-amber-400">😐 {contagemRegular}</span>
                  <span className="text-rose-400">🙁 {contagemRuim}</span>
                </div>
              )}
            </div>

            {isLoadingParts ? (
              <p className="text-xs text-slate-400 py-3 text-center">Carregando lista de presença...</p>
            ) : participantes.length > 0 ? (
              <div className="max-h-52 overflow-y-auto pr-1 flex flex-col gap-1.5">
                {participantes.map((p, idx) => (
                  <div
                    key={p.idFuncionario || idx}
                    className="p-2.5 rounded-xl bg-slate-850 border border-slate-800 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center font-bold text-[10px] shrink-0">
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-white truncate max-w-[150px] sm:max-w-xs">
                        {p.nome}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-bold text-[11px]">
                        {p.emociograma === 'BOM' ? '🙂 Bom' : p.emociograma === 'REGULAR' ? '😐 Regular' : '🙁 Ruim'}
                      </span>
                      {p.assinatura && (
                        <div className="w-14 h-6 bg-slate-900 rounded border border-slate-700 flex items-center justify-center overflow-hidden">
                          <img src={p.assinatura} alt="Assinado" className="max-h-full filter invert opacity-75" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-2">
                Nenhum participante detalhado carregado ou DDS registrado com contagem rápida ({currentDDS.participantesQtd || 0} pessoas).
              </p>
            )}
          </div>
        </div>

        <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row gap-2.5">
          <Button
            type="button"
            variant="primary"
            size="md"
            fullWidth
            disabled={isGeneratingPdf}
            onClick={handleExportPDF}
            leftIcon={<FileDown className={`w-4 h-4 ${isGeneratingPdf ? 'animate-bounce text-black' : 'text-black'}`} />}
            className="py-2.5 text-xs font-bold uppercase tracking-wider text-black"
          >
            {isGeneratingPdf ? 'GERANDO PDF...' : 'BAIXAR FOLHA SEMANAL (PDF)'}
          </Button>
          {isAdmin && (
            <Button
              type="button"
              variant="danger"
              size="md"
              fullWidth
              onClick={() => {
                setIsConfirmingDelete(true);
                setDeleteError(null);
              }}
              leftIcon={<Trash2 className="w-4 h-4 text-white" />}
              className="py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-red-600 hover:bg-red-700 active:bg-red-800"
              id="btn-excluir-ddps"
            >
              EXCLUIR DDPS
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="md"
            fullWidth
            onClick={onClose}
          >
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
};
