import jsPDF from 'jspdf';
import { DDPSStatus, DDS, Participante } from '../types';
import { api } from '../services/api';
import { formatarDataApenas, formatarHoraApenas } from './dateFormatter';
import { getSundayOfWeek, getSemanaId, getSemanaNumero, pertenceASemana } from './weekUtils';

export interface DiaSemanaConfig {
  nome: string;
  diaCurto: string;
  chave: string;
  numero: number; // 0 = Dom, 1 = Seg, 2 = Ter, 3 = Qua, 4 = Qui, 5 = Sex, 6 = Sáb
}

export const DIAS_DA_SEMANA_ORDEM_OFICIAL: DiaSemanaConfig[] = [
  { nome: 'DOMINGO', diaCurto: 'DOMINGO', chave: 'domingo', numero: 0 },
  { nome: 'SEGUNDA-FEIRA', diaCurto: 'SEGUNDA - FEIRA', chave: 'segunda', numero: 1 },
  { nome: 'TERÇA-FEIRA', diaCurto: 'TERÇA - FEIRA', chave: 'terca', numero: 2 },
  { nome: 'QUARTA-FEIRA', diaCurto: 'QUARTA - FEIRA', chave: 'quarta', numero: 3 },
  { nome: 'QUINTA-FEIRA', diaCurto: 'QUINTA - FEIRA', chave: 'quinta', numero: 4 },
  { nome: 'SEXTA-FEIRA', diaCurto: 'SEXTA - FEIRA', chave: 'sexta', numero: 5 },
  { nome: 'SÁBADO', diaCurto: 'SÁBADO', chave: 'sabado', numero: 6 }
];

function parseDataUniversal(val?: string | number): Date | null {
  if (val === undefined || val === null || val === '') return null;
  if (typeof val === 'number') {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }
  const str = String(val).trim();
  // Formato ISO
  if (str.includes('T')) {
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  }
  // Formato AAAA-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    const parts = str.substring(0, 10).split('-');
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 12, 0, 0);
    return isNaN(d.getTime()) ? null : d;
  }
  // Formato DD/MM/AAAA
  if (/^\d{2}\/\d{2}\/\d{4}/.test(str)) {
    const parts = str.substring(0, 10).split('/');
    const d = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]), 12, 0, 0);
    return isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

function formatDDMMAAAA(d: Date): string {
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const ano = d.getFullYear();
  return `${dia}/${mes}/${ano}`;
}

export function obterIntervaloSemana(
  status: DDPSStatus | null,
  ddsSemana: DDS[]
): {
  dataInicioStr: string;
  dataFimStr: string;
  semanaNum?: number | string;
  datasDias: string[];
} {
  let refDate: Date | null = null;

  // 1. Procura em ddsSemana
  for (const d of ddsSemana) {
    if (d.data) {
      const dt = parseDataUniversal(d.data);
      if (dt) {
        refDate = dt;
        break;
      }
    }
  }

  // 2. Procura no status
  if (!refDate && status?.data) {
    const dt = parseDataUniversal(status.data);
    if (dt) refDate = dt;
  }

  if (!refDate && status?.timestamp) {
    const dt = parseDataUniversal(status.timestamp);
    if (dt) refDate = dt;
  }

  // 3. Fallback para data atual
  if (!refDate) {
    refDate = new Date();
  }

  // Calcula o Domingo da semana correspondente (ordem da folha: Dom a Sáb)
  const sunday = getSundayOfWeek(refDate);

  const datasDias: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    datasDias.push(formatDDMMAAAA(d));
  }

  const dataInicioStr = datasDias[0]; // Domingo
  const dataFimStr = datasDias[6]; // Sábado

  return {
    dataInicioStr,
    dataFimStr,
    semanaNum: status?.semana || getSemanaNumero(sunday),
    datasDias
  };
}

function normalizarTexto(val?: string | number): string {
  if (val === undefined || val === null) return '';
  return String(val)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/-feira/g, '')
    .replace(/\s+/g, '');
}

export interface DayDDSData {
  dia: DiaSemanaConfig;
  dds?: DDS;
  participantes: Participante[];
}

export interface CumulativeParticipant {
  idFuncionario?: string;
  nome: string;
  cargo?: string;
  primeiroDiaIndex: number;
  dias: {
    [diaIndex: number]: {
      emociograma?: string; // 'BOM' | 'REGULAR' | 'RUIM'
      assinatura?: string;
      presente: boolean;
      ausente?: boolean;
      motivoAusencia?: string;
    };
  };
}

/**
 * Organiza e acumula os dados dos DDS da semana de Segunda a Domingo (7 dias)
 */
