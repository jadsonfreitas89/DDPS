import { DDS } from '../types';

/**
 * Utilitário oficial de cálculo e manipulação de semanas do DDPS
 * Regra: DOMINGO → SEGUNDA → TERÇA → QUARTA → QUINTA → SEXTA → SÁBADO
 * Fuso horário: America/Sao_Paulo (Horário Oficial do Brasil)
 */

function parseDataUniversal(val?: string | number | Date): Date | null {
  if (val === undefined || val === null || val === '') return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  if (typeof val === 'number') {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }
  const str = String(val).trim();
  
  // Se for ISO ou contiver T
  if (str.includes('T')) {
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  }
  
  // Se for AAAA-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    const parts = str.substring(0, 10).split('-');
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 12, 0, 0);
    return isNaN(d.getTime()) ? null : d;
  }

  // Se for DD/MM/AAAA
  if (/^\d{2}\/\d{2}\/\d{4}/.test(str)) {
    const parts = str.substring(0, 10).split('/');
    const d = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]), 12, 0, 0);
    return isNaN(d.getTime()) ? null : d;
  }

  // Se for AAAAMMDD (formato estável SEMANA_ID)
  if (/^\d{8}$/.test(str)) {
    const ano = Number(str.substring(0, 4));
    const mes = Number(str.substring(4, 6)) - 1;
    const dia = Number(str.substring(6, 8));
    const d = new Date(ano, mes, dia, 12, 0, 0);
    return isNaN(d.getTime()) ? null : d;
  }

  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Obtém o Domingo (início) da semana referente à data informada
 */
export function getSundayOfWeek(inputDate?: Date | string | number): Date {
  let d = parseDataUniversal(inputDate);
  if (!d) d = new Date();

  // No JavaScript, getDay() retorna: 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
  const dayOfWeek = d.getDay();
  const sunday = new Date(d);
  sunday.setDate(d.getDate() - dayOfWeek);
  sunday.setHours(12, 0, 0, 0);
  return sunday;
}

/**
 * Obtém o Sábado (fim) da semana referente à data informada
 */
export function getSaturdayOfWeek(inputDate?: Date | string | number): Date {
  const sunday = getSundayOfWeek(inputDate);
  const saturday = new Date(sunday);
  saturday.setDate(sunday.getDate() + 6);
  saturday.setHours(23, 59, 59, 999);
  return saturday;
}

/**
 * Gera o SEMANA_ID estável (formato YYYYMMDD do Domingo da semana)
 * Exemplo: Domingo 13/09/2026 -> "20260913"
 */
export function getSemanaId(inputDate?: Date | string | number): string {
  const sunday = getSundayOfWeek(inputDate);
  const yyyy = sunday.getFullYear();
  const mm = String(sunday.getMonth() + 1).padStart(2, '0');
  const dd = String(sunday.getDate()).padStart(2, '0');
  return `${yyyy}${mm}${dd}`;
}

/**
 * Calcula o número visual da semana no ano (ex: Semana 38)
 */
export function getSemanaNumero(inputDate?: Date | string | number): number {
  const sunday = getSundayOfWeek(inputDate);
  const yearStart = new Date(sunday.getFullYear(), 0, 1);
  const diffTime = sunday.getTime() - yearStart.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const weekNo = Math.floor((diffDays + yearStart.getDay()) / 7) + 1;
  return weekNo;
}

/**
 * Retorna o texto formatado do intervalo semanal
 * Exemplo: "13/09/2026 a 19/09/2026"
 */
export function getIntervaloSemanaTexto(inputDate?: Date | string | number): string {
  const sunday = getSundayOfWeek(inputDate);
  const saturday = getSaturdayOfWeek(inputDate);

  const format = (d: Date) => {
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const ano = d.getFullYear();
    return `${dia}/${mes}/${ano}`;
  };

  return `${format(sunday)} a ${format(saturday)}`;
}

/**
 * Verifica se um objeto DDS pertence a uma semana específica identificada por semanaId
 */
export function pertenceASemana(dds: DDS, targetSemanaId: string): boolean {
  if (!targetSemanaId) return false;

  // 1. Verificação direta por semanaId
  if (dds.semana && String(dds.semana).trim() === String(targetSemanaId).trim()) {
    return true;
  }

  // 2. Verificação calculada a partir da data do DDS
  if (dds.data) {
    const ddsSemanaId = getSemanaId(dds.data);
    if (ddsSemanaId === targetSemanaId) return true;
  }

  return false;
}

export interface SemanaGroup {
  semanaId: string;
  semanaNum: number;
  ano: number;
  dataInicioStr: string;
  dataFimStr: string;
  intervaloTexto: string;
  ddsList: DDS[];
  isCurrentWeek: boolean;
}

/**
 * Agrupa uma lista de DDS em semanas ordenadas da mais recente para a mais antiga,
 * garantindo sempre que a semana atual esteja presente na lista.
 */
export function agruparSemanas(allDDS: DDS[]): SemanaGroup[] {
  const currentSunday = getSundayOfWeek(new Date());
  const currentSemanaId = getSemanaId(currentSunday);

  const map = new Map<string, { sunday: Date; ddsList: DDS[] }>();

  // Adiciona a semana atual obrigatoriamente
  map.set(currentSemanaId, { sunday: currentSunday, ddsList: [] });

  // Agrupa os DDS existentes
  for (const item of allDDS) {
    let sunday: Date | null = null;
    if (item.data) {
      const parsed = parseDataUniversal(item.data);
      if (parsed) sunday = getSundayOfWeek(parsed);
    }
    
    // Se não tiver data válida mas tiver semana (formato YYYYMMDD)
    if (!sunday && item.semana && /^\d{8}$/.test(String(item.semana))) {
      const parsed = parseDataUniversal(String(item.semana));
      if (parsed) sunday = getSundayOfWeek(parsed);
    }

    if (!sunday) {
      sunday = currentSunday;
    }

    const sid = getSemanaId(sunday);
    if (!map.has(sid)) {
      map.set(sid, { sunday, ddsList: [] });
    }
    map.get(sid)!.ddsList.push(item);
  }

  const result: SemanaGroup[] = [];
  map.forEach((val, sid) => {
    const saturday = new Date(val.sunday);
    saturday.setDate(val.sunday.getDate() + 6);

    const format = (d: Date) => {
      const dia = String(d.getDate()).padStart(2, '0');
      const mes = String(d.getMonth() + 1).padStart(2, '0');
      const ano = d.getFullYear();
      return `${dia}/${mes}/${ano}`;
    };

    const dataInicioStr = format(val.sunday);
    const dataFimStr = format(saturday);

    result.push({
      semanaId: sid,
      semanaNum: getSemanaNumero(val.sunday),
      ano: val.sunday.getFullYear(),
      dataInicioStr,
      dataFimStr,
      intervaloTexto: `${dataInicioStr} a ${dataFimStr}`,
      ddsList: val.ddsList,
      isCurrentWeek: sid === currentSemanaId
    });
  });

  // Ordena por semanaId decrescente (da mais recente para a mais antiga)
  result.sort((a, b) => Number(b.semanaId) - Number(a.semanaId));

  return result;
}
