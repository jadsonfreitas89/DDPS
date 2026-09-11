/**
 * Utilitário para formatação visual de data e horário no fuso oficial: America/Sao_Paulo
 * Padrão brasileiro: DD/MM/AAAA HH:mm
 */

export function parseISOInSaoPaulo(isoStr: string) {
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return null;

    const formatterDate = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    const formatterTime = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    return {
      data: formatterDate.format(d),
      hora: formatterTime.format(d)
    };
  } catch {
    return null;
  }
}

export function formatarDataHora(dataValor?: string, horarioValor?: string): string {
  if (!dataValor && !horarioValor) return '';

  const raw = dataValor || horarioValor || '';

  // Se for ISO string (ex: "2026-09-08T11:36:24.599Z")
  if (raw.includes('T')) {
    const parsed = parseISOInSaoPaulo(raw);
    if (parsed) {
      if (horarioValor && !horarioValor.includes('T') && /^\d{1,2}:\d{2}/.test(horarioValor)) {
        return `${parsed.data} ${horarioValor.substring(0, 5)}`;
      }
      return `${parsed.data} ${parsed.hora}`;
    }
  }

  // Se horarioValor for ISO
  if (horarioValor && horarioValor.includes('T')) {
    const parsedTime = parseISOInSaoPaulo(horarioValor);
    if (parsedTime) {
      const dataStr = formatarDataApenas(dataValor);
      return dataStr ? `${dataStr} ${parsedTime.hora}` : parsedTime.hora;
    }
  }

  // Se vier no formato AAAA-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    const [ano, mes, dia] = raw.substring(0, 10).split('-');
    const dataFormatada = `${dia}/${mes}/${ano}`;

    let horaFormatada = '';
    const timeSource = (horarioValor && horarioValor !== dataValor) ? horarioValor : '';
    if (timeSource.includes('T')) {
      const p = parseISOInSaoPaulo(timeSource);
      if (p) horaFormatada = p.hora;
    } else if (/^\d{1,2}:\d{2}/.test(timeSource)) {
      horaFormatada = timeSource.substring(0, 5);
    }

    return horaFormatada ? `${dataFormatada} ${horaFormatada}` : dataFormatada;
  }

  // Se já for DD/MM/AAAA
  if (/^\d{2}\/\d{2}\/\d{4}/.test(raw)) {
    const dataFormatada = raw.substring(0, 10);
    let horaFormatada = '';
    const timeSource = (horarioValor && horarioValor !== dataValor) ? horarioValor : '';
    if (timeSource.includes('T')) {
      const p = parseISOInSaoPaulo(timeSource);
      if (p) horaFormatada = p.hora;
    } else if (/^\d{1,2}:\d{2}/.test(timeSource)) {
      horaFormatada = timeSource.substring(0, 5);
    }

    return horaFormatada ? `${dataFormatada} ${horaFormatada}` : dataFormatada;
  }

  // Se dataValor e horarioValor forem idênticos, não duplica
  if (dataValor && horarioValor && dataValor === horarioValor) {
    return dataValor;
  }

  if (dataValor && horarioValor) {
    return `${dataValor} ${horarioValor}`;
  }

  return raw;
}

export function formatarHoraApenas(horarioValor?: string): string {
  if (!horarioValor) return '';
  if (horarioValor.includes('T')) {
    const parsed = parseISOInSaoPaulo(horarioValor);
    if (parsed) return parsed.hora;
    return horarioValor.split('T')[1].substring(0, 5);
  }
  if (/^\d{1,2}:\d{2}/.test(horarioValor)) {
    return horarioValor.substring(0, 5);
  }
  return horarioValor;
}

export function formatarDataApenas(dataValor?: string): string {
  if (!dataValor) return '';
  if (dataValor.includes('T')) {
    const parsed = parseISOInSaoPaulo(dataValor);
    if (parsed) return parsed.data;
    const datePart = dataValor.split('T')[0];
    const [ano, mes, dia] = datePart.split('-');
    if (dia && mes && ano) return `${dia}/${mes}/${ano}`;
    return datePart;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(dataValor)) {
    const [ano, mes, dia] = dataValor.split('-');
    return `${dia}/${mes}/${ano}`;
  }
  return dataValor;
}
