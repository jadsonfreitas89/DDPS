/**
 * ============================================================================
 * REGRA ARQUITETURAL DO DDPS - PREVENÇÃO DE DUPLICAÇÃO
 * 
 * ANTES DE CRIAR qualquer novo botão, tela, rota, handler, view, modal ou função:
 * 1. Verificar obrigatoriamente se já existe uma implementação equivalente no sistema.
 * 2. Se existir: REUTILIZAR a implementação existente, consolidar handlers e remover duplicidades.
 * 3. Não criar funções, visões ou botões paralelos para a mesma finalidade.
 * ============================================================================
 */

import React, {
  useState,
  useEffect,
  useCallback
} from 'react';

import {
  ScreenView,
  DDPSStatus,
  Funcionario,
  DDS,
  Participante,
  Usuario
} from './types';

import {
  api,
  getApiBaseUrl,
  LocalDDSStorage
} from './services/api';

import { Header } from './components/Header';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorMessage } from './components/ErrorMessage';
import { ApiConfigModal } from './components/ApiConfigModal';

import { HomeView } from './views/HomeView';
import { NewDDSView } from './views/NewDDSView';
import { ParticipantsView } from './views/ParticipantsView';
import { ConferenceView } from './views/ConferenceView';
import { DDSDetailModal } from './views/DDSDetailModal';
import { EmployeesView } from './views/EmployeesView';
import { LoginView } from './views/LoginView';
import { UserManagementView } from './views/UserManagementView';
import { ConsultarSemanasView } from './views/ConsultarSemanasView';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { ConfirmationModal } from './components/ConfirmationModal';
import { getSemanaId, pertenceASemana } from './utils/weekUtils';
import { sanitizeMotivoAusencia } from './utils/absenceUtils';
import { isDraftFinalized, shouldBlockNewDDS, isDraftForToday } from './utils/draftUtils';

