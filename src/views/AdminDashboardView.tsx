import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  ArrowLeft, 
  Clock, 
  Calendar, 
  Users, 
  CheckCircle2, 
  AlertOctagon, 
  TrendingUp, 
  Download, 
  Filter, 
  Search, 
  Eye, 
  HelpCircle,
  ShieldCheck,
  Building,
  Target,
  Sparkles,
  Printer,
  FileText
} from 'lucide-react';
import { DDS, DDPSStatus, Usuario } from '../types';
import { Button } from '../components/Button';
import { gerarRelatorioGerencialPDF } from '../utils/pdfGenerator';
import { 
  CONFIG_DDS_METAS, 
  calcularDuracaoMinutos, 
  classificarDesempenho, 
  CLASSIFICACOES, 
  formatarDuracaoTexto, 
  formatarHorarioExibicao, 
  extrairMinutosDoDia,
  minutosParaHorarioString,
  obterHorarioFinalizacaoDDS,
  isDDPSGeral,
  identificarTipoDDPS,
  TipoDDPS
} from '../utils/durationUtils';
import { formatarDataApenas } from '../utils/dateFormatter';

interface AdminDashboardViewProps {
  allDDS: DDS[];
  status: DDPSStatus | null;
  currentUser: Usuario | null;
  onBack: () => void;
  onSelectDDS: (dds: DDS) => void;
}