export async function carregarDadosSemanaAcumulados(
  ddsSemana: DDS[]
): Promise<{
  diasMapeados: DayDDSData[];
  participantesAcumulados: CumulativeParticipant[];
}> {
  // 1. Buscar a lista COMPLETA de colaboradores ATIVOS na aba FUNCIONARIOS
  let funcionariosAtivos: any[] = [];
  try {
    const list = await api.getFuncionarios(false);
    if (Array.isArray(list)) {
      funcionariosAtivos = list.filter((f) => f.ativo !== false);
    }
  } catch (err) {
    console.warn('[PDF] Erro ao buscar colaboradores ativos da API:', err);
  }

  // Ordena os funcionários ativos por nome para manter uma ordem completamente estável
  funcionariosAtivos.sort((a, b) =>
    String(a.nome || '').localeCompare(String(b.nome || ''), 'pt-BR')
  );

  // 2. Buscar lista de DDS para garantir preenchimento semanal
  let allDDS = [...ddsSemana];
  try {
    const serverList = await api.listarDDS();
    if (Array.isArray(serverList) && serverList.length > 0) {
      const map = new Map<string, DDS>();
      allDDS.forEach((d) => map.set(d.idDDS, d));
      serverList.forEach((d) => {
        if (!map.has(d.idDDS)) {
          map.set(d.idDDS, d);
        } else {
          const localItem = map.get(d.idDDS);
          map.set(d.idDDS, {
            ...d,
            ...localItem,
            local: (localItem?.local && localItem.local.trim() !== '') ? localItem.local : (d.local || '')
          });
        }
      });
      allDDS = Array.from(map.values());
    }
  } catch (err) {
    console.warn('[PDF] Erro ao sincronizar lista completa de DDS:', err);
  }

  // 3. Mapeia os 7 dias da semana (SEGUNDA a DOMINGO)
  const diasMapeados: DayDDSData[] = [];

  for (let i = 0; i < DIAS_DA_SEMANA_ORDEM_OFICIAL.length; i++) {
    const dia = DIAS_DA_SEMANA_ORDEM_OFICIAL[i];

    const ddsEncontrado = allDDS.find((d) => {
      if (d.diaSemanaNumero !== undefined && d.diaSemanaNumero !== null && !isNaN(Number(d.diaSemanaNumero))) {
        const num = Number(d.diaSemanaNumero);
        if (num === dia.numero || (dia.numero === 0 && num === 7)) {
          return true;
        }
      }

      if (d.diaSemana) {
        const ddsDiaLimpo = normalizarTexto(d.diaSemana);
        const alvoDiaLimpo = normalizarTexto(dia.nome);
        if (ddsDiaLimpo && alvoDiaLimpo && (ddsDiaLimpo.includes(alvoDiaLimpo) || alvoDiaLimpo.includes(ddsDiaLimpo))) {
          return true;
        }
      }

      if (d.data) {
        try {
          const dt = parseDataUniversal(d.data);
          if (dt) {
            const dayNum = dt.getDay(); // 0 = Dom, 1 = Seg, ..., 6 = Sáb
            if (dayNum === dia.numero) {
              return true;
            }
          }
        } catch {
          // ignora
        }
      }

      return false;
    });

    let participantesDoDia: Participante[] = [];
    let ddsCompletoObj = ddsEncontrado;

    if (ddsEncontrado && ddsEncontrado.idDDS) {
      try {
        const result = await api.getDDSCompleto(ddsEncontrado.idDDS);
        if (result && result.sucesso) {
          if (result.dds) {
            ddsCompletoObj = {
              ...ddsEncontrado,
              ...result.dds,
              local: (result.dds.local && result.dds.local.trim() !== '') ? result.dds.local : (ddsEncontrado?.local || '')
            };
          }
          if (Array.isArray(result.participantes)) {
            participantesDoDia = result.participantes;
          }
        }
      } catch (err) {
        console.warn(`[PDF] Erro ao carregar DDSCompleto do dia ${dia.nome}:`, err);
        if (Array.isArray(ddsEncontrado.participantes) && ddsEncontrado.participantes.length > 0) {
          participantesDoDia = ddsEncontrado.participantes;
        } else {
          try {
            participantesDoDia = await api.getParticipantes(ddsEncontrado.idDDS);
          } catch {
            participantesDoDia = [];
          }
        }
      }

      // Garante a busca individualizada da assinatura do encarregado para o ID_DDS do dia
      if (ddsCompletoObj && (!ddsCompletoObj.assinaturaEncarregado || ddsCompletoObj.assinaturaEncarregado.trim() === '')) {
        try {
          const assEnc = await api.buscarAssinaturaEncarregado(ddsEncontrado.idDDS);
          if (assEnc) {
            ddsCompletoObj.assinaturaEncarregado = assEnc;
          }
        } catch {
          // ignora
        }
      }
    }

    diasMapeados.push({
      dia,
      dds: ddsCompletoObj,
      participantes: participantesDoDia
    });
  }

  // 4. Montar a lista COMPLETA de colaboradores mantendo a ordem dos ativos
  const participantesMap = new Map<string, CumulativeParticipant>();

  funcionariosAtivos.forEach((f, idx) => {
    const nomeLimpo = (f.nome || '').trim();
    if (!nomeLimpo) return;

    const idFunc = String(f.id || f.idFuncionario || `FUNC-${idx + 1}`).trim().toUpperCase();

    participantesMap.set(idFunc, {
      idFuncionario: idFunc,
      nome: nomeLimpo,
      cargo: f.cargo || f.funcao || '',
      primeiroDiaIndex: 0,
      dias: {}
    });
  });

  // 5. Vincular a participação e assinatura do colaborador EXCLUSIVAMENTE ao dia/DDS em que ocorreu
  diasMapeados.forEach((diaData, diaIndex) => {
    diaData.participantes.forEach((p) => {
      const nomeLimpo = (p.nome || '').trim();
      if (!nomeLimpo) return;

      const pIdFunc = String(p.idFuncionario || (p as any).id || '').trim().toUpperCase();

      let entry: CumulativeParticipant | undefined;
      if (pIdFunc && participantesMap.has(pIdFunc)) {
        entry = participantesMap.get(pIdFunc);
      } else {
        const normP = normalizarTexto(nomeLimpo);
        for (const item of participantesMap.values()) {
          if (normalizarTexto(item.nome) === normP) {
            entry = item;
            break;
          }
        }
      }

      // Caso haja um colaborador registrado no DDS que não conste na lista de ativos, adiciona à tabela
      if (!entry) {
        const key = pIdFunc || normalizarTexto(nomeLimpo);
        entry = {
          idFuncionario: pIdFunc || key,
          nome: nomeLimpo,
          cargo: p.cargo || '',
          primeiroDiaIndex: diaIndex,
          dias: {}
        };
        participantesMap.set(key, entry);
      }

      const isAusente = p.ausente === true || String(p.ausente || '').toUpperCase() === 'SIM';
      const motivo = isAusente ? String(p.motivoAusencia || '').trim() : '';

      // Registra para o dia específico (diaIndex)
      entry.dias[diaIndex] = {
        emociograma: isAusente ? '' : (p.emociograma ? String(p.emociograma).toUpperCase() : 'BOM'),
        assinatura: isAusente ? '' : ((p.assinatura && String(p.assinatura).trim() !== '') ? String(p.assinatura) : ''),
        presente: !isAusente,
        ausente: isAusente,
        motivoAusencia: motivo
      };
    });
  });

  const participantesAcumulados = Array.from(participantesMap.values());

  return {
    diasMapeados,
    participantesAcumulados
  };
}