import {
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const getDraftStorageKey = () => `ddps_active_draft_${getSemanaId(new Date())}`;

export default function App() {

  // ==========================================================
  // ESTADO DE NAVEGAÇÃO
  // ==========================================================

  const [
    currentScreen,
    setCurrentScreen
  ] = useState<ScreenView>('inicio');

  // ==========================================================
  // DADOS CENTRAIS
  // ==========================================================

  const [
    status,
    setStatus
  ] = useState<DDPSStatus | null>(null);

  const [
    funcionarios,
    setFuncionarios
  ] = useState<Funcionario[]>([]);

  const [
    allFuncionarios,
    setAllFuncionarios
  ] = useState<Funcionario[]>([]);

  const loadAllFuncionarios = useCallback(async () => {
    try {
      const list = await api.getFuncionarios(true);
      setAllFuncionarios(list);
    } catch (e) {
      console.warn('Erro ao carregar todos os funcionários:', e);
    }
  }, []);

  useEffect(() => {
    if (currentScreen === 'funcionarios') {
      loadAllFuncionarios();
    }
  }, [currentScreen, loadAllFuncionarios]);

  const [
    allDDS,
    setAllDDS
  ] = useState<DDS[]>([]);

  const [
    ddsSemana,
    setDdsSemana
  ] = useState<DDS[]>([]);

  // ==========================================================
  // DDS ATIVO
  // ==========================================================

  const [
    activeDDS,
    setActiveDDS
  ] = useState<DDS | null>(null);

  const [
    participantesMap,
    setParticipantesMap
  ] = useState<Record<string, Participante>>({});

  // ==========================================================
  // MODAIS E ESTADOS AUXILIARES
  // ==========================================================

  const [
    selectedDDSForView,
    setSelectedDDSForView
  ] = useState<DDS | null>(null);

  const [
    showConfigModal,
    setShowConfigModal
  ] = useState(false);

  const [
    showChangePassModal,
    setShowChangePassModal
  ] = useState(false);

  const [
    isLoading,
    setIsLoading
  ] = useState(true);

  const [
    isActionLoading,
    setIsActionLoading
  ] = useState(false);

  const [
    isSyncing,
    setIsSyncing
  ] = useState(false);

  const [
    errorMsg,
    setErrorMsg
  ] = useState<string | null>(null);

  const [
    notification,
    setNotification
  ] = useState<{
    type:
      | 'success'
      | 'info'
      | 'error';
    text: string;
  } | null>(null);

  const [isRemoteDraftLoaded, setIsRemoteDraftLoaded] = useState(false);
  const [showDiscardAndNewModal, setShowDiscardAndNewModal] = useState(false);
  const [showDiscardDraftModal, setShowDiscardDraftModal] = useState(false);

  // ==========================================================
  // RECUPERA RASCUNHO
  // ==========================================================

  useEffect(() => {
    try {
      const draft = localStorage.getItem(getDraftStorageKey());
      if (draft) {
        const parsed = JSON.parse(draft);
        if (parsed.activeDDS && !isDraftFinalized(parsed.activeDDS, allDDS)) {
          setActiveDDS(parsed.activeDDS);
          setParticipantesMap(parsed.participantesMap || {});
        } else {
          localStorage.removeItem(getDraftStorageKey());
          setActiveDDS(null);
          setParticipantesMap({});
        }
      }
    } catch {
      // Ignora erro no rascunho
    }
  }, [allDDS]);

  // Monitora e invalida rascunho ativo se o status for alterado para finalizado
  useEffect(() => {
    if (activeDDS && isDraftFinalized(activeDDS, allDDS)) {
      console.log('[DDPS] Rascunho ativo já finalizado. Limpando rascunho...');
      localStorage.removeItem(getDraftStorageKey());
      api.salvarRascunhoDDS('').catch(() => {});
      setActiveDDS(null);
      setParticipantesMap({});
    }
  }, [activeDDS, allDDS]);

  // ==========================================================
  // SALVA RASCUNHO DO DDS ATIVO
  // ==========================================================

  useEffect(() => {
    // Só permite salvar ou limpar o rascunho APÓS o carregamento inicial do rascunho remoto terminar.
    if (!isRemoteDraftLoaded) return;

    if (activeDDS && !isDraftFinalized(activeDDS, allDDS)) {
      const draftData = JSON.stringify({
        activeDDS,
        participantesMap,
        currentScreen: currentScreen === 'inicio' ? 'participantes' : currentScreen
      });

      // 1. Salva localmente de forma instantânea
      try {
        localStorage.setItem(getDraftStorageKey(), draftData);
      } catch {
        // Storage quota
      }

      // 2. Salva remotamente (debounced) para multi-dispositivo
      const timer = setTimeout(async () => {
        try {
          await api.salvarRascunhoDDS(draftData);
        } catch (e) {
          console.warn('[DDPS] Erro ao sincronizar rascunho remoto:', e);
        }
      }, 2500);

      return () => clearTimeout(timer);
    } else {
      // Se não há DDS ativo válido, limpa o rascunho
      localStorage.removeItem(getDraftStorageKey());

      const limparRascunhoRemoto = async () => {
        try {
          await api.salvarRascunhoDDS('');
        } catch (e) {
          console.warn('[DDPS] Erro ao limpar rascunho remoto:', e);
        }
      };
      limparRascunhoRemoto();
    }
  }, [
    activeDDS,
    participantesMap,
    currentScreen,
    isRemoteDraftLoaded,
    status,
    allDDS
  ]);

  // ==========================================================
  // CARREGAMENTO INICIAL
  // ==========================================================

  const loadInitialData =
    useCallback(
      async () => {

        setIsLoading(true);
        setErrorMsg(null);

        try {

          // --------------------------------------------------
          // STATUS + DDS DA SEMANA
          // --------------------------------------------------

          const [
            statusRes,
            listarDDSRes
          ] =
            await Promise.all([
              api
                .getStatus()
                .catch(() => null),

              api
                .listarDDS()
                .catch(() => [])
            ]);

          if (statusRes) {
            setStatus(
              statusRes
            );
          }

          const rawDDSList = Array.isArray(listarDDSRes) ? listarDDSRes : [];
          setAllDDS(rawDDSList);

          const currentSemanaId = getSemanaId(new Date());
          const ddsFiltrados = rawDDSList.filter((d) => pertenceASemana(d, currentSemanaId));

          setDdsSemana(
            ddsFiltrados
          );

          // --------------------------------------------------
          // FUNCIONÁRIOS
          // --------------------------------------------------

          const funcsRes =
            await api.getFuncionarios();

          setFuncionarios(
            funcsRes
          );

        } catch (err: any) {

          console.error(
            'Erro ao carregar colaboradores:',
            err
          );

          setErrorMsg(
            'Não foi possível carregar os colaboradores. Verifique a conexão.'
          );

          setFuncionarios([]);

        } finally {

          setIsLoading(false);
        }

      },
      []
    );

  // ==========================================================
  // AUTENTICAÇÃO E SESSÃO
  // ==========================================================

  const [currentUser, setCurrentUser] = useState<Usuario | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const handleLoginSuccess = async (user: Usuario) => {
    setCurrentUser(user);
    setIsLoading(true);
    await loadInitialData();
    
    // Tenta carregar rascunho remoto sincronizado (multi-dispositivo) com validação de data/status
    try {
      const backendDraftRes = await api.obterRascunhoDDS();
      if (backendDraftRes.sucesso && backendDraftRes.rascunho) {
        const parsed = JSON.parse(backendDraftRes.rascunho);
        if (parsed.activeDDS && !isDraftFinalized(parsed.activeDDS, allDDS)) {
          setActiveDDS(parsed.activeDDS);
          setParticipantesMap(parsed.participantesMap || {});
          setCurrentScreen('inicio');
        } else {
          localStorage.removeItem(getDraftStorageKey());
          await api.salvarRascunhoDDS('').catch(() => {});
          setActiveDDS(null);
          setParticipantesMap({});
        }
      } else {
        localStorage.removeItem(getDraftStorageKey());
        setActiveDDS(null);
        setParticipantesMap({});
      }
    } catch (e) {
      console.warn('[DDPS] Erro ao carregar rascunho remoto no login:', e);
    } finally {
      setIsRemoteDraftLoaded(true);
    }

    setIsLoading(false);
  };

  const handleLogout = async () => {
    await api.logout();
    setCurrentUser(null);
    setCurrentScreen('inicio');
    setActiveDDS(null);
    setParticipantesMap({});
    setIsRemoteDraftLoaded(false);
  };

  useEffect(() => {
    const verificarAutenticacao = async () => {
      setIsCheckingAuth(true);
      try {
        const res = await api.validarSessao();
        if (res.sucesso && res.usuario) {
          setCurrentUser(res.usuario);
          await loadInitialData();

          // Tenta carregar rascunho remoto sincronizado (multi-dispositivo)
          try {
            const backendDraftRes = await api.obterRascunhoDDS();
            if (backendDraftRes.sucesso && backendDraftRes.rascunho) {
              const parsed = JSON.parse(backendDraftRes.rascunho);
              if (parsed.activeDDS && !isDraftFinalized(parsed.activeDDS, allDDS)) {
                setActiveDDS(parsed.activeDDS);
                setParticipantesMap(parsed.participantesMap || {});
                setCurrentScreen('inicio');
              } else {
                localStorage.removeItem(getDraftStorageKey());
                await api.salvarRascunhoDDS('').catch(() => {});
                setActiveDDS(null);
                setParticipantesMap({});
              }
            } else {
              localStorage.removeItem(getDraftStorageKey());
              setActiveDDS(null);
              setParticipantesMap({});
            }
          } catch (e) {
            console.warn('[DDPS] Erro ao carregar rascunho remoto na inicialização:', e);
          } finally {
            setIsRemoteDraftLoaded(true);
          }
        } else {
          setCurrentUser(null);
          setIsRemoteDraftLoaded(true);
        }
      } catch (err) {
        console.warn('Erro ao verificar sessão:', err);
        setCurrentUser(null);
        setIsRemoteDraftLoaded(true);
      } finally {
        setIsCheckingAuth(false);
        setIsLoading(false);
      }
    };

    verificarAutenticacao();
  }, [loadInitialData]);

  // ==========================================================
  // TOAST
  // ==========================================================

  const showToast = (
    text: string,
    type:
      | 'success'
      | 'info'
      | 'error' = 'success'
  ) => {

    setNotification({
      type,
      text
    });

    setTimeout(() => {

      setNotification(
        null
      );

    }, 4000);
  };

  // ==========================================================
  // INICIAR NOVO DDS
  // ==========================================================

  const handleStartNovoDDS = () => {
    if (activeDDS && shouldBlockNewDDS(activeDDS, status?.data, allDDS)) {
      setShowDiscardAndNewModal(true);
    } else {
      executeStartNovoDDS();
    }
  };

  const executeStartNovoDDS = () => {
    setActiveDDS(null);
    setParticipantesMap({});
    setCurrentScreen('novo_dds');
  };

  const handleContinuarDDS = () => {
    try {
      const draft = localStorage.getItem(getDraftStorageKey());
      if (draft) {
        const parsed = JSON.parse(draft);
        if (parsed.currentScreen) {
          setCurrentScreen(parsed.currentScreen);
          return;
        }
      }
    } catch (e) {
      console.warn('Erro ao ler tela do rascunho:', e);
    }
    // Fallback padrão se não encontrar a tela gravada
    setCurrentScreen('participantes');
  };

  const handleConfirmDescartar = async () => {
    setIsActionLoading(true);
    setShowDiscardDraftModal(false);
    try {
      // 1. Limpa localmente
      localStorage.removeItem(getDraftStorageKey());
      
      // 2. Limpa no servidor imediatamente (sem delay)
      await api.salvarRascunhoDDS('');
      
      // 3. Reseta estados locais
      setActiveDDS(null);
      setParticipantesMap({});
      
      // 4. Atualiza o status/dashboard em tempo real
      const freshStatus = await api.getStatus().catch(() => null);
      if (freshStatus) {
        setStatus(freshStatus);
      }
      
      showToast('Rascunho excluído com sucesso.', 'success');
    } catch (e) {
      console.warn('[DDPS] Erro ao descartar rascunho:', e);
      // Fallback local garantido
      setActiveDDS(null);
      setParticipantesMap({});
      showToast('Rascunho removido localmente, mas houve instabilidade ao remover do servidor.', 'info');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDescartarRascunho = () => {
    setShowDiscardDraftModal(true);
  };

  const handleConfirmDiscardAndNew = async () => {
    setShowDiscardAndNewModal(false);
    setIsActionLoading(true);
    try {
      localStorage.removeItem(getDraftStorageKey());
      await api.salvarRascunhoDDS('').catch((e) => console.warn('[DDPS] Erro ao limpar rascunho remoto:', e));
      executeStartNovoDDS();
    } finally {
      setIsActionLoading(false);
    }
  };

  // ==========================================================
  // CRIAR NOVO DDS
  // ==========================================================

  const handleCreateDDS =
    async (
      formData: {
        tema: string;
        conteudo: string;
        local: string;
        responsavel: string;
        observacoes?: string;
        encarregadoId?: string;
        encarregadoNome?: string;
      }
    ) => {

      setIsActionLoading(true);

      try {

        const result =
          await api.criarDDS(
            formData
          );

        const novoDDS: DDS = {

          idDDS:
            result.idDDS,

          semana:
            status?.semana,

          diaSemana:
            status?.diaSemana ||
            'Hoje',

          diaSemanaNumero:
            status?.diaSemanaNumero,

          data:
            status?.data ||
            '',

          horario:
            status?.horario ||
            '',

          tema:
            formData.tema,

          conteudo:
            formData.conteudo,

          local:
            formData.local,

          responsavel:
            formData.responsavel,

          observacoes:
            formData.observacoes,

          status:
            'pendente',

          participantesQtd:
            0,

          encarregadoId:
            formData.encarregadoId || '',

          encarregadoNome:
            formData.encarregadoNome || '',

          assinaturaEncarregado:
            ''
        };

        setActiveDDS(
          novoDDS
        );

        setParticipantesMap({});

        showToast(
          'DDS registrado com sucesso! Coletando participantes.',
          'success'
        );

        setCurrentScreen(
          'participantes'
        );

      } catch (err: any) {

        console.error(
          'Erro ao criar DDS:',
          err
        );

        const msg = err?.message || 'Falha ao comunicar com a API do Google Apps Script. Verifique os dados.';
        setErrorMsg(msg);
        showToast(msg, 'error');

      } finally {

        setIsActionLoading(
          false
        );
      }
    };

  // ==========================================================
  // ATUALIZA PARTICIPANTE NO MAPA
  // ==========================================================

  const handleUpdateParticipante =
    (
      idFuncionario: string,
      data: Partial<Participante>
    ) => {

      setParticipantesMap(
        (prev) => {

          const existing =
            prev[idFuncionario] || {
              idFuncionario,
              nome: '',
              emociograma: 'BOM',
              assinatura: ''
            };

          return {

            ...prev,

            [idFuncionario]: {

              ...existing,

              ...data
            }
          };
        }
      );
    };

  // ==========================================================
  // SALVAR PARTICIPANTES E AVANÇAR PARA CONFERÊNCIA
  // ==========================================================

  const handleFinishParticipants = async () => {
    if (!activeDDS || isActionLoading) {
      return;
    }

    const currentIdDDS = String(activeDDS.idDDS || '').trim();
    if (!currentIdDDS) {
      setErrorMsg('ID do DDS inválido para salvamento.');
      showToast('ID do DDS inválido.', 'error');
      return;
    }

    setIsActionLoading(true);
    setErrorMsg(null);

    try {
      // ----------------------------------------------------
      // PEGA OS PARTICIPANTES CONCLUÍDOS (ASSINADOS OU AUSENTES COM MOTIVO)
      // ----------------------------------------------------
      const concluidos = (
        Object.values(participantesMap) as Participante[]
      ).filter((p) => {
        if (p.ausente) {
          return Boolean(p.motivoAusencia && p.motivoAusencia.trim().length > 0);
        }
        return Boolean(p.assinatura && p.assinatura.length > 50);
      }).map((p) => {
        if (p.ausente) {
          return {
            ...p,
            motivoAusencia: sanitizeMotivoAusencia(p.motivoAusencia) || 'Atestado'
          };
        }
        return p;
      });

      if (concluidos.length === 0) {
        throw new Error('É necessário ao menos 1 participante (assinado ou ausente registrado) para salvar.');
      }

      console.log('================================================');
      console.log('[DDPS APP] INICIANDO SALVAMENTO DE PARTICIPANTES');
      console.log('[DDPS APP] ID_DDS:', currentIdDDS);
      console.log('[DDPS APP] Total participantes:', concluidos.length);

      // a) Salvar todos os participantes (assinados e ausentes com motivo)
      const resultado = await api.salvarParticipantes(currentIdDDS, concluidos);

      console.log('[DDPS APP] RESULTADO SALVAR PARTICIPANTES:', resultado);

      // b) Confirmar explicitamente resultado.sucesso === true || resultado.success === true
      const salvamentoSucesso = Boolean(
        resultado &&
        ((resultado as any).sucesso === true || (resultado as any).success === true)
      );

      // c) Se qualquer falha ocorrer, PARAR imediatamente e permanecer na tela atual
      if (!salvamentoSucesso) {
        throw new Error(
          resultado?.message ||
          (resultado as any)?.mensagem ||
          'O servidor rejeitou a gravação dos participantes e assinaturas.'
        );
      }

      showToast(
        `${concluidos.length} participante(s) gravado(s) com sucesso! Avançando para a conferência.`,
        'success'
      );

      // d) Avança exclusivamente para a tela de conferência
      setCurrentScreen('conferencia');

    } catch (err: any) {
      console.error('================================================');
      console.error('[DDPS APP] ERRO AO SALVAR PARTICIPANTES:', err);
      console.error('================================================');

      setErrorMsg(
        err?.message ||
        'Erro ao salvar participantes no servidor.'
      );

      showToast(
        err?.message || 'Falha ao salvar participantes. Permaneça na tela para tentar novamente.',
        'error'
      );

      // NÃO muda de tela. O usuário continua na tela de participantes.
    } finally {
      setIsActionLoading(false);
    }
  };

  // ==========================================================
  // FINALIZAR DDS (A PARTIR DA CONFERÊNCIA)
  // ==========================================================

  const handleSaveAndFinalizeDDS = async () => {
    if (!activeDDS || isActionLoading) {
      return;
    }

    const currentIdDDS = String(activeDDS.idDDS || '').trim();
    if (!currentIdDDS) {
      setErrorMsg('ID do DDS inválido para salvamento.');
      showToast('ID do DDS inválido.', 'error');
      return;
    }

    setIsActionLoading(true);
    setErrorMsg(null);

    try {
      const allParts = Object.values(participantesMap) as Participante[];
      const participantesFinal = allParts.filter((p) => {
        if (p.ausente) {
          return Boolean(p.motivoAusencia && p.motivoAusencia.trim().length > 0);
        }
        return Boolean(p.assinatura && p.assinatura.length > 50);
      });

      const payloadParts = participantesFinal.map((p) => ({
        idFuncionario: p.idFuncionario,
        nome: p.nome,
        emociograma: p.ausente ? '' : p.emociograma,
        assinatura: p.ausente ? '' : p.assinatura,
        ausente: p.ausente ? 'SIM' : 'NAO',
        motivoAusencia: p.ausente ? (sanitizeMotivoAusencia(p.motivoAusencia) || 'Atestado') : ''
      }));

      // 1 Única Chamada HTTP Consolidada para salvar participantes e finalizar
      const resultado = await api.salvarDDSCompleto({
        idDDS: currentIdDDS,
        participantes: payloadParts,
        finalizar: true
      });

      const finalizacaoSucesso = Boolean(
        resultado &&
        ((resultado as any).sucesso === true || (resultado as any).success === true)
      );

      if (!finalizacaoSucesso) {
        throw new Error(
          resultado?.message ||
          'O servidor não confirmou a finalização do DDS.'
        );
      }

      // Atualiza a lista localmente sem necessidade de re-query HTTP completa
      setDdsSemana((prev) =>
        prev.map((d) =>
          d.idDDS === currentIdDDS
            ? { ...d, status: 'FINALIZADO', participantesQtd: participantesFinal.length }
            : d
        )
      );

      // LIMPA RASCUNHO IMEDIATAMENTE NO CLIENTE E NO SERVIDOR (sem delay)
      localStorage.removeItem(getDraftStorageKey());
      await api.salvarRascunhoDDS('').catch((e) => {
        console.warn('[DDPS] Erro ao limpar rascunho remoto após finalizar:', e);
      });
      
      setActiveDDS(null);
      setParticipantesMap({});

      showToast(
        'DDS Finalizado e registrado na planilha com sucesso!',
        'success'
      );

      // Navega para a tela inicial somente após todas as operações terminarem com sucesso
      setCurrentScreen('inicio');

      api
        .getStatus()
        .then(setStatus)
        .catch((err) =>
          console.warn('[DDPS APP] Falha ao atualizar status:', err)
        );

    } catch (err: any) {
      console.error('================================================');
      console.error('[DDPS APP] ERRO AO FINALIZAR DDS:', err);
      console.error('================================================');

      setErrorMsg(
        err?.message ||
        'Erro ao finalizar DDS no Google Apps Script.'
      );

      showToast(
        err?.message || 'Falha ao finalizar DDS. Permaneça na tela para revisar.',
        'error'
      );

    } finally {
      setIsActionLoading(false);
    }
  };

  // ==========================================================
  // DELETAR DDS SUCESSO
  // ==========================================================

  const handleDeleteSuccess = (idDDS: string) => {
    setDdsSemana((prev) => prev.filter((d) => d.idDDS !== idDDS));
    setAllDDS((prev) => prev.filter((d) => d.idDDS !== idDDS));
    if (activeDDS && activeDDS.idDDS === idDDS) {
      setActiveDDS(null);
      setParticipantesMap({});
    }
    setSelectedDDSForView(null);
    showToast('DDPS excluído com sucesso.', 'success');
  };

  // ==========================================================
  // SINCRONIZAR DADOS MANUALMENTE
  // ==========================================================

  const handleSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);

    try {
      // Chamada HTTP agregada otimizada (com fallback inteligente)
      const syncResult = await api.sincronizar();

      if (syncResult.dds) {
        const rawDDSList = Array.isArray(syncResult.dds) ? syncResult.dds : [];
        setAllDDS(rawDDSList);
        const currentSemanaId = getSemanaId(new Date());
        const ddsFiltrados = rawDDSList.filter((d) => pertenceASemana(d, currentSemanaId));
        setDdsSemana(ddsFiltrados);
      }

      if (syncResult.status) {
        setStatus(syncResult.status);
      }

      // Se a tela de colaboradores estiver ativa, sincroniza também
      if (currentScreen === 'colaboradores') {
        loadAllFuncionarios();
      }

      showToast('Dados sincronizados com sucesso.', 'success');
    } catch (err: any) {
      console.error('[DDPS APP] Erro ao sincronizar dados:', err);
      showToast(
        err?.message || 'Falha ao sincronizar dados com o Google Sheets.',
        'error'
      );
    } finally {
      setIsSyncing(false);
    }
  };

  // ==========================================================
  // STATUS DA API
  // ==========================================================

  const isApiConfigured =
    Boolean(
      getApiBaseUrl()
    );

  // ==========================================================
  // INTERFACE
  // ==========================================================

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#111214] text-white flex flex-col items-center justify-center p-4">
        <LoadingSpinner
          message="Verificando autenticação..."
          submessage="Carregando sessão no DDPS Web App"
        />
      </div>
    );
  }

  if (!currentUser) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div
      className="
        min-h-screen
        bg-[#F3F4F6]
        text-[#1A1C1E]
        flex
        flex-col
        font-sans
        selection:bg-yellow-400
        selection:text-black
      "
    >

      {/* =====================================================
          NOTIFICAÇÃO
      ====================================================== */}

      {notification && (

        <div
          className="
            fixed
            top-18
            inset-x-4
            z-50
            max-w-md
            mx-auto
            animate-bounce
            flex
            items-center
            gap-3
            p-4
            rounded-2xl
            bg-[#1A1C1E]
            text-white
            shadow-xl
            border
            border-gray-700
          "
        >

          {notification.type ===
            'error' ? (

            <AlertCircle
              className="
                w-6
                h-6
                text-red-400
                shrink-0
              "
            />

          ) : (

            <CheckCircle
              className="
                w-6
                h-6
                text-yellow-400
                shrink-0
              "
            />
          )}

          <p
            className="
              text-sm
              font-bold
            "
          >
            {notification.text}
          </p>

        </div>
      )}

      {/* =====================================================
          HEADER
      ====================================================== */}

      <Header
        status={
          status
        }
        currentUser={
          currentUser
        }
        onOpenConfig={() =>
          setShowConfigModal(true)
        }
        isApiConfigured={
          isApiConfigured
        }
        onNavigate={(screen) => setCurrentScreen(screen)}
        onLogout={handleLogout}
        onChangePassword={() => setShowChangePassModal(true)}
      />

      {/* =====================================================
          AVISO DE API
      ====================================================== */}

      {!isApiConfigured &&
        currentScreen === 'inicio' && (

        <div
          className="
            bg-yellow-50
            border-b
            border-yellow-200
            px-4
            py-2.5
            text-xs
            sm:text-sm
            text-yellow-900
          "
        >

          <div
            className="
              max-w-7xl
              mx-auto
              flex
              items-center
              justify-between
              gap-2
            "
          >

            <span
              className="
                flex
                items-center
                gap-2
              "
            >

              <AlertCircle
                className="
                  w-4
                  h-4
                  text-yellow-600
                  shrink-0
                "
              />

              <span>

                <strong>
                  Modo Demonstração:
                </strong>{' '}

                Configure{' '}

                <code
                  className="
                    bg-yellow-100
                    px-1.5
                    py-0.5
                    rounded
                    font-mono
                    text-xs
                    border
                    border-yellow-200
                  "
                >
                  VITE_DDPS_API_URL
                </code>{' '}

                com a URL do seu Web App
                do Google Apps Script.

              </span>

            </span>

            <button
              type="button"
              onClick={() =>
                setShowConfigModal(true)
              }
              className="
                text-xs
                font-black
                uppercase
                underline
                hover:text-black
                shrink-0
                ml-2
              "
            >
              Configurar URL
            </button>

          </div>

        </div>
      )}

      {/* =====================================================
          CONTEÚDO PRINCIPAL
      ====================================================== */}

      <main
        className="
          flex-1
          w-full
          max-w-7xl
          mx-auto
          px-4
          sm:px-6
          pt-5
          sm:pt-6
        "
      >

        {/* ===================================================
            ERRO GLOBAL
        ==================================================== */}

        {errorMsg && (

          <div
            className="mb-6"
          >

            <ErrorMessage

              message={
                errorMsg
              }

              onRetry={() => {

                setErrorMsg(
                  null
                );

                loadInitialData();
              }}

            />

          </div>
        )}

        {/* ===================================================
            LOADING INICIAL
        ==================================================== */}

        {isLoading ? (

          <div
            className="
              py-20
            "
          >

            <LoadingSpinner

              message="
                Conectando ao DDPS...
              "

              submessage="
                Carregando programação da semana e lista de funcionários da equipe
              "

            />

          </div>

        ) : (

          <>

            {/* =================================================
                TELA INÍCIO
            ================================================== */}

            {currentScreen ===
              'inicio' && (

              <HomeView
                status={status}
                ddsSemana={ddsSemana}
                onNovoDDS={handleStartNovoDDS}
                onViewDDS={(dds) => setSelectedDDSForView(dds)}
                onConsultarSemanas={() => setCurrentScreen('consultar_semanas')}
                onSync={handleSync}
                isSyncing={isSyncing}
                activeDDS={activeDDS}
                onContinuarDDS={handleContinuarDDS}
                onDescartarRascunho={handleDescartarRascunho}
              />
            )}

            {/* =================================================
                TELA CONSULTAR SEMANAS (HISTÓRICO E CONSULTA DE SEMANAS)
            ================================================== */}

            {(currentScreen === 'consultar_semanas' || currentScreen === 'lista_dds') && (
              <ConsultarSemanasView
                status={status}
                allDDS={allDDS}
                onSelectDDS={(dds) => {
                  setSelectedDDSForView(dds);
                }}
                onBack={() => setCurrentScreen('inicio')}
              />
            )}

            {/* =================================================
                TELA FUNCIONÁRIOS
            ================================================== */}

            {currentScreen ===
              'funcionarios' && (
              <EmployeesView
                funcionarios={allFuncionarios}
                onRefresh={async () => {
                  await loadAllFuncionarios();
                  const act = await api.getFuncionarios(false);
                  setFuncionarios(act);
                }}
                onBack={() => setCurrentScreen('inicio')}
              />
            )}

            {/* =================================================
                TELA USUÁRIOS (ADMIN)
            ================================================== */}

            {currentScreen === 'usuarios' && currentUser && (
              <UserManagementView
                currentUser={currentUser}
                onBack={() => setCurrentScreen('inicio')}
              />
            )}

            {/* =================================================
                TELA NOVO DDS
            ================================================== */}

            {currentScreen ===
              'novo_dds' && (

              <NewDDSView

                status={
                  status
                }

                onCancel={() =>
                  setCurrentScreen(
                    'inicio'
                  )
                }

                onSubmit={
                  handleCreateDDS
                }

                isLoading={
                  isActionLoading
                }

                funcionarios={
                  funcionarios
                }

              />
            )}

            {/* =================================================
                TELA PARTICIPANTES
            ================================================== */}

            {currentScreen ===
              'participantes' &&
              activeDDS && (

              <ParticipantsView

                dds={
                  activeDDS
                }

                funcionarios={
                  funcionarios
                }

                participantesMap={
                  participantesMap
                }

                onUpdateParticipante={
                  handleUpdateParticipante
                }

                onFinishParticipants={
                  handleFinishParticipants
                }

                onBackToDDS={() =>
                  setCurrentScreen(
                    'novo_dds'
                  )
                }

                isLoading={
                  isActionLoading
                }

              />
            )}

            {/* =================================================
                TELA CONFERÊNCIA
            ================================================== */}

            {currentScreen ===
              'conferencia' &&
              activeDDS && (

              <ConferenceView

                dds={
                  activeDDS
                }

                participantes={
                  Object.values(
                    participantesMap
                  ) as Participante[]
                }

                onEdit={() =>
                  setCurrentScreen(
                    'participantes'
                  )
                }

                onSaveDDS={
                  handleSaveAndFinalizeDDS
                }

                onSignEncarregado={async (assinatura: string) => {
                  if (!activeDDS) return;

                  const updatedDDS = {
                    ...activeDDS,
                    assinaturaEncarregado: assinatura
                  };
                  setActiveDDS(updatedDDS);

                  // Atualiza localmente para robustez offline
                  const list = LocalDDSStorage.getDDSList();
                  const item = list.find((d) => d.idDDS === activeDDS.idDDS);
                  if (item) {
                    item.assinaturaEncarregado = assinatura;
                    LocalDDSStorage.saveDDS(item);
                  }

                  if (activeDDS.idDDS && !activeDDS.idDDS.startsWith('DDS-OFFLINE-')) {
                    try {
                      await api.registrarAssinaturaEncarregado(
                        activeDDS.idDDS,
                        activeDDS.encarregadoId || '',
                        assinatura
                      );
                      showToast('Assinatura do encarregado registrada!', 'success');
                    } catch (err) {
                      console.error('Erro ao salvar assinatura de encarregado:', err);
                      showToast('Salvo offline. Sincronização pendente.', 'info');
                    }
                  }
                }}

                isLoading={
                  isActionLoading
                }

              />
            )}

          </>
        )}

      </main>

      {/* =====================================================
          MODAL DETALHES DDS
      ====================================================== */}

      {selectedDDSForView && (
        <DDSDetailModal
          dds={selectedDDSForView}
          status={status}
          ddsSemana={ddsSemana}
          currentUser={currentUser}
          onClose={() => setSelectedDDSForView(null)}
          onDeleteSuccess={handleDeleteSuccess}
        />
      )}

      {/* =====================================================
          MODAL CONFIGURAÇÃO DA API
      ====================================================== */}

      <ApiConfigModal

        isOpen={
          showConfigModal
        }

        onClose={() =>
          setShowConfigModal(
            false
          )
        }

        onConfigSaved={() => {

          loadInitialData();

          showToast(
            'Configuração de API atualizada!'
          );

        }}

      />

      <ChangePasswordModal
        isOpen={showChangePassModal}
        onClose={() => setShowChangePassModal(false)}
      />

      {/* Modal para Confirmar Descarte de Rascunho na Home */}
      <ConfirmationModal
        isOpen={showDiscardDraftModal}
        title="Descartar Rascunho"
        description="Tem certeza que deseja excluir permanentemente o rascunho em andamento? Esta ação não poderá ser desfeita."
        confirmLabel="Sim, Descartar"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={handleConfirmDescartar}
        onCancel={() => setShowDiscardDraftModal(false)}
      />

      {/* Modal para Confirmar Descarte ao Iniciar um Novo DDS */}
      <ConfirmationModal
        isOpen={showDiscardAndNewModal}
        title="Iniciar Novo DDS"
        description="Você já possui um rascunho de DDPS em andamento. Deseja descartá-lo para iniciar um novo do zero?"
        confirmLabel="Descartar e Iniciar"
        cancelLabel="Voltar"
        variant="danger"
        onConfirm={handleConfirmDiscardAndNew}
        onCancel={() => setShowDiscardAndNewModal(false)}
      />

    </div>
  );
}