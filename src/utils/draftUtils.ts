import { DDS } from '../types';

export function formatarDataHojeBR(): string {
  const agora = new Date();
  const dia = String(agora.getDate()).padStart(2, '0');
  const mes = String(agora.getMonth() + 1).padStart(2, '0');
  const ano = agora.getFullYear();
  return `${dia}/${mes}/${ano}`;
}

/**
 * Verifica se o rascunho informado já consta como FINALIZADO/CONCLUÍDO
 * (seja pelo seu próprio objeto ou pelo status oficial retornado da planilha).
 */
export function isDraftFinalized(
  draftDDS: DDS | null | undefined,
  allDDSList?: DDS[]
): boolean {
  if (!draftDDS) return true;

  const statusStr = String(draftDDS.status || '').toUpperCase();
  if (statusStr === 'FINALIZADO' || statusStr === 'REALIZADO' || statusStr === 'CONCLUIDO') {
    return true;
  }

  if (draftDDS.idDDS && allDDSList && allDDSList.length > 0) {
    const idTrim = String(draftDDS.idDDS).trim();
    const ddsMatch = allDDSList.find((d) => String(d.idDDS || '').trim() === idTrim);
    if (ddsMatch) {
      const matchStatus = String(ddsMatch.status || '').toUpperCase();
      if (matchStatus === 'FINALIZADO' || matchStatus === 'REALIZADO' || matchStatus === 'CONCLUIDO') {
        return true;
      }
    }
  }

  return false;
}

/**
 * Verifica se um rascunho (não finalizado) pertence à data de HOJE.
 */
export function isDraftForToday(
  draftDDS: DDS | null | undefined,
  currentStatusData?: string | null
): boolean {
  if (!draftDDS) return false;
  const hojeStr = currentStatusData || formatarDataHojeBR();
  const draftDataStr = String(draftDDS.data || '').trim();
  return Boolean(draftDataStr && draftDataStr === hojeStr);
}

/**
 * Determina se a criação de um "+ NOVO DDS" deve ser bloqueada/exigir confirmação.
 * 
 * Regras Estritas de Negócio:
 * 1. RASCUNHO DE HOJE → bloqueia novo DDPS (exige confirmação/opção de continuar)
 * 2. RASCUNHO DE DATA ANTERIOR → NÃO bloqueia novo DDPS (permite novo DDPS de hoje sem impedir)
 * 3. DDPS FINALIZADO (qualquer data) → NUNCA bloqueia novo DDPS
 */
export function shouldBlockNewDDS(
  draftDDS: DDS | null | undefined,
  currentStatusData?: string | null,
  allDDSList?: DDS[]
): boolean {
  if (!draftDDS) return false;

  // Se já está finalizado, nunca bloqueia
  if (isDraftFinalized(draftDDS, allDDSList)) {
    return false;
  }

  // Só bloqueia se o rascunho for do dia de HOJE
  return isDraftForToday(draftDDS, currentStatusData);
}

/**
 * Manter retrocompatibilidade
 */
export function isDraftValidForToday(
  draftDDS: DDS | null | undefined,
  currentStatusData?: string | null,
  allDDSList?: DDS[]
): boolean {
  return shouldBlockNewDDS(draftDDS, currentStatusData, allDDSList);
}