/**
 * Desenha o ícone do emociograma (Verde 🙂, Amarelo 😐, Vermelho 🙁)
 */
function drawEmociogramaIcon(
  doc: jsPDF,
  type: 'BOM' | 'REGULAR' | 'RUIM',
  centerX: number,
  centerY: number,
  radius: number,
  selected: boolean
) {
  let fillColor = [255, 255, 255];
  let strokeColor = [150, 150, 150];
  let faceColor = [80, 80, 80];

  if (type === 'BOM') {
    fillColor = selected ? [134, 239, 172] : [220, 252, 231]; // bg-green
    strokeColor = selected ? [22, 101, 52] : [110, 180, 130];
    faceColor = selected ? [20, 83, 45] : [100, 140, 110];
  } else if (type === 'REGULAR') {
    fillColor = selected ? [253, 224, 71] : [254, 249, 195]; // bg-yellow
    strokeColor = selected ? [161, 98, 7] : [200, 180, 90];
    faceColor = selected ? [113, 63, 18] : [140, 120, 60];
  } else {
    fillColor = selected ? [252, 165, 165] : [254, 226, 226]; // bg-red
    strokeColor = selected ? [185, 28, 28] : [210, 120, 120];
    faceColor = selected ? [127, 29, 29] : [150, 80, 80];
  }

  // Círculo base da face
  doc.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
  doc.setDrawColor(strokeColor[0], strokeColor[1], strokeColor[2]);
  doc.setLineWidth(selected ? 0.35 : 0.15);
  doc.circle(centerX, centerY, radius, 'FD');

  // Olhos
  doc.setFillColor(faceColor[0], faceColor[1], faceColor[2]);
  const eyeOffset = radius * 0.4;
  const eyeRadius = radius * 0.16;
  const eyeY = centerY - radius * 0.2;
  doc.circle(centerX - eyeOffset, eyeY, eyeRadius, 'F');
  doc.circle(centerX + eyeOffset, eyeY, eyeRadius, 'F');

  // Boca
  doc.setDrawColor(faceColor[0], faceColor[1], faceColor[2]);
  doc.setLineWidth(0.2);
  const mouthY = centerY + radius * 0.35;
  const mouthW = radius * 0.45;

  if (type === 'BOM') {
    // Sorriso curvado para cima
    doc.line(centerX - mouthW, mouthY - radius * 0.08, centerX - mouthW * 0.5, mouthY + radius * 0.15);
    doc.line(centerX - mouthW * 0.5, mouthY + radius * 0.15, centerX + mouthW * 0.5, mouthY + radius * 0.15);
    doc.line(centerX + mouthW * 0.5, mouthY + radius * 0.15, centerX + mouthW, mouthY - radius * 0.08);
  } else if (type === 'REGULAR') {
    // Linha reta neutra
    doc.line(centerX - mouthW, mouthY, centerX + mouthW, mouthY);
  } else {
    // Boca curvada para baixo (triste)
    doc.line(centerX - mouthW, mouthY + radius * 0.12, centerX - mouthW * 0.5, mouthY - radius * 0.1);
    doc.line(centerX - mouthW * 0.5, mouthY - radius * 0.1, centerX + mouthW * 0.5, mouthY - radius * 0.1);
    doc.line(centerX + mouthW * 0.5, mouthY - radius * 0.1, centerX + mouthW, mouthY + radius * 0.12);
  }

  // Se selecionado, desenha um pequeno indicador de marcação
  if (selected) {
    doc.setDrawColor(20, 20, 20);
    doc.setLineWidth(0.25);
    doc.rect(centerX - radius - 0.2, centerY - radius - 0.2, radius * 2 + 0.4, radius * 2 + 0.4);
  }
}

