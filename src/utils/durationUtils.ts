/**
 * ============================================================================
 * DDPS - REGRAS E CÁLCULOS OFICIAIS DE DURAÇÃO E METAS DE DESEMPENHO
 * ============================================================================
 * 
 * REGRA OFICIAL DE HORÁRIO:
 * - Horário oficial de início fixado em: 07:00 (America/Sao_Paulo).
 * - Fórmula oficial: DURAÇÃO = HORÁRIO REAL DE FINALIZAÇÃO - 07:00.
 * 
 * METAS DE DESEMPENHO:
 * - Meta: até 20 minutos (Horário desejado de término: 07:20) -> "Dentro da Meta"
 * - Faixa de Atenção: de 21 a 30 minutos (Horário: 07:21 até 07:30) -> "Atenção"
 * - Duração Excessiva: acima de 30 minutos (Horário: após 07:30) -> "Duração Excessiva"
 */

import { DDS } from '../types';
import { parseISOInSaoPaulo } from './dateFormatter';

export const CONFIG_DDS_METAS = {
  HORARIO_OFICIAL_INICIO: '07:00',
  HORARIO_INICIO_MINUTOS: 7 * 60, // 420 minutos a partir da meia-noite
  META_MAX_MINUTOS: 20, // Meta máxima: até 20 minutos
  HORARIO_DESEJADO_TERMINO: '07:20',
  FUSO_HORARIO: 'America/Sao_Paulo'
} as const;

export type TipoDDPS = 'CONVENCIONAL' | 'GERAL';

export type ClassificacaoDesempenho = 
  | 'DENTRO_DA_META' 
  | 'EXCESSIVA' 
  | 'GERAL' 
  | 'INDISPONIVEL';

export interface InfoClassificacao {
  tipo: ClassificacaoDesempenho;
  label: string;
  descricao: string;
  badgeClass: string;
  corHex: string;
  corTexto: string;
}

export const CLASSIFICACOES: Record<ClassificacaoDesempenho, InfoClassificacao> = {
  DENTRO_DA_META: {
    tipo: 'DENTRO_DA_META',
    label: 'Dentro da Meta',
    descricao: 'Até 20 minutos (término até 07:20)',
    badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    corHex: '#10B981',
    corTexto: 'text-emerald-400'
  },
  EXCESSIVA: {
    tipo: 'EXCESSIVA',
    label: 'Duração Excessiva',
    descricao: 'Acima de 20 minutos (término após 07:20)',
    badgeClass: 'bg-red-500/15 text-red-400 border-red-500/30',
    corHex: '#EF4444',
    corTexto: 'text-red-400'
  },
  GERAL: {
    tipo: 'GERAL',
    label: 'DDPS Geral',
    descricao: 'DDPS Geral da Engenharia (Regra Especial)',
    badgeClass: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
    corHex: '#6366F1',
    corTexto: 'text-indigo-400'
  },
  INDISPONIVEL: {
    tipo: 'INDISPONIVEL',
    label: 'Indisponível',
    descricao: 'Horário de término não registrado',
    badgeClass: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
    corHex: '#9CA3AF',
    corTexto: 'text-gray-400'
  }
};

/**
 * ============================================================================
 * REGRA ESPECIAL — DDPS GERAL DA ENGENHARIA
 * ============================================================================
 * A identificação dos DDPS gerais é feita automaticamente pelo prefixo "DDPS Geral"
 * no campo de título/tema.
 * 
 * Critérios:
 * - Comparação case-insensitive.
 * - Remover espaços excedentes no início do título antes da comparação.
 * - Reconhecer somente quando o título começar com "DDPS Geral".
 * - Não classificar como geral quando a expressão aparecer no meio do título.
 * 
 * Exemplos:
 * - "DDPS Geral + Segurança em Máquinas": GERAL
 * - "DDPS GERAL + Meio Ambiente": GERAL
 * - "DDPS Geral + Segurança Elétrica": GERAL
 * - "Segurança em Máquinas": CONVENCIONAL
 * - "Segurança Geral": CONVENCIONAL
 */
export function isDDPSGeral(ddsOuTema?: string | { tema?: string } | null): boolean {
  if (!ddsOuTema) return false;
  const texto = typeof ddsOuTema === 'string' ? ddsOuTema : ddsOuTema.tema;
  if (!texto || typeof texto !== 'string') return false;
  const limpo = texto.trimStart().toLowerCase();
  return limpo.startsWith('ddps geral');
}

/**
 * Retorna o tipo do DDPS ('GERAL' ou 'CONVENCIONAL')
 */
export function identificarTipoDDPS(ddsOuTema?: string | { tema?: string } | null): TipoDDPS {
  return isDDPSGeral(ddsOuTema) ? 'GERAL' : 'CONVENCIONAL';
}

/**
 * Retorna o horário atual no fuso oficial America/Sao_Paulo no formato HH:mm:ss
 */
export function getHoraAtualSaoPaulo(): string {
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      timeZone: CONFIG_DDS_METAS.FUSO_HORARIO,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(new Date());
  } catch {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
  }
}

/**
 * Converte qualquer representação de horário ou ISO em minutos a partir de 00:00 (no fuso de São Paulo)
 */