type FiltroPeriodo = 'todos' | 'hoje' | 'semana_atual' | 'ultimos_7' | 'ultimos_30' | 'mes_atual' | 'custom';
type FiltroTipo = 'todos' | 'convencional' | 'geral';

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  allDDS,
  status,
  currentUser,
  onBack,
  onSelectDDS
}) => {
  // ==========================================================
  // ESTADOS DE FILTRO
  // ==========================================================
  const [filtroPeriodo, setFiltroPeriodo] = useState<FiltroPeriodo>('todos');
  const [dataInicioCustom, setDataInicioCustom] = useState<string>('');
  const [dataFimCustom, setDataFimCustom] = useState<string>('');
  const [filtroResponsavel, setFiltroResponsavel] = useState<string>('todos');
  const [filtroTipoDDPS, setFiltroTipoDDPS] = useState<FiltroTipo>('todos');
  const [filtroClassificacao, setFiltroClassificacao] = useState<string>('todos');
  const [buscaTema, setBuscaTema] = useState<string>('');

  // ==========================================================
  // SEGURANÇA: VALIDAÇÃO DE ACESSO EXCLUSIVO ADMIN
  // ==========================================================
  if (!currentUser || currentUser.perfil !== 'ADMIN') {
    return (
      <div className="w-full max-w-xl mx-auto py-16 px-4 text-center animate-fadeIn">
        <div className="w-16 h-16 rounded-3xl bg-red-500/10 border border-red-500/30 text-red-400 mx-auto flex items-center justify-center mb-4">
          <AlertOctagon className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Acesso Restrito ao Administrador</h2>
        <p className="text-sm text-gray-400 mb-6 leading-relaxed">
          O Dashboard Gerencial de indicadores e acompanhamento de tempos do DDPS é de visualização exclusiva para gestores com perfil ADMIN.
        </p>
        <Button variant="primary" onClick={onBack} leftIcon={<ArrowLeft className="w-4 h-4" />}>
          Voltar ao Início
        </Button>
      </div>
    );
  }

  // ==========================================================
  // LISTA DE RESPONSÁVEIS ÚNICOS PARA O DROPDOWN
  // ==========================================================
  const responsaveisDisponiveis = useMemo(() => {
    const setResp = new Set<string>();
    allDDS.forEach(d => {
      const resp = (d.responsavel || '').trim();
      if (resp) setResp.add(resp);
    });
    return Array.from(setResp).sort();
  }, [allDDS]);

  // ==========================================================
  // PROCESSAMENTO E CÁLCULO DOS REGISTROS COM DURAÇÃO E MODALIDADE
  // ==========================================================
  const ddsProcessados = useMemo(() => {
    return allDDS.map(d => {
      const isGeral = isDDPSGeral(d.tema);
      const tipoDDPS: TipoDDPS = identificarTipoDDPS(d.tema);
      const isFinalizado = String(d.status || '').toLowerCase() === 'finalizado';
      
      // O horário oficial de finalização prioriza finalizedAt (assinatura do responsável)
      const horarioFinalizacao = isFinalizado ? obterHorarioFinalizacaoDDS(d) : undefined;
      const duracaoMinutos = isFinalizado ? calcularDuracaoMinutos(horarioFinalizacao) : null;
      const classificacao = isFinalizado ? classificarDesempenho(duracaoMinutos, d.tema) : 'INDISPONIVEL';

      // Parse da data para filtros
      let dataObj: Date | null = null;
      if (d.data) {
        if (d.data.includes('T')) {
          dataObj = new Date(d.data);
        } else if (/^\d{4}-\d{2}-\d{2}/.test(d.data)) {
          const [ano, mes, dia] = d.data.substring(0, 10).split('-').map(Number);
          dataObj = new Date(ano, mes - 1, dia);
        } else if (/^\d{2}\/\d{2}\/\d{4}/.test(d.data)) {
          const [dia, mes, ano] = d.data.substring(0, 10).split('/').map(Number);
          dataObj = new Date(ano, mes - 1, dia);
        }
      }

      return {
        ...d,
        isGeral,
        tipoDDPS,
        isFinalizado,
        horarioFinalizacao,
        duracaoMinutos,
        classificacao,
        dataObj
      };
    });
  }, [allDDS]);

  // ==========================================================
  // FILTRAGEM DOS REGISTROS
  // ==========================================================
  const ddsFiltrados = useMemo(() => {
    const agora = new Date();
    const hojeZero = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate()).getTime();

    return ddsProcessados.filter(item => {
      // 1. Filtro de Período
      if (item.dataObj) {
        const itemTime = item.dataObj.getTime();

        if (filtroPeriodo === 'hoje') {
          if (itemTime < hojeZero || itemTime >= hojeZero + 86400000) return false;
        } else if (filtroPeriodo === 'ultimos_7') {
          if (itemTime < hojeZero - 7 * 86400000) return false;
        } else if (filtroPeriodo === 'ultimos_30') {
          if (itemTime < hojeZero - 30 * 86400000) return false;
        } else if (filtroPeriodo === 'mes_atual') {
          if (item.dataObj.getFullYear() !== agora.getFullYear() || item.dataObj.getMonth() !== agora.getMonth()) {
            return false;
          }
        } else if (filtroPeriodo === 'semana_atual') {
          if (status?.semana && item.semana && String(item.semana) !== String(status.semana)) {
            return false;
          }
        } else if (filtroPeriodo === 'custom') {
          if (dataInicioCustom) {
            const dtIni = new Date(dataInicioCustom).getTime();
            if (itemTime < dtIni) return false;
          }
          if (dataFimCustom) {
            const dtFim = new Date(dataFimCustom).getTime() + 86400000;
            if (itemTime >= dtFim) return false;
          }
        }
      }

      // 2. Filtro de Tipo de DDPS
      if (filtroTipoDDPS === 'convencional' && item.isGeral) return false;
      if (filtroTipoDDPS === 'geral' && !item.isGeral) return false;

      // 3. Filtro de Responsável
      if (filtroResponsavel !== 'todos') {
        if ((item.responsavel || '').trim() !== filtroResponsavel) return false;
      }

      // 4. Filtro de Classificação
      if (filtroClassificacao !== 'todos') {
        if (item.classificacao !== filtroClassificacao) return false;
      }

      // 5. Busca por Tema / Local / Responsável
      if (buscaTema.trim()) {
        const termo = buscaTema.toLowerCase();
        const temaStr = (item.tema || '').toLowerCase();
        const localStr = (item.local || '').toLowerCase();
        const respStr = (item.responsavel || '').toLowerCase();
        if (!temaStr.includes(termo) && !localStr.includes(termo) && !respStr.includes(termo)) {
          return false;
        }
      }

      return true;
    });
  }, [ddsProcessados, filtroPeriodo, dataInicioCustom, dataFimCustom, filtroTipoDDPS, filtroResponsavel, filtroClassificacao, buscaTema, status]);

  // ==========================================================
  // INDICADORES PRINCIPAIS & COMPLEMENTARES COM SEGREGAÇÃO GERAL
  // ==========================================================
  const metricas = useMemo(() => {
    const totalDDPS = ddsFiltrados.length;
    const finalizados = ddsFiltrados.filter(d => d.isFinalizado);
    const abertos = ddsFiltrados.filter(d => !d.isFinalizado);

    // SEGREGAÇÃO: CONVENCIONAIS VS GERAIS
    const convencionais = ddsFiltrados.filter(d => !d.isGeral);
    const gerais = ddsFiltrados.filter(d => d.isGeral);

    const finalizadosConvencionais = finalizados.filter(d => !d.isGeral);
    const finalizadosGerais = finalizados.filter(d => d.isGeral);

    // --- CONVENCIONAIS (Medição de Duração e Regra Binária de Meta) ---
    const comDuracaoConvencional = finalizadosConvencionais.filter(d => d.duracaoMinutos !== null);
    const semHorario = finalizados.filter(d => d.duracaoMinutos === null);

    let somaMinutosConvencional = 0;
    comDuracaoConvencional.forEach(d => {
      somaMinutosConvencional += (d.duracaoMinutos || 0);
    });
    const duracaoMediaConvencional = comDuracaoConvencional.length > 0 
      ? Math.round(somaMinutosConvencional / comDuracaoConvencional.length) 
      : null;

    // Horário médio de término convencional
    let somaMinutosTerminoConv = 0;
    let countTerminoConv = 0;
    comDuracaoConvencional.forEach(d => {
      const minDia = extrairMinutosDoDia(d.horarioFinalizacao);
      if (minDia !== null) {
        somaMinutosTerminoConv += minDia;
        countTerminoConv++;
      }
    });
    const horarioMedioTerminoConvencional = countTerminoConv > 0 
      ? minutosParaHorarioString(somaMinutosTerminoConv / countTerminoConv) 
      : 'N/D';

    // REGRA BINÁRIA OFICIAL CONVENCIONAL:
    // - Até 20 min: DENTRO_DA_META
    // - Acima de 20 min: EXCESSIVA (sem faixa de atenção)
    let countMetaConvencional = 0;
    let countExcessivaConvencional = 0;

    comDuracaoConvencional.forEach(d => {
      if (d.classificacao === 'DENTRO_DA_META') countMetaConvencional++;
      else if (d.classificacao === 'EXCESSIVA') countExcessivaConvencional++;
    });

    const baseConvMedidos = comDuracaoConvencional.length;
    const percMetaConvencional = baseConvMedidos > 0 ? Math.round((countMetaConvencional / baseConvMedidos) * 100) : 0;
    const percExcessivaConvencional = baseConvMedidos > 0 ? Math.round((countExcessivaConvencional / baseConvMedidos) * 100) : 0;

    // --- DDPS GERAL DA ENGENHARIA (Indicadores Próprios) ---
    const comDuracaoGerais = finalizadosGerais.filter(d => d.duracaoMinutos !== null);
    let somaMinutosGerais = 0;
    comDuracaoGerais.forEach(d => {
      somaMinutosGerais += (d.duracaoMinutos || 0);
    });
    const duracaoMediaGeral = comDuracaoGerais.length > 0
      ? Math.round(somaMinutosGerais / comDuracaoGerais.length)
      : null;

    let somaMinutosTerminoGeral = 0;
    let countTerminoGeral = 0;
    comDuracaoGerais.forEach(d => {
      const minDia = extrairMinutosDoDia(d.horarioFinalizacao);
      if (minDia !== null) {
        somaMinutosTerminoGeral += minDia;
        countTerminoGeral++;
      }
    });
    const horarioMedioTerminoGeral = countTerminoGeral > 0
      ? minutosParaHorarioString(somaMinutosTerminoGeral / countTerminoGeral)
      : 'N/D';

    let totalParticipantesGerais = 0;
    gerais.forEach(d => {
      totalParticipantesGerais += (d.participantesQtd || d.participantes?.length || 0);
    });

    // --- ESTATÍSTICAS GERAIS (NÃO EXCLUEM DDPS GERAL) ---
    let totalParticipantes = 0;
    ddsFiltrados.forEach(d => {
      totalParticipantes += (d.participantesQtd || d.participantes?.length || 0);
    });
    const mediaParticipantes = totalDDPS > 0 ? (totalParticipantes / totalDDPS).toFixed(1) : '0';

    // Ranking de Temas (todos)
    const mapTemas: Record<string, number> = {};
    ddsFiltrados.forEach(d => {
      const t = (d.tema || 'Tema não informado').trim();
      mapTemas[t] = (mapTemas[t] || 0) + 1;
    });
    const temasOrdenados = Object.entries(mapTemas)
      .map(([tema, qtd]) => ({ 
        tema, 
        qtd, 
        isGeral: isDDPSGeral(tema),
        percentual: totalDDPS > 0 ? Math.round((qtd / totalDDPS) * 100) : 0 
      }))
      .sort((a, b) => b.qtd - a.qtd);

    // Desempenho por Responsável / TST (segregado)
    const mapResp: Record<string, { 
      total: number; 
      convencionaisQtd: number;
      geraisQtd: number;
      dentroMetaConv: number; 
      somaDuracaoConv: number; 
      comDuracaoConvQtd: number;
      somaDuracaoGeral: number;
      comDuracaoGeralQtd: number;
      participantesTotal: number;
    }> = {};

    ddsFiltrados.forEach(d => {
      const r = (d.responsavel || 'Não informado').trim();
      if (!mapResp[r]) {
        mapResp[r] = { 
          total: 0, 
          convencionaisQtd: 0,
          geraisQtd: 0,
          dentroMetaConv: 0, 
          somaDuracaoConv: 0, 
          comDuracaoConvQtd: 0,
          somaDuracaoGeral: 0,
          comDuracaoGeralQtd: 0,
          participantesTotal: 0
        };
      }
      mapResp[r].total++;
      mapResp[r].participantesTotal += (d.participantesQtd || d.participantes?.length || 0);

      if (d.isGeral) {
        mapResp[r].geraisQtd++;
        if (d.duracaoMinutos !== null) {
          mapResp[r].somaDuracaoGeral += d.duracaoMinutos;
          mapResp[r].comDuracaoGeralQtd++;
        }
      } else {
        mapResp[r].convencionaisQtd++;
        if (d.duracaoMinutos !== null) {
          mapResp[r].somaDuracaoConv += d.duracaoMinutos;
          mapResp[r].comDuracaoConvQtd++;
          if (d.classificacao === 'DENTRO_DA_META') {
            mapResp[r].dentroMetaConv++;
          }
        }
      }
    });

    const responsaveisOrdenados = Object.entries(mapResp)
      .map(([responsavel, dados]) => ({
        responsavel,
        total: dados.total,
        convencionaisQtd: dados.convencionaisQtd,
        geraisQtd: dados.geraisQtd,
        duracaoMediaConv: dados.comDuracaoConvQtd > 0 ? Math.round(dados.somaDuracaoConv / dados.comDuracaoConvQtd) : null,
        percMetaConv: dados.comDuracaoConvQtd > 0 ? Math.round((dados.dentroMetaConv / dados.comDuracaoConvQtd) * 100) : 0,
        dentroMetaConv: dados.dentroMetaConv,
        duracaoMediaGeral: dados.comDuracaoGeralQtd > 0 ? Math.round(dados.somaDuracaoGeral / dados.comDuracaoGeralQtd) : null,
        participantesTotal: dados.participantesTotal
      }))
      .sort((a, b) => b.total - a.total);

    // Distribuição de Horários dos Convencionais (Regra Binária: ≤ 07:20 vs > 07:20)
    let faixaAte0720 = 0;
    let faixaDe0721a0740 = 0;
    let faixaApos0740 = 0;

    comDuracaoConvencional.forEach(d => {
      const minDia = extrairMinutosDoDia(d.horarioFinalizacao);
      if (minDia !== null) {
        if (minDia <= 7 * 60 + 20) {
          faixaAte0720++;
        } else if (minDia <= 7 * 60 + 40) {
          faixaDe0721a0740++;
        } else {
          faixaApos0740++;
        }
      }
    });

    return {
      totalDDPS,
      finalizados: finalizados.length,
      abertos: abertos.length,
      // Convencionais
      totalConvencionais: convencionais.length,
      finalizadosConvencionais: finalizadosConvencionais.length,
      comDuracaoConvencional: comDuracaoConvencional.length,
      duracaoMediaConvencional,
      horarioMedioTerminoConvencional,
      countMetaConvencional,
      countExcessivaConvencional,
      percMetaConvencional,
      percExcessivaConvencional,
      // Gerais
      totalGerais: gerais.length,
      finalizadosGerais: finalizadosGerais.length,
      comDuracaoGerais: comDuracaoGerais.length,
      duracaoMediaGeral,
      horarioMedioTerminoGeral,
      totalParticipantesGerais,
      // Totais gerais
      semHorario: semHorario.length,
      totalParticipantes,
      mediaParticipantes,
      temasOrdenados,
      totalTemasDistintos: temasOrdenados.length,
      responsaveisOrdenados,
      faixasHorarioConvencionais: {
        ate0720: faixaAte0720,
        de0721a0740: faixaDe0721a0740,
        apos0740: faixaApos0740
      }
    };
  }, [ddsFiltrados]);

  // ==========================================================
  // EXPORTAÇÃO DE RELATÓRIO PARA CSV COM MODALIDADE
  // ==========================================================
  const exportarRelatorioCSV = () => {
    if (ddsFiltrados.length === 0) return;

    const cabecalhos = [
      'ID DDS',
      'Data',
      'Dia da Semana',
      'Modalidade (Tipo)',
      'Responsável / TST',
      'Tema',
      'Local',
      'Status',
      'Horário Início Oficial',
      'Horário Conclusão (finalizedAt)',
      'Duração (Minutos)',
      'Classificação de Desempenho',
      'Participantes'
    ];

    const linhas = ddsFiltrados.map(item => {
      const statusTexto = item.isFinalizado ? 'FINALIZADO' : 'ABERTO';
      const horarioTermino = formatarHorarioExibicao(item.horarioFinalizacao);
      const duracaoStr = item.duracaoMinutos !== null ? String(item.duracaoMinutos) : 'N/D';
      const classificacaoTexto = CLASSIFICACOES[item.classificacao]?.label || 'Indisponível';
      const participantesQtd = item.participantesQtd || item.participantes?.length || 0;
      const modalidadeTexto = item.isGeral ? 'DDPS Geral (Engenharia)' : 'Convencional';

      return [
        `"${item.idDDS || ''}"`,
        `"${formatarDataApenas(item.data)}"`,
        `"${item.diaSemana || ''}"`,
        `"${modalidadeTexto}"`,
        `"${(item.responsavel || '').replace(/"/g, '""')}"`,
        `"${(item.tema || '').replace(/"/g, '""')}"`,
        `"${(item.local || '').replace(/"/g, '""')}"`,
        `"${statusTexto}"`,
        `"${CONFIG_DDS_METAS.HORARIO_OFICIAL_INICIO}"`,
        `"${horarioTermino}"`,
        `"${duracaoStr}"`,
        `"${classificacaoTexto}"`,
        `"${participantesQtd}"`
      ].join(',');
    });

    const conteudoCSV = '\uFEFF' + [cabecalhos.join(','), ...linhas].join('\r\n');
    const blob = new Blob([conteudoCSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_gerencial_ddps_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportarRelatorioPDF = () => {
    if (ddsFiltrados.length === 0) return;
    gerarRelatorioGerencialPDF(ddsFiltrados, metricas, filtroPeriodo, filtroResponsavel);
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-16 animate-fadeIn">

      {/* =========================================================
          CABEÇALHO DO DASHBOARD
      ========================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-800 pb-5">
        <div className="flex items-start sm:items-center gap-3">
          <Button
            variant="outline"
            onClick={onBack}
            className="p-2 sm:p-2.5 rounded-xl border-gray-700 hover:bg-gray-800 text-gray-300 shrink-0"
            title="Voltar ao início"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white flex items-center gap-2">
                <BarChart3 className="w-7 h-7 text-yellow-400 stroke-[2.5]" />
                Dashboard Gerencial
              </h2>
              <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Acesso Exclusivo ADMIN
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-2xl leading-relaxed">
              Monitoramento oficial do tempo de duração (finalizedAt - 07:00), cumprimento da meta de 20 minutos e segregação do DDPS Geral.
            </p>
          </div>
        </div>

        {/* AÇÕES DE EXPORTAÇÃO */}
        <div className="flex flex-wrap items-center gap-3 self-start lg:self-auto shrink-0">
          <button
            type="button"
            onClick={exportarRelatorioPDF}
            disabled={ddsFiltrados.length === 0}
            className="py-2.5 px-4 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            title="Exportar relatório gerencial em PDF corporativo"
          >
            <FileText className="w-4 h-4 text-slate-950" />
            <span>Exportar PDF</span>
          </button>

          <button
            type="button"
            onClick={exportarRelatorioCSV}
            disabled={ddsFiltrados.length === 0}
            className="py-2.5 px-4 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 hover:text-white border border-gray-700 text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            title="Exportar dados filtrados para CSV"
          >
            <Download className="w-4 h-4 text-yellow-400" />
            <span>Exportar CSV</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="py-2.5 px-3.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700 text-xs font-bold transition-colors flex items-center gap-1.5"
            title="Imprimir visualização"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Imprimir</span>
          </button>
        </div>
      </div>

      {/* =========================================================
          BARRA DE PARÂMETROS E REGRAS OFICIAIS (07:00 & REGRA BINÁRIA)
      ========================================================= */}
      <div className="bg-gradient-to-r from-gray-900 via-[#1F2226] to-gray-900 border border-yellow-400/30 rounded-2xl p-4 sm:p-5 text-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-yellow-400/20 border border-yellow-400/40 text-yellow-400 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-yellow-400 flex items-center gap-1.5">
              <span>Regra Oficial de Horário</span>
              <span className="text-[10px] text-gray-400 font-normal">• Início: 07:00 ({CONFIG_DDS_METAS.FUSO_HORARIO})</span>
            </div>
            <p className="text-xs text-gray-300 mt-0.5 font-medium">
              Conclusão Oficial: <span className="text-white font-bold">Assinatura Final do Responsável (finalizedAt)</span> • Duração = finalizedAt - 07:00
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span className="font-bold">Dentro da Meta:</span>
            <span>até 20 min (término até 07:20)</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
            <AlertOctagon className="w-3.5 h-3.5 shrink-0" />
            <span className="font-bold">Duração Excessiva:</span>
            <span>acima de 20 min (término após 07:20)</span>
          </div>
        </div>
      </div>

      {/* =========================================================
          BANNER DE REGRA ESPECIAL: DDPS GERAL DA ENGENHARIA
      ========================================================= */}
      <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-2xl p-4 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="font-extrabold uppercase tracking-wider text-indigo-300">
              Regra Especial Ativa — DDPS Geral da Engenharia
            </span>
            <p className="text-gray-300 text-[11px] mt-0.5">
              Identificação automática pelo prefixo <span className="font-mono text-indigo-200 font-bold">"DDPS Geral"</span> no título. Possui medições e duração média próprias, não afetando a meta dos diálogos convencionais.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <span className="px-2.5 py-1 rounded-md bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 font-bold text-[11px]">
            {metricas.finalizadosGerais} Geral(is) no período
          </span>
        </div>
      </div>

      {/* =========================================================
          PAINEL DE FILTROS AVANÇADOS
      ========================================================= */}
      <div className="bg-white border border-gray-200 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-800">
            <Filter className="w-4 h-4 text-yellow-600" />
            <span>Filtros do Dashboard</span>
          </div>
          <span className="text-xs font-semibold text-gray-500">
            Exibindo <span className="text-gray-900 font-bold">{ddsFiltrados.length}</span> de {allDDS.length} DDPS
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-xs">
          {/* 1. PERÍODO */}
          <div>
            <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Período de Análise
            </label>
            <select
              value={filtroPeriodo}
              onChange={(e) => setFiltroPeriodo(e.target.value as FiltroPeriodo)}
              className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2.5 text-gray-900 font-semibold focus:outline-none focus:border-yellow-500 transition-colors"
            >
              <option value="todos">Todos os Registros</option>
              <option value="hoje">Hoje</option>
              <option value="semana_atual">Semana Atual ({status?.semana ? `Semana ${status.semana}` : 'Ativa'})</option>
              <option value="ultimos_7">Últimos 7 dias</option>
              <option value="ultimos_30">Últimos 30 dias</option>
              <option value="mes_atual">Mês Atual</option>
              <option value="custom">Período Personalizado...</option>
            </select>
          </div>

          {/* 2. TIPO DE DDPS (CONVENCIONAL / GERAL) */}
          <div>
            <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Modalidade
            </label>
            <select
              value={filtroTipoDDPS}
              onChange={(e) => setFiltroTipoDDPS(e.target.value as FiltroTipo)}
              className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2.5 text-gray-900 font-semibold focus:outline-none focus:border-yellow-500 transition-colors"
            >
              <option value="todos">Todos (Convencional + Geral)</option>
              <option value="convencional">Apenas Convencional</option>
              <option value="geral">Apenas DDPS Geral</option>
            </select>
          </div>

          {/* 3. RESPONSÁVEL / TST */}
          <div>
            <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Responsável / TST
            </label>
            <select
              value={filtroResponsavel}
              onChange={(e) => setFiltroResponsavel(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2.5 text-gray-900 font-semibold focus:outline-none focus:border-yellow-500 transition-colors"
            >
              <option value="todos">Todos os Responsáveis</option>
              {responsaveisDisponiveis.map(resp => (
                <option key={resp} value={resp}>{resp}</option>
              ))}
            </select>
          </div>

          {/* 4. CLASSIFICAÇÃO DE DURAÇÃO (REGRA BINÁRIA) */}
          <div>
            <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Desempenho / Duração
            </label>
            <select
              value={filtroClassificacao}
              onChange={(e) => setFiltroClassificacao(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2.5 text-gray-900 font-semibold focus:outline-none focus:border-yellow-500 transition-colors"
            >
              <option value="todos">Todas as Classificações</option>
              <option value="DENTRO_DA_META">✓ Dentro da Meta (≤ 20 min)</option>
              <option value="EXCESSIVA">🚨 Duração Excessiva (&gt; 20 min)</option>
              <option value="GERAL">⭐ DDPS Geral (Engenharia)</option>
              <option value="INDISPONIVEL">Horário Indisponível (N/D)</option>
            </select>
          </div>

          {/* 5. BUSCA DE TEMA */}
          <div>
            <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Buscar Tema / Palavra
            </label>
            <div className="relative">
              <input
                type="text"
                value={buscaTema}
                onChange={(e) => setBuscaTema(e.target.value)}
                placeholder="Ex: DDPS Geral, EPI, NR-10..."
                className="w-full bg-gray-50 border border-gray-300 rounded-xl pl-8 pr-3 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-yellow-500 transition-colors"
              />
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3.5" />
            </div>
          </div>
        </div>

        {/* CAMPO DE DATA PERSONALIZADA SE SELECIONADO */}
        {filtroPeriodo === 'custom' && (
          <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-600">De:</span>
              <input
                type="date"
                value={dataInicioCustom}
                onChange={(e) => setDataInicioCustom(e.target.value)}
                className="bg-gray-50 border border-gray-300 rounded-lg px-2.5 py-1.5 text-gray-900 font-medium"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-600">Até:</span>
              <input
                type="date"
                value={dataFimCustom}
                onChange={(e) => setDataFimCustom(e.target.value)}
                className="bg-gray-50 border border-gray-300 rounded-lg px-2.5 py-1.5 text-gray-900 font-medium"
              />
            </div>
          </div>
        )}
      </div>

      {/* =========================================================
          SEÇÃO 1: 8 CARDS DE INDICADORES PRINCIPAIS (REGRA BINÁRIA)
      ========================================================= */}
      <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* CARD 1: TOTAL DE DDPS REALIZADOS (TODOS) */}
        <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Total Realizados</span>
            <Building className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-3xl font-black text-gray-900">
            {metricas.totalDDPS}
          </div>
          <div className="text-[11px] text-gray-500 mt-2 font-medium">
            {metricas.finalizadosConvencionais} Convencionais • {metricas.finalizadosGerais} Gerais
          </div>
        </div>

        {/* CARD 2: DURAÇÃO MÉDIA (CONVENCIONAL) */}
        <div className={`border rounded-3xl p-5 shadow-xs flex flex-col justify-between ${
          metricas.duracaoMediaConvencional !== null && metricas.duracaoMediaConvencional <= CONFIG_DDS_METAS.META_MAX_MINUTOS
            ? 'bg-emerald-50/40 border-emerald-200'
            : metricas.duracaoMediaConvencional !== null
            ? 'bg-red-50/40 border-red-200'
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between text-gray-600 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Duração Média (Convencional)</span>
            <Clock className="w-4 h-4 text-yellow-600" />
          </div>
          <div className="text-3xl font-black text-gray-900 flex items-baseline gap-1.5">
            {formatarDuracaoTexto(metricas.duracaoMediaConvencional)}
            {metricas.duracaoMediaConvencional !== null && (
              <span className={`text-xs font-extrabold ${
                metricas.duracaoMediaConvencional <= CONFIG_DDS_METAS.META_MAX_MINUTOS
                  ? 'text-emerald-700'
                  : 'text-red-700'
              }`}>
                {metricas.duracaoMediaConvencional <= CONFIG_DDS_METAS.META_MAX_MINUTOS ? '✓ na meta' : 'acima da meta'}
              </span>
            )}
          </div>
          <div className="text-[11px] text-gray-500 mt-2 font-medium">
            Meta: até 20 min • Exclui DDPS Geral
          </div>
        </div>

        {/* CARD 3: HORÁRIO MÉDIO DE TÉRMINO (CONVENCIONAL) */}
        <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Término Médio (Convencional)</span>
            <Target className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-3xl font-black text-gray-900 font-mono">
            {metricas.horarioMedioTerminoConvencional}
          </div>
          <div className="text-[11px] text-gray-500 mt-2 font-medium">
            Horário desejado: até 07:20
          </div>
        </div>

        {/* CARD 4: ADERÊNCIA À META (%) */}
        <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Aderência à Meta</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-emerald-600">
            {metricas.percMetaConvencional}%
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2 mt-2 overflow-hidden">
            <div 
              className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, metricas.percMetaConvencional)}%` }}
            />
          </div>
          <div className="text-[10px] text-gray-400 mt-1">
            {metricas.countMetaConvencional} de {metricas.comDuracaoConvencional} convencionais medidos
          </div>
        </div>

        {/* CARD 5: DENTRO DA META (<= 20 min) */}
        <div className="bg-emerald-50/50 border border-emerald-200 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-800 text-xs font-bold uppercase tracking-wider mb-1">
            <span>Dentro da Meta</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-emerald-700">
            {metricas.countMetaConvencional}
          </div>
          <div className="text-[11px] text-emerald-800/80 mt-2 font-semibold">
            {metricas.percMetaConvencional}% dos convencionais (≤ 20 min)
          </div>
        </div>

        {/* CARD 6: DURAÇÃO EXCESSIVA (> 20 min CONVENCIONAL) */}
        <div className="bg-red-50/50 border border-red-200 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-red-800 text-xs font-bold uppercase tracking-wider mb-1">
            <span>Duração Excessiva</span>
            <AlertOctagon className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-3xl font-black text-red-700">
            {metricas.countExcessivaConvencional}
          </div>
          <div className="text-[11px] text-red-800/80 mt-2 font-semibold">
            {metricas.percExcessivaConvencional}% dos convencionais (&gt; 20 min)
          </div>
        </div>

        {/* CARD 7: TOTAL DE PARTICIPANTES (TODOS) */}
        <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Total Participantes</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-3xl font-black text-gray-900">
            {metricas.totalParticipantes}
          </div>
          <div className="text-[11px] text-gray-500 mt-2 font-medium">
            Convencionais e Sessões Gerais
          </div>
        </div>

        {/* CARD 8: MÉDIA DE PARTICIPANTES POR DIÁLOGO */}
        <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Média por Diálogo</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-3xl font-black text-gray-900">
            {metricas.mediaParticipantes}
          </div>
          <div className="text-[11px] text-gray-500 mt-2 font-medium">
            Participantes médios por turma
          </div>
        </div>

      </div>

      {/* =========================================================
          SEÇÃO ESPECIAL DEDICADA: DDPS GERAL DA ENGENHARIA
      ========================================================= */}
      <div className="bg-gradient-to-r from-indigo-950/70 via-slate-900 to-indigo-950/70 border border-indigo-500/30 rounded-3xl p-5 sm:p-6 shadow-md flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-500/20 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">
                  DDPS Geral da Engenharia — Painel Exclusivo
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 uppercase tracking-wider">
                  Regra Especial
                </span>
              </div>
              <p className="text-xs text-indigo-200/70 mt-0.5">
                Reuniões gerais com duração estendida identificadas pelo prefixo "DDPS Geral". Indicadores e duração média independentes dos diálogos convencionais.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setFiltroTipoDDPS(filtroTipoDDPS === 'geral' ? 'todos' : 'geral')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                filtroTipoDDPS === 'geral'
                  ? 'bg-indigo-500 text-white'
                  : 'bg-indigo-950/80 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-500/30'
              }`}
            >
              {filtroTipoDDPS === 'geral' ? 'Visualizando Apenas Gerais ✓' : 'Filtrar Apenas DDPS Geral'}
            </button>
          </div>
        </div>

        {/* MICRO-KPIS DDPS GERAL */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/80 border border-indigo-500/20 rounded-2xl p-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300/80 block mb-1">
              Total Realizados
            </span>
            <div className="text-2xl sm:text-3xl font-black text-white">
              {metricas.finalizadosGerais}
            </div>
            <span className="text-[10px] text-gray-400 mt-1 block">
              de {metricas.totalGerais} agendado(s)
            </span>
          </div>

          <div className="bg-slate-900/80 border border-indigo-500/20 rounded-2xl p-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300/80 block mb-1">
              Duração Média Geral
            </span>
            <div className="text-2xl sm:text-3xl font-black text-indigo-300">
              {formatarDuracaoTexto(metricas.duracaoMediaGeral)}
            </div>
            <span className="text-[10px] text-gray-400 mt-1 block">
              Média própria da Engenharia
            </span>
          </div>

          <div className="bg-slate-900/80 border border-indigo-500/20 rounded-2xl p-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300/80 block mb-1">
              Término Médio Geral
            </span>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono">
              {metricas.horarioMedioTerminoGeral}
            </div>
            <span className="text-[10px] text-gray-400 mt-1 block">
              Início oficial às 07:00
            </span>
          </div>

          <div className="bg-slate-900/80 border border-indigo-500/20 rounded-2xl p-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300/80 block mb-1">
              Participantes Alcançados
            </span>
            <div className="text-2xl sm:text-3xl font-black text-white">
              {metricas.totalParticipantesGerais}
            </div>
            <span className="text-[10px] text-gray-400 mt-1 block">
              Nas sessões gerais
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================
          SEÇÃO 2: GRÁFICOS E ANÁLISES VISUAIS RESPONSIVAS
      ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* GRÁFICO B: DISTRIBUIÇÃO DOS HORÁRIOS DE TÉRMINO (CONVENCIONAIS) */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between gap-5">
          <div>
            <div className="flex items-center justify-between gap-2 mb-1">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-600" />
                Faixas de Término (DDPS Convencional)
              </h3>
              <span className="text-xs font-bold text-gray-500">{metricas.comDuracaoConvencional} medidos</span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Distribuição por faixas horárias de conclusão oficial (finalizedAt - 07:00). Exclui DDPS Geral.
            </p>
          </div>

          <div className="space-y-4">
            {/* Faixa 1: Dentro da Meta */}
            <div>
              <div className="flex justify-between items-center text-xs font-bold mb-1">
                <span className="text-emerald-700 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                  Até 07:20 (Dentro da Meta • ≤ 20 min)
                </span>
                <span className="text-gray-900 font-mono">
                  {metricas.faixasHorarioConvencionais.ate0720} ({metricas.comDuracaoConvencional > 0 ? Math.round((metricas.faixasHorarioConvencionais.ate0720 / metricas.comDuracaoConvencional) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-emerald-500 h-3 rounded-full transition-all duration-500" 
                  style={{ width: `${metricas.comDuracaoConvencional > 0 ? (metricas.faixasHorarioConvencionais.ate0720 / metricas.comDuracaoConvencional) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Faixa 2: Duração Excessiva Leve (21 a 40 min) */}
            <div>
              <div className="flex justify-between items-center text-xs font-bold mb-1">
                <span className="text-red-600 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
                  De 07:21 a 07:40 (Duração Excessiva • 21 a 40 min)
                </span>
                <span className="text-gray-900 font-mono">
                  {metricas.faixasHorarioConvencionais.de0721a0740} ({metricas.comDuracaoConvencional > 0 ? Math.round((metricas.faixasHorarioConvencionais.de0721a0740 / metricas.comDuracaoConvencional) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-red-500 h-3 rounded-full transition-all duration-500" 
                  style={{ width: `${metricas.comDuracaoConvencional > 0 ? (metricas.faixasHorarioConvencionais.de0721a0740 / metricas.comDuracaoConvencional) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Faixa 3: Crítico (Após 07:40) */}
            <div>
              <div className="flex justify-between items-center text-xs font-bold mb-1">
                <span className="text-red-800 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-800 inline-block" />
                  Após 07:40 (Crítico • &gt; 40 min)
                </span>
                <span className="text-gray-900 font-mono">
                  {metricas.faixasHorarioConvencionais.apos0740} ({metricas.comDuracaoConvencional > 0 ? Math.round((metricas.faixasHorarioConvencionais.apos0740 / metricas.comDuracaoConvencional) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-red-800 h-3 rounded-full transition-all duration-500" 
                  style={{ width: `${metricas.comDuracaoConvencional > 0 ? (metricas.faixasHorarioConvencionais.apos0740 / metricas.comDuracaoConvencional) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          {metricas.semHorario > 0 && (
            <div className="text-[11px] text-gray-500 bg-gray-50 p-2.5 rounded-xl border border-gray-200">
              ℹ Nota: {metricas.semHorario} registro(s) histórico(s) finalizado(s) não possuem horário de término registrado e são identificados como dado indisponível.
            </div>
          )}
        </div>

        {/* GRÁFICO C: RANKING DOS TEMAS MAIS ABORDADOS */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center justify-between gap-2 mb-1">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-yellow-600" />
                Temas Mais Abordados
              </h3>
              <span className="text-xs font-bold text-gray-500">{metricas.totalTemasDistintos} temas distintos</span>
            </div>
            <p className="text-xs text-gray-500">
              Assuntos de segurança com maior incidência (engloba Convencionais e Gerais).
            </p>
          </div>

          <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
            {metricas.temasOrdenados.slice(0, 6).map((item, idx) => (
              <div key={item.tema} className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-gray-800 truncate max-w-[280px] flex items-center gap-1.5" title={item.tema}>
                    <span>{idx + 1}. {item.tema}</span>
                    {item.isGeral && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-100 text-indigo-700 uppercase">
                        Geral
                      </span>
                    )}
                  </span>
                  <span className="text-gray-600 font-semibold shrink-0">
                    {item.qtd} DDPS ({item.percentual}%)
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-2 rounded-full ${item.isGeral ? 'bg-indigo-500' : 'bg-yellow-500'}`}
                    style={{ width: `${item.percentual}%` }}
                  />
                </div>
              </div>
            ))}

            {metricas.temasOrdenados.length === 0 && (
              <div className="py-8 text-center text-gray-400 text-xs">
                Nenhum tema registrado no período.
              </div>
            )}
          </div>
        </div>

        {/* GRÁFICO D: DESEMPENHO POR RESPONSÁVEL / TST */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs flex flex-col gap-4 lg:col-span-2">
          <div>
            <div className="flex items-center justify-between gap-2 mb-1">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-yellow-600" />
                Desempenho por Responsável / TST
              </h3>
              <span className="text-xs font-bold text-gray-500">{metricas.responsaveisOrdenados.length} responsável(is)</span>
            </div>
            <p className="text-xs text-gray-500">
              Volume de diálogos, média dos convencionais, cumprimento da meta de 20 minutos e acompanhamento segregado do DDPS Geral.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 font-bold uppercase tracking-wider border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4">Responsável / TST</th>
                  <th className="py-3 px-3 text-center">Total DDPS</th>
                  <th className="py-3 px-3 text-center">Conv. / Geral</th>
                  <th className="py-3 px-3 text-center">Média Convencional</th>
                  <th className="py-3 px-3 text-center">Na Meta (&le; 20 min)</th>
                  <th className="py-3 px-3 text-center">% Meta Conv.</th>
                  <th className="py-3 px-3 text-center">Média DDPS Geral</th>
                  <th className="py-3 px-4 text-center">Partic. Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {metricas.responsaveisOrdenados.map(item => (
                  <tr key={item.responsavel} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-gray-900">
                      {item.responsavel}
                    </td>
                    <td className="py-3 px-3 text-center font-semibold text-gray-700">
                      {item.total}
                    </td>
                    <td className="py-3 px-3 text-center text-gray-500 font-medium">
                      <span className="font-bold text-gray-800">{item.convencionaisQtd}</span> conv. / <span className="font-bold text-indigo-600">{item.geraisQtd}</span> ger.
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-gray-900">
                      {formatarDuracaoTexto(item.duracaoMediaConv)}
                    </td>
                    <td className="py-3 px-3 text-center font-semibold text-emerald-700">
                      {item.dentroMetaConv}
                    </td>
                    <td className="py-3 px-3 text-center font-bold">
                      <span className={item.percMetaConv >= 80 ? 'text-emerald-600' : 'text-red-600'}>
                        {item.percMetaConv}%
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-indigo-600">
                      {formatarDuracaoTexto(item.duracaoMediaGeral)}
                    </td>
                    <td className="py-3 px-4 text-center font-semibold text-gray-800">
                      {item.participantesTotal}
                    </td>
                  </tr>
                ))}

                {metricas.responsaveisOrdenados.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-gray-400">
                      Nenhum registro para exibir.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* =========================================================
          SEÇÃO 3: HISTÓRICO DETALHADO (TABELA COMPLETA COM FILTROS)
      ========================================================= */}
      <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-yellow-600" />
              Histórico Detalhado dos Diálogos
            </h3>
            <p className="text-xs text-gray-500">
              Registros individuais contendo horário de início (07:00), conclusão oficial da assinatura (finalizedAt) e duração gerencial.
            </p>
          </div>

          <span className="text-xs font-semibold text-gray-500">
            {ddsFiltrados.length} registro(s) listado(s)
          </span>
        </div>

        {ddsFiltrados.length === 0 ? (
          <div className="py-12 text-center text-gray-400 flex flex-col items-center gap-2">
            <HelpCircle className="w-10 h-10 text-gray-300" />
            <p className="text-sm font-semibold text-gray-600">Nenhum DDPS encontrado com os filtros atuais.</p>
            <p className="text-xs text-gray-400">Tente alterar o período, o responsável ou os filtros de busca.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 font-bold uppercase tracking-wider border-b border-gray-200">
                <tr>
                  <th className="py-3 px-3.5">Data / Dia</th>
                  <th className="py-3 px-3">Modalidade</th>
                  <th className="py-3 px-3.5">Responsável</th>
                  <th className="py-3 px-3.5">Tema</th>
                  <th className="py-3 px-3 text-center">Início Oficial</th>
                  <th className="py-3 px-3 text-center">Conclusão (finalizedAt)</th>
                  <th className="py-3 px-3 text-center">Duração</th>
                  <th className="py-3 px-3 text-center">Partic.</th>
                  <th className="py-3 px-3.5">Desempenho</th>
                  <th className="py-3 px-3.5 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ddsFiltrados.map((item) => {
                  const infoClass = CLASSIFICACOES[item.classificacao] || CLASSIFICACOES.INDISPONIVEL;
                  const duracaoTexto = formatarDuracaoTexto(item.duracaoMinutos);
                  const terminoTexto = formatarHorarioExibicao(item.horarioFinalizacao);
                  const dataFormatada = formatarDataApenas(item.data);
                  const participantesQtd = item.participantesQtd || item.participantes?.length || 0;

                  return (
                    <tr key={item.idDDS || item.data} className="hover:bg-gray-50/80 transition-colors">
                      {/* DATA & DIA */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <div className="font-bold text-gray-900">{dataFormatada}</div>
                        <div className="text-[10px] text-gray-400 font-semibold uppercase">{item.diaSemana || 'DDS'}</div>
                      </td>

                      {/* MODALIDADE */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {item.isGeral ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-700 border border-indigo-200">
                            <Sparkles className="w-3 h-3 text-indigo-600" />
                            DDPS Geral
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            Convencional
                          </span>
                        )}
                      </td>

                      {/* RESPONSÁVEL */}
                      <td className="py-3 px-3.5 font-semibold text-gray-800 max-w-[140px] truncate" title={item.responsavel}>
                        {item.responsavel || 'Não informado'}
                      </td>

                      {/* TEMA */}
                      <td className="py-3 px-3.5 max-w-[220px]">
                        <div className="font-bold text-gray-900 truncate" title={item.tema}>
                          {item.tema || 'Sem tema'}
                        </div>
                        <div className="text-[10px] text-gray-400 truncate" title={item.local}>
                          {item.local || 'Local N/I'}
                        </div>
                      </td>

                      {/* INÍCIO OFICIAL */}
                      <td className="py-3 px-3 text-center font-mono font-bold text-gray-600">
                        {CONFIG_DDS_METAS.HORARIO_OFICIAL_INICIO}
                      </td>

                      {/* CONCLUSÃO REAL (finalizedAt) */}
                      <td className="py-3 px-3 text-center font-mono font-bold text-gray-900">
                        {item.isFinalizado ? terminoTexto : (
                          <span className="text-amber-600 font-semibold text-[10px]">Em aberto</span>
                        )}
                      </td>

                      {/* DURAÇÃO INDIVIDUAL */}
                      <td className="py-3 px-3 text-center font-mono font-extrabold">
                        {item.isFinalizado ? (
                          <span className={
                            item.isGeral
                              ? 'text-indigo-600'
                              : item.duracaoMinutos !== null && item.duracaoMinutos > 20 
                              ? 'text-red-600' 
                              : 'text-gray-900'
                          }>
                            {duracaoTexto}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-[10px]">-</span>
                        )}
                      </td>

                      {/* PARTICIPANTES */}
                      <td className="py-3 px-3 text-center font-semibold text-gray-700">
                        {participantesQtd}
                      </td>

                      {/* BADGE DE CLASSIFICAÇÃO (REGRA BINÁRIA) */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        {item.isFinalizado ? (
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${infoClass.badgeClass}`}>
                            {item.classificacao === 'DENTRO_DA_META' && <CheckCircle2 className="w-3 h-3" />}
                            {item.classificacao === 'EXCESSIVA' && <AlertOctagon className="w-3 h-3" />}
                            {item.classificacao === 'GERAL' && <Sparkles className="w-3 h-3 text-indigo-500" />}
                            <span>{infoClass.label}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                            Em Andamento
                          </span>
                        )}
                      </td>

                      {/* AÇÃO VER DETALHES */}
                      <td className="py-3 px-3.5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onSelectDDS(item)}
                          className="py-1 px-2.5 rounded-lg bg-gray-100 hover:bg-yellow-400 hover:text-black text-gray-700 font-bold text-[11px] transition-colors inline-flex items-center gap-1"
                          title="Visualizar ata completa"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver</span>
                        </button>
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
  );
};