/**
 * Gera e realiza o download do PDF da Folha Semanal de DDPS EXATAMENTE conforme a imagem de referência
 */
export async function gerarPDFSemanalDDPS(
  status: DDPSStatus | null,
  ddsSemana: DDS[]
): Promise<void> {
  const { diasMapeados, participantesAcumulados } = await carregarDadosSemanaAcumulados(ddsSemana);

  // Formato A4 Paisagem (Landscape): 297mm x 210mm
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 297mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 210mm
  const marginLeft = 6;
  const marginTop = 5;
  const contentWidth = pageWidth - marginLeft * 2; // 285mm

  const ddsReferencia = diasMapeados.find((d) => Boolean(d.dds))?.dds;

  // 1. TÍTULO SUPERIOR PRINCIPAL (Barra superior)
  const titleH = 5.5;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.4);
  doc.setFillColor(255, 255, 255);
  doc.rect(marginLeft, marginTop, contentWidth, titleH, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(0, 0, 0);
  doc.text('DDPS - DIÁLOGO DIÁRIO PARTICIPATIVO DE SEGURANÇA', marginLeft + contentWidth / 2, marginTop + 4, {
    align: 'center'
  });

  // 2. CABEÇALHO DIVIDIDO EM 2 BLOCOS (Metadados à esquerda e Emociograma/Legenda à direita)
  const headerY = marginTop + titleH;
  const headerH = 24.5;
  const leftColW = 182; // Largura do bloco de dados
  const rightColW = contentWidth - leftColW; // 103mm para o bloco de Emociograma

  // Retângulo do Bloco Esquerdo
  doc.rect(marginLeft, headerY, leftColW, headerH);

  // Divisões internas do Bloco Esquerdo
  const row1Y = headerY;
  const row2Y = headerY + 6.1;
  const row3Y = headerY + 12.2;
  const row4Y = headerY + 18.3;

  doc.line(marginLeft, row2Y, marginLeft + leftColW, row2Y);
  doc.line(marginLeft, row3Y, marginLeft + leftColW, row3Y);
  doc.line(marginLeft, row4Y, marginLeft + leftColW, row4Y);

  // Linhas verticais do bloco esquerdo
  const midLeftX = marginLeft + 96;
  doc.line(midLeftX, row1Y, midLeftX, row4Y);

  const intervalo = obterIntervaloSemana(status, ddsSemana);
  const contratada = 'TESLA';
  const subcontratada = '';
  const semanaTexto = `${intervalo.dataInicioStr} á ${intervalo.dataFimStr}`;
  
  // Busca o LOCAL do DDS em qualquer dia da semana ou no array ddsSemana
  let localStr = '';
  for (const d of diasMapeados) {
    if (d.dds?.local && d.dds.local.trim() !== '') {
      localStr = d.dds.local.trim();
      break;
    }
  }
  if (!localStr) {
    for (const d of ddsSemana) {
      if (d?.local && d.local.trim() !== '') {
        localStr = d.local.trim();
        break;
      }
    }
  }
  const ddsComResp = diasMapeados.find((d) => Boolean(d.dds?.responsavel))?.dds;
  const responsavelSHE = ddsComResp?.responsavel || status?.responsavelPadrao || 'Não informado';

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(0, 0, 0);

  // Linha 1: Contratada / Sub-Contratada
  doc.text('Contratada: ', marginLeft + 2, row1Y + 4.2);
  doc.setFont('helvetica', 'bold');
  doc.text(contratada, marginLeft + 20, row1Y + 4.2);

  doc.setFont('helvetica', 'bold');
  doc.text('Sub-Contratada: ', midLeftX + 2, row1Y + 4.2);
  doc.setFont('helvetica', 'normal');
  doc.text(subcontratada, midLeftX + 25, row1Y + 4.2);

  // Linha 2: Semana / Local
  doc.setFont('helvetica', 'bold');
  doc.text('Semana: ', marginLeft + 2, row2Y + 4.2);
  doc.setFont('helvetica', 'normal');
  doc.text(semanaTexto, marginLeft + 16, row2Y + 4.2);

  doc.setFont('helvetica', 'bold');
  doc.text('Local: ', midLeftX + 2, row2Y + 4.2);
  doc.setFont('helvetica', 'normal');
  doc.text(localStr, midLeftX + 13, row2Y + 4.2);

  // Linha 3: Responsável SHE
  doc.setFont('helvetica', 'bold');
  doc.text('Responsável SHE: ', marginLeft + 2, row3Y + 4.2);
  doc.setFont('helvetica', 'bold');
  doc.text(responsavelSHE, marginLeft + 28, row3Y + 4.2);

  // BLOCO DIREITO: QUADRO DO EMOCIOGRAMA E LEGENDA
  const rightX = marginLeft + leftColW;
  doc.rect(rightX, headerY, rightColW, headerH);

  // Linhas do bloco direito
  const emHeaderH = 4.2;
  const emRowH = 5.2;
  const legHeaderH = 4.0;
  const legRowH = 5.9;

  const emRow1Y = headerY + emHeaderH;
  const emRow2Y = emRow1Y + emRowH;
  const emRow3Y = emRow2Y + emRowH;
  const legRowY = emRow3Y + legHeaderH;

  // Título Emociograma
  doc.setFillColor(255, 255, 255);
  doc.rect(rightX, headerY, rightColW, emHeaderH, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('Emociograma', rightX + rightColW / 2, headerY + 3.1, { align: 'center' });

  // Linha 1: BOM
  doc.setFillColor(220, 252, 231); // Verde claro
  doc.rect(rightX, emRow1Y, 17, emRowH, 'FD');
  drawEmociogramaIcon(doc, 'BOM', rightX + 3.5, emRow1Y + 2.6, 1.8, false);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(0, 0, 0);
  doc.text('BOM', rightX + 8, emRow1Y + 3.4);

  doc.setFillColor(255, 255, 255);
  doc.rect(rightX + 17, emRow1Y, rightColW - 17, emRowH, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.2);
  doc.text('O empregado está apto para praticar suas atividades diárias.', rightX + 18.5, emRow1Y + 3.4);

  // Linha 2: REGULAR
  doc.setFillColor(254, 249, 195); // Amarelo claro
  doc.rect(rightX, emRow2Y, 17, emRowH, 'FD');
  drawEmociogramaIcon(doc, 'REGULAR', rightX + 3.5, emRow2Y + 2.6, 1.8, false);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.8);
  doc.text('REGULA', rightX + 7, emRow2Y + 3.4);

  doc.setFillColor(255, 255, 255);
  doc.rect(rightX + 17, emRow2Y, rightColW - 17, emRowH, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(4.3);
  doc.text(
    'O supervisor/encarregado deverá conversar com o empregado. Em caso extremo, o',
    rightX + 18.5,
    emRow2Y + 2.2
  );
  doc.text(
    'empregado não deve executar a atividade, e deve ser remanejado para outra atividade.',
    rightX + 18.5,
    emRow2Y + 4.2
  );

  // Linha 3: RUIM
  doc.setFillColor(254, 226, 226); // Vermelho claro
  doc.rect(rightX, emRow3Y, 17, emRowH, 'FD');
  drawEmociogramaIcon(doc, 'RUIM', rightX + 3.5, emRow3Y + 2.6, 1.8, false);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.text('RUIM', rightX + 7.5, emRow3Y + 3.4);

  doc.setFillColor(255, 255, 255);
  doc.rect(rightX + 17, emRow3Y, rightColW - 17, emRowH, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(4.3);
  doc.text(
    'Precisa de orientação e acompanhamento. Não deve executar a atividade, e deve ser',
    rightX + 18.5,
    emRow3Y + 2.2
  );
  doc.text('encaminhado ao serviço médico/assistente social.', rightX + 18.5, emRow3Y + 4.2);

  // Linha 4: Legenda
  doc.setFillColor(255, 255, 255);
  doc.rect(rightX, emRow3Y + emRowH, rightColW, legHeaderH + legRowH, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.text('Legenda', rightX + rightColW / 2, emRow3Y + emRowH + 2.8, { align: 'center' });
  doc.line(rightX, emRow3Y + emRowH + 3.6, rightX + rightColW, emRow3Y + emRowH + 3.6);

  // Itens da Legenda (AT, FA, FE, FO, DE)
  doc.setFontSize(5);
  doc.setFont('helvetica', 'bold');
  doc.text('AT', rightX + 2, emRow3Y + emRowH + 6.8);
  doc.setFont('helvetica', 'normal');
  doc.text('ATESTADO', rightX + 6, emRow3Y + emRowH + 6.8);

  doc.setFont('helvetica', 'bold');
  doc.text('FA', rightX + 23, emRow3Y + emRowH + 6.8);
  doc.setFont('helvetica', 'normal');
  doc.text('FALTA', rightX + 28, emRow3Y + emRowH + 6.8);

  doc.setFont('helvetica', 'bold');
  doc.text('FE', rightX + 42, emRow3Y + emRowH + 6.8);
  doc.setFont('helvetica', 'normal');
  doc.text('FÉRIAS', rightX + 47, emRow3Y + emRowH + 6.8);

  doc.setFont('helvetica', 'bold');
  doc.text('FO', rightX + 62, emRow3Y + emRowH + 6.8);
  doc.setFont('helvetica', 'normal');
  doc.text('FOLGA', rightX + 67, emRow3Y + emRowH + 6.8);

  doc.setFont('helvetica', 'bold');
  doc.text('DE', rightX + 81, emRow3Y + emRowH + 6.8);
  doc.setFont('helvetica', 'normal');
  doc.text('DESLIGADO', rightX + 86, emRow3Y + emRowH + 6.8);

  // 3. TABELA DE DIAS / CONTEÚDO PROGRAMÁTICO
  const progTableY = headerY + headerH;
  const diaColW = 27;
  const temaColW = 70;
  const conteudoColW = contentWidth - diaColW - temaColW;
  const progRowH = 3.6;

  // Cabeçalho da tabela de conteúdo
  doc.setFillColor(255, 255, 255);
  doc.rect(marginLeft, progTableY, contentWidth, progRowH, 'FD');
  doc.line(marginLeft + diaColW, progTableY, marginLeft + diaColW, progTableY + progRowH * 8);
  doc.line(marginLeft + diaColW + temaColW, progTableY, marginLeft + diaColW + temaColW, progTableY + progRowH * 8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.text('DIA', marginLeft + diaColW / 2, progTableY + 2.6, { align: 'center' });
  doc.text('TEMA', marginLeft + diaColW + temaColW / 2, progTableY + 2.6, { align: 'center' });
  doc.text(
    'CONTEÚDO PROGRAMÁTICO (de acordo com as atividades a serem desenvolvidas)',
    marginLeft + diaColW + temaColW + conteudoColW / 2,
    progTableY + 2.6,
    { align: 'center' }
  );

  // 7 Linhas para os 7 dias
  diasMapeados.forEach((d, idx) => {
    const rowY = progTableY + progRowH * (idx + 1);
    doc.rect(marginLeft, rowY, contentWidth, progRowH);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.8);
    doc.text(d.dia.nome, marginLeft + diaColW / 2, rowY + 2.5, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.3);

    const tema = d.dds?.tema || '';
    const conteudo = d.dds?.conteudo || '';

    doc.text(doc.splitTextToSize(tema, temaColW - 2)[0] || '', marginLeft + diaColW + 2, rowY + 2.5);
    doc.text(
      doc.splitTextToSize(conteudo, conteudoColW - 2)[0] || '',
      marginLeft + diaColW + temaColW + 2,
      rowY + 2.5
    );
  });

  // 4. TABELA PRINCIPAL DE PARTICIPANTES E EMOCIOGRAMA SEMANAL
  const partTableY = progTableY + progRowH * 8;
  const numColW = 6;
  const nomeColW = 60;
  const diasTotalW = contentWidth - numColW - nomeColW;
  const diaBlockW = diasTotalW / 7; // ~31.28mm por dia da semana
  const emoColW = 4.2; // 3 colunas de emoji = 12.6mm
  const rubricaColW = diaBlockW - emoColW * 3; // ~18.68mm

  // Cabeçalho dos Participantes (Linha 1: N° | NOME | 7 Dias)
  const headH1 = 3.6;
  const headH2 = 3.4;
  const headH3 = 3.4;
  const headH4 = 4.8;
  const totalHeadH = headH1 + headH2 + headH3 + headH4; // 15.2mm

  doc.setFillColor(255, 255, 255);
  doc.rect(marginLeft, partTableY, contentWidth, totalHeadH, 'FD');

  // Colunas N° e NOME
  doc.rect(marginLeft, partTableY, numColW, totalHeadH);
  doc.rect(marginLeft + numColW, partTableY, nomeColW, totalHeadH);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('N°', marginLeft + numColW / 2, partTableY + totalHeadH / 2 + 1, { align: 'center' });
  doc.text('NOME', marginLeft + numColW + nomeColW / 2, partTableY + totalHeadH / 2 + 1, { align: 'center' });

  // Desenha os cabeçalhos dos 7 dias
  diasMapeados.forEach((d, idx) => {
    const diaX = marginLeft + numColW + nomeColW + idx * diaBlockW;

    // Linha 1: Nome do Dia (ex: SEGUNDA - FEIRA)
    doc.rect(diaX, partTableY, diaBlockW, headH1);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.5);
    doc.text(d.dia.diaCurto, diaX + diaBlockW / 2, partTableY + 2.6, { align: 'center' });

    // Linha 2: DATA
    const h2Y = partTableY + headH1;
    doc.rect(diaX, h2Y, diaBlockW, headH2);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.2);
    doc.text('DATA:', diaX + 1.5, h2Y + 2.5);

    doc.setFont('helvetica', 'normal');
    const dataStr = d.dds?.data ? formatarDataApenas(d.dds.data) : intervalo.datasDias[idx];
    doc.text(dataStr, diaX + 10, h2Y + 2.5);

    // Linha 3: HORA
    const h3Y = h2Y + headH2;
    doc.rect(diaX, h3Y, diaBlockW, headH3);
    doc.setFont('helvetica', 'bold');
    doc.text('HORA:', diaX + 1.5, h3Y + 2.5);

    doc.setFont('helvetica', 'normal');
    const horaStr = d.dds?.horario ? formatarHoraApenas(d.dds.horario) : '########';
    doc.text(horaStr, diaX + 10, h3Y + 2.5);

    // Linha 4: Como estou me sentindo? / Rubrica
    const h4Y = h3Y + headH3;
    const emoBlockW = emoColW * 3;
    doc.rect(diaX, h4Y, emoBlockW, headH4);
    doc.rect(diaX + emoBlockW, h4Y, rubricaColW, headH4);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(4.2);
    doc.text('Como estou', diaX + emoBlockW / 2, h4Y + 2.1, { align: 'center' });
    doc.text('me sentindo?', diaX + emoBlockW / 2, h4Y + 3.9, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.2);
    doc.text('Rubrica', diaX + emoBlockW + rubricaColW / 2, h4Y + 3.1, { align: 'center' });
  });

  // LINHAS DOS PARTICIPANTES (Minimo 20 ou total de colaboradores ativos)
  const partRowH = 4.4;
  const bodyStartY = partTableY + totalHeadH;
  const totalRows = Math.max(20, participantesAcumulados.length);

  for (let rowIdx = 0; rowIdx < totalRows; rowIdx++) {
    const rowY = bodyStartY + rowIdx * partRowH;
    const part = participantesAcumulados[rowIdx];

    // Coluna N°
    doc.rect(marginLeft, rowY, numColW, partRowH);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(0, 0, 0);
    doc.text(String(rowIdx + 1), marginLeft + numColW / 2, rowY + 3.1, { align: 'center' });

    // Coluna NOME
    doc.rect(marginLeft + numColW, rowY, nomeColW, partRowH);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.8);
    if (part) {
      doc.text(part.nome.toUpperCase(), marginLeft + numColW + 1.5, rowY + 3.1);
    }

    // Colunas dos 7 Dias
    diasMapeados.forEach((_, diaIdx) => {
      const diaX = marginLeft + numColW + nomeColW + diaIdx * diaBlockW;
      const emoBlockX = diaX;
      const rubricaX = diaX + emoColW * 3;

      // Sub-colunas dos Emojis (Verde, Amarelo, Vermelho)
      const reg = part ? part.dias[diaIdx] : undefined;
      const isAusente = Boolean(reg && reg.ausente);
      const isPresent = Boolean(reg && reg.presente && !isAusente);
      const emo = isPresent ? (reg.emociograma || 'BOM') : '';

      // Coluna 1: BOM (Verde)
      doc.setFillColor(220, 252, 231);
      doc.rect(emoBlockX, rowY, emoColW, partRowH, 'FD');
      drawEmociogramaIcon(
        doc,
        'BOM',
        emoBlockX + emoColW / 2,
        rowY + partRowH / 2,
        1.4,
        isPresent && emo === 'BOM'
      );

      // Coluna 2: REGULAR (Amarelo)
      doc.setFillColor(254, 249, 195);
      doc.rect(emoBlockX + emoColW, rowY, emoColW, partRowH, 'FD');
      drawEmociogramaIcon(
        doc,
        'REGULAR',
        emoBlockX + emoColW * 1.5,
        rowY + partRowH / 2,
        1.4,
        isPresent && (emo === 'REGULAR' || emo === 'REGULA' || emo === 'REG')
      );

      // Coluna 3: RUIM (Vermelho)
      doc.setFillColor(254, 226, 226);
      doc.rect(emoBlockX + emoColW * 2, rowY, emoColW, partRowH, 'FD');
      drawEmociogramaIcon(
        doc,
        'RUIM',
        emoBlockX + emoColW * 2.5,
        rowY + partRowH / 2,
        1.4,
        isPresent && emo === 'RUIM'
      );

      // Coluna Rubrica
      doc.setFillColor(255, 255, 255);
      doc.rect(rubricaX, rowY, rubricaColW, partRowH, 'FD');

      if (isAusente && reg?.motivoAusencia) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(4.8);
        doc.setTextColor(180, 0, 0);
        const txtMotivo = reg.motivoAusencia.trim();
        const line = doc.splitTextToSize(txtMotivo, rubricaColW - 0.5)[0] || txtMotivo;
        doc.text(line, rubricaX + rubricaColW / 2, rowY + 3.1, { align: 'center' });
        doc.setTextColor(0, 0, 0);
      } else if (isPresent) {
        // Se houver assinatura digital (base64) ou marcação de presença
        if (reg.assinatura && reg.assinatura.startsWith('data:image')) {
          try {
            doc.addImage(
              reg.assinatura,
              'PNG',
              rubricaX + 1,
              rowY + 0.4,
              rubricaColW - 2,
              partRowH - 0.8
            );
          } catch {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(5);
            doc.text('✓ Assinado', rubricaX + rubricaColW / 2, rowY + 3.1, { align: 'center' });
          }
        } else {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(5.5);
          doc.text('✓', rubricaX + rubricaColW / 2, rowY + 3.1, { align: 'center' });
        }
      }
    });
  }

  // 5. LINHA DE ASSINATURA DO ENCARREGADO
  const encRowY = bodyStartY + totalRows * partRowH;
  const encRowH = 5.0;

  // Bloco Esquerdo de texto
  doc.setFillColor(255, 255, 255);
  doc.rect(marginLeft, encRowY, numColW + nomeColW, encRowH, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.text('Assinatura do Encarregado responsável pelo DDS', marginLeft + 2, encRowY + 3.4);

  // 7 Caixas de Assinatura para cada dia
  diasMapeados.forEach((d, diaIdx) => {
    const diaX = marginLeft + numColW + nomeColW + diaIdx * diaBlockW;
    doc.rect(diaX, encRowY, diaBlockW, encRowH);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.5);
    doc.text('Ass:', diaX + 1.5, encRowY + 3.4);

    if (d.dds && d.dds.assinaturaEncarregado && String(d.dds.assinaturaEncarregado).startsWith('data:image')) {
      try {
        doc.addImage(
          String(d.dds.assinaturaEncarregado),
          'PNG',
          diaX + 7,
          encRowY + 0.5,
          diaBlockW - 8,
          encRowH - 1.0
        );
      } catch (err) {
        console.warn(`[PDF] Erro ao renderizar assinatura encarregado do dia ${diaIdx}:`, err);
      }
    }
  });

  // 6. LINHA DE OBSERVAÇÃO
  const obsRowY = encRowY + encRowH;
  const obsRowH = 5.0;

  doc.rect(marginLeft, obsRowY, contentWidth, obsRowH);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.text('Observação:', marginLeft + 2, obsRowY + 3.4);

  // Salva o PDF com nome padronizado
  const nomeArquivo = `DDPS_Folha_Semanal_${status?.semana || 'Oficial'}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(nomeArquivo);
}