export function extrairMinutosDoDia(horarioValor?: string): number | null {
  if (!horarioValor || typeof horarioValor !== 'string') return null;

  const trimmed = horarioValor.trim();
  if (!trimmed) return null;

  // 1. Se for string ISO (ex: "2026-10-30T10:25:00.000Z")
  if (trimmed.includes('T')) {
    const parsed = parseISOInSaoPaulo(trimmed);
    if (parsed && parsed.hora) {
      const [h, m] = parsed.hora.split(':').map(Number);
      if (!isNaN(h) && !isNaN(m)) {
        return h * 60 + m;
      }
    }
  }

  // 2. Se for formato "HH:mm" ou "HH:mm:ss"
  const match = trimmed.match(/^(\d{1,2}):(\d{2})/);
  if (match) {
    const h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    if (!isNaN(h) && !isNaN(m) && h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      return h * 60 + m;
    }
  }

  return null;
}

/**
 * Extrai apenas o horário formatado "HH:mm" para exibição
 */
export function formatarHorarioExibicao(horarioValor?: string): string {
  if (!horarioValor) return 'N/D';
  const trimmed = horarioValor.trim();
  if (!trimmed) return 'N/D';

  if (trimmed.includes('T')) {
    const parsed = parseISOInSaoPaulo(trimmed);
    if (parsed && parsed.hora) return parsed.hora;
  }

  const match = trimmed.match(/^(\d{1,2}):(\d{2})/);
  if (match) {
    return `${match[1].padStart(2, '0')}:${match[2]}`;
  }

  return trimmed;
}

/**
 * Calcula a duração em minutos entre o início oficial (07:00) e o horário real de término
 * Fórmula: DURAÇÃO = HORÁRIO REAL DE FINALIZAÇÃO - 07:00
 * Retorna null se não houver horário de término válido ou se o DDS ainda estiver aberto.
 */
export function calcularDuracaoMinutos(horarioFinalizacao?: string): number | null {
  const minutosTermino = extrairMinutosDoDia(horarioFinalizacao);
  if (minutosTermino === null) return null;

  // Início oficial: 07:00 (420 minutos a partir da meia-noite)
  const inicioMinutos = CONFIG_DDS_METAS.HORARIO_INICIO_MINUTOS;

  // Duração = Horário Real - 07:00
  const duracao = minutosTermino - inicioMinutos;

  // Se finalizado antes das 07:00 (ex: 06:58), consideramos no mínimo 0 minutos
  return Math.max(0, duracao);
}

/**
 * Determina a classificação de desempenho com base na duração em minutos e tema
 * - Para DDPS Geral (prefixo "DDPS Geral"): classificação 'GERAL' (não gera alerta de excesso convencional)
 * - Para DDPS Convencional:
 *   - Até 20 min: 'DENTRO_DA_META'
 *   - De 21 a 30 min: 'ATENCAO'
 *   - Acima de 30 min: 'EXCESSIVA'
 */
export function classificarDesempenho(
  duracaoMinutos: number | null,
  temaOuTitulo?: string | { tema?: string } | null
): ClassificacaoDesempenho {
  if (duracaoMinutos === null || duracaoMinutos === undefined || isNaN(duracaoMinutos)) {
    return 'INDISPONIVEL';
  }

  // Regra Especial: DDPS Geral da Engenharia
  if (isDDPSGeral(temaOuTitulo)) {
    return 'GERAL';
  }

  // Regra Binária Oficial:
  // - Até 20 minutos: DENTRO_DA_META (término até 07:20)
  // - Acima de 20 minutos: EXCESSIVA (término após 07:20)
  // - Sem faixa de atenção intermediária
  if (duracaoMinutos <= CONFIG_DDS_METAS.META_MAX_MINUTOS) {
    return 'DENTRO_DA_META'; // Até 20 min
  }

  return 'EXCESSIVA'; // Acima de 20 min
}

/**
 * Formata minutos em string amigável (ex: "18 min", "1h 15min", "N/D")
 */
export function formatarDuracaoTexto(minutos: number | null): string {
  if (minutos === null || minutos === undefined || isNaN(minutos)) {
    return 'N/D';
  }

  if (minutos < 60) {
    return `${minutos} min`;
  }

  const horas = Math.floor(minutos / 60);
  const restoMinutos = minutos % 60;
  if (restoMinutos === 0) {
    return `${horas}h`;
  }
  return `${horas}h ${restoMinutos}min`;
}

/**
 * Converte minutos do dia (ex: 438) de volta para string "HH:mm"
 */
export function minutosParaHorarioString(minutosDoDia: number): string {
  const h = Math.floor(minutosDoDia / 60) % 24;
  const m = Math.round(minutosDoDia % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Retorna o horário de finalização efetivo de um DDS.
 * Prioridade:
 * 1. dds.finalizedAt (Horário oficial da assinatura final do responsável)
 * 2. dds.horarioFinalizacao (Horário capturado na conclusão "HH:mm:ss")
 * 3. dds.dataFinalizacao (Timestamp ISO de conclusão)
 * 4. Se estiver finalizado e nenhum dos campos acima existir: retorna undefined (Indisponível / N/D)
 *    Conforme regra obrigatória: nunca atribuir duração fictícia nem converter horário de criação.
 */
export function obterHorarioFinalizacaoDDS(dds: DDS): string | undefined {
  if (dds.finalizedAt && typeof dds.finalizedAt === 'string' && dds.finalizedAt.trim()) {
    return dds.finalizedAt.trim();
  }

  if (dds.horarioFinalizacao && typeof dds.horarioFinalizacao === 'string' && dds.horarioFinalizacao.trim()) {
    return dds.horarioFinalizacao.trim();
  }

  if (dds.dataFinalizacao && typeof dds.dataFinalizacao === 'string' && dds.dataFinalizacao.trim()) {
    return dds.dataFinalizacao.trim();
  }

  return undefined;
}
