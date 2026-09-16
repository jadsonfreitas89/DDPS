import { DDPSStatus, Funcionario, DDS, Participante, Emociograma, Usuario, PerfilUsuario } from '../types';
import { sanitizeMotivoAusencia } from '../utils/absenceUtils';

const TIMEOUT_MS = 60000;
const AUTH_TOKEN_KEY = 'ddps_auth_token';

export function getStoredAuthToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setStoredAuthToken(token: string | null): void {
  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  }
}

export const DEFAULT_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbxsdyIsb8o5BakjYKAdNTHsgJYuQsytNqthVAtNNy-5wIoqQqepDLx0hmW9w5ktojTo/exec';

// Retorna a URL configurada pelo usuário ou a padrão
export function getConfiguredScriptUrl(): string {
  const localUrl = localStorage.getItem('ddps_api_url_override');

  if (localUrl && localUrl.trim().length > 0) {
    return localUrl.trim();
  }

  const envUrl = import.meta.env.VITE_DDPS_API_URL;

  if (envUrl && envUrl.trim().length > 0) {
    return envUrl.trim();
  }

  return DEFAULT_SCRIPT_URL;
}

// URL usada pelo aplicativo.
// Em produção, /api/ddps funciona como proxy para o Apps Script.
export function getApiBaseUrl(): string {
  return '/api/ddps';
}

export function setApiUrlOverride(url: string): void {
  if (!url || !url.trim()) {
    localStorage.removeItem('ddps_api_url_override');
  } else {
    localStorage.setItem('ddps_api_url_override', url.trim());
  }
}

// ============================================================
// EMOCIOGRAMA
// ============================================================

export function normalizeEmociogramaToText(
  val: string
): 'BOM' | 'REGULAR' | 'RUIM' {
  const v = String(val || '').trim().toUpperCase();

  if (
    v.includes('🙂') ||
    v.includes('😀') ||
    v.includes('BOM') ||
    v.includes('BEM') ||
    v.includes('ÓTIMO') ||
    v.includes('OTIMO') ||
    v === '1'
  ) {
    return 'BOM';
  }

  if (
    v.includes('😐') ||
    v.includes('REGULAR') ||
    v.includes('MEDIO') ||
    v.includes('MÉDIO') ||
    v === '2'
  ) {
    return 'REGULAR';
  }

  if (
    v.includes('🙁') ||
    v.includes('😞') ||
    v.includes('😟') ||
    v.includes('RUIM') ||
    v.includes('MAL') ||
    v.includes('TRISTE') ||
    v === '3'
  ) {
    return 'RUIM';
  }

  return 'BOM';
}

export function normalizeEmociogramaToEmoji(
  val: string
): '🙂' | '😐' | '🙁' {

  const v = String(val || '').trim().toUpperCase();

  if (
    v.includes('🙂') ||
    v.includes('BOM') ||
    v.includes('BEM') ||
    v.includes('ÓTIMO') ||
    v.includes('OTIMO') ||
    v === '1'
  ) {
    return '🙂';
  }

  if (
    v.includes('😐') ||
    v.includes('REGULAR') ||
    v.includes('MEDIO') ||
    v.includes('MÉDIO') ||
    v === '2'
  ) {
    return '😐';
  }

  if (
    v.includes('🙁') ||
    v.includes('RUIM') ||
    v.includes('MAL') ||
    v.includes('TRISTE') ||
    v === '3'
  ) {
    return '🙁';
  }

  return '🙂';
}

export function normalizeEmojiToEmociograma(
  val: string
): Emociograma {

  const v = String(val || '').trim();

  if (
    v.includes('🙂') ||
    v.toUpperCase().includes('BOM')
  ) {
    return 'BOM';
  }

  if (
    v.includes('😐') ||
    v.toUpperCase().includes('REGULAR')
  ) {
    return 'REGULAR';
  }

  if (
    v.includes('🙁') ||
    v.toUpperCase().includes('RUIM')
  ) {
    return 'RUIM';
  }

  return 'BOM';
}

// ============================================================
// STATUS LOCAL
// ============================================================

function getFallbackStatus(): DDPSStatus {

  const agora = new Date();

  const dias = [
    'Domingo',
    'Segunda-feira',
    'Terça-feira',
    'Quarta-feira',
    'Quinta-feira',
    'Sexta-feira',
    'Sábado'
  ];

  const diaSemanaNumero = agora.getDay();
  const diaSemana = dias[diaSemanaNumero];

  const d = new Date(
    Date.UTC(
      agora.getFullYear(),
      agora.getMonth(),
      agora.getDate()
    )
  );

  const dayNum = d.getUTCDay() || 7;

  d.setUTCDate(
    d.getUTCDate() + 4 - dayNum
  );

  const yearStart = new Date(
    Date.UTC(
      d.getUTCFullYear(),
      0,
      1
    )
  );

  const weekNo = Math.ceil(
    (
      (
        (d.getTime() - yearStart.getTime()) /
        86400000
      ) + 1
    ) / 7
  );

  const dia = String(
    agora.getDate()
  ).padStart(2, '0');

  const mes = String(
    agora.getMonth() + 1
  ).padStart(2, '0');

  const ano = agora.getFullYear();

  const hora = String(
    agora.getHours()
  ).padStart(2, '0');

  const min = String(
    agora.getMinutes()
  ).padStart(2, '0');

  return {
    semana: weekNo,
    data: `${dia}/${mes}/${ano}`,
    horario: `${hora}:${min}`,
    dataHora: `${ano}-${mes}-${dia} ${hora}:${min}`,
    diaSemana,
    diaSemanaNumero,
    timestamp: agora.getTime(),
    responsavelPadrao: 'Engenharia / SESMT'
  };
}

// ============================================================
// STORAGE LOCAL
// ============================================================

export class LocalDDSStorage {

  private static STORAGE_KEY =
    'ddps_local_state_v2';

  private static FUNC_CACHE_KEY =
    'ddps_cached_funcionarios_v1';

  private static getState() {

    try {

      const raw =
        localStorage.getItem(
          this.STORAGE_KEY
        );

      if (raw) {
        return JSON.parse(raw);
      }

    } catch {
      // Ignora erro de parse
    }

    return {
      ddsList: [] as DDS[],
      participantesMap:
        {} as Record<string, Participante[]>
    };
  }

  private static saveState(
    state: any
  ) {

    try {

      localStorage.setItem(
        this.STORAGE_KEY,
        JSON.stringify(state)
      );

    } catch {
      // Storage cheio ou desabilitado
    }
  }

  static getDDSList(): DDS[] {
    return this.getState().ddsList;
  }

  static saveDDS(dds: DDS): void {

    const state =
      this.getState();

    const index =
      state.ddsList.findIndex(
        (item: DDS) =>
          item.idDDS === dds.idDDS
      );

    if (index >= 0) {

      state.ddsList[index] = {
        ...state.ddsList[index],
        ...dds
      };

    } else {

      state.ddsList.push(dds);
    }

    this.saveState(state);
  }

  static saveParticipantes(
    idDDS: string,
    parts: Participante[]
  ): void {

    const state =
      this.getState();

    state.participantesMap[idDDS] =
      parts;

    const dds =
      state.ddsList.find(
        (d: DDS) =>
          d.idDDS === idDDS
      );

    if (dds) {

      dds.participantesQtd =
        parts.length;

      dds.participantes =
        parts;
    }

    this.saveState(state);
  }

  static getParticipantes(
    idDDS: string
  ): Participante[] {

    const state =
      this.getState();

    return (
      state.participantesMap[idDDS] ||
      []
    );
  }

  static deletarDDSLocal(idDDS: string): void {
    const state = this.getState();
    state.ddsList = state.ddsList.filter((item: DDS) => item.idDDS !== idDDS);
    if (state.participantesMap && state.participantesMap[idDDS]) {
      delete state.participantesMap[idDDS];
    }
    this.saveState(state);
  }

  static saveCachedFuncionarios(
    list: Funcionario[]
  ): void {

    try {

      if (
        list &&
        list.length > 0
      ) {

        localStorage.setItem(
          this.FUNC_CACHE_KEY,
          JSON.stringify(list)
        );
      }

    } catch {
      // Ignora
    }
  }

  static getCachedFuncionarios():
    Funcionario[] | null {

    try {

      const raw =
        localStorage.getItem(
          this.FUNC_CACHE_KEY
        );

      if (raw) {

        const parsed =
          JSON.parse(raw);

        if (
          Array.isArray(parsed) &&
          parsed.length > 0
        ) {

          return parsed;
        }
      }

    } catch {
      // Ignora
    }

    return null;
  }

  static getLocalFuncionarios(): Funcionario[] {
    const cached = this.getCachedFuncionarios();
    if (cached && cached.length > 0) {
      return cached;
    }
    const defaults: Funcionario[] = [
      { id: 'FUNC-001', idFuncionario: 'FUNC-001', nome: 'João da Silva', ativo: true, cargo: 'Eletricista' },
      { id: 'FUNC-002', idFuncionario: 'FUNC-002', nome: 'Maria Santos', ativo: true, cargo: 'Técnica de Segurança' },
      { id: 'FUNC-003', idFuncionario: 'FUNC-003', nome: 'Carlos Souza', ativo: true, cargo: 'Engenheiro' }
    ];
    this.saveCachedFuncionarios(defaults);
    return defaults;
  }

  static cadastrarFuncionarioLocal(nome: string, cargo: string = ''): Funcionario {
    const list = this.getLocalFuncionarios();
    const trimmedNome = nome.trim();
    const exists = list.some(f => f.nome.trim().toLowerCase() === trimmedNome.toLowerCase());
    if (exists) {
      throw new Error(`Funcionário já cadastrado com o nome: ${trimmedNome}`);
    }

    let maxNum = 0;
    list.forEach(f => {
      const idStr = f.idFuncionario || f.id || '';
      const match = idStr.match(/^FUNC-(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });

    const newId = `FUNC-${String(maxNum + 1).padStart(3, '0')}`;
    const novoFunc: Funcionario = {
      id: newId,
      idFuncionario: newId,
      nome: trimmedNome,
      cargo: cargo,
      funcao: cargo,
      ativo: true
    };

    list.push(novoFunc);
    this.saveCachedFuncionarios(list);
    return novoFunc;
  }

  static atualizarFuncionarioLocal(idFuncionario: string, nome: string, cargo: string = ''): Funcionario {
    const list = this.getLocalFuncionarios();
    const index = list.findIndex(f => (f.idFuncionario || f.id) === idFuncionario);
    if (index < 0) {
      throw new Error('Funcionário não encontrado.');
    }
    list[index].nome = nome.trim();
    list[index].cargo = cargo.trim();
    list[index].funcao = cargo.trim();
    this.saveCachedFuncionarios(list);
    return list[index];
  }

  static alterarStatusFuncionarioLocal(idFuncionario: string, ativo: boolean): Funcionario {
    const list = this.getLocalFuncionarios();
    const index = list.findIndex(f => (f.idFuncionario || f.id) === idFuncionario);
    if (index < 0) {
      throw new Error('Funcionário não encontrado.');
    }
    list[index].ativo = ativo;
    this.saveCachedFuncionarios(list);
    return list[index];
  }

  static excluirFuncionarioLocal(idFuncionario: string): { sucesso: boolean; inativadoLogicamente?: boolean; mensagem: string } {
    const list = this.getLocalFuncionarios();
    const index = list.findIndex(f => (f.idFuncionario || f.id) === idFuncionario);
    if (index < 0) {
      throw new Error('Funcionário não encontrado.');
    }

    const state = this.getState();
    let used = false;
    const participantsMap = state.participantesMap || {};
    Object.values(participantsMap).forEach((parts: any) => {
      if (Array.isArray(parts)) {
        if (parts.some((p: any) => p.idFuncionario === idFuncionario)) {
          used = true;
        }
      }
    });

    state.ddsList.forEach((d: DDS) => {
      if (d.participantes && Array.isArray(d.participantes)) {
        if (d.participantes.some((p: Participante) => p.idFuncionario === idFuncionario)) {
          used = true;
        }
      }
    });

    if (used) {
      list[index].ativo = false;
      this.saveCachedFuncionarios(list);
      return {
        sucesso: true,
        inativadoLogicamente: true,
        mensagem: 'Funcionário possui histórico em DDS. Foi inativado para preservar o histórico.'
      };
    } else {
      list.splice(index, 1);
      this.saveCachedFuncionarios(list);
      return {
        sucesso: true,
        mensagem: 'Funcionário excluído com sucesso.'
      };
    }
  }
}

// ============================================================
// GET
// ============================================================

async function fetchWithFallback(
  action: string,
  params?: Record<
    string,
    string | number
  >
): Promise<Response> {

  const targetScript =
    getConfiguredScriptUrl();

  const searchParams =
    new URLSearchParams();

  searchParams.set(
    'action',
    action
  );

  const token = getStoredAuthToken();
  if (token) {
    searchParams.set('token', token);
  }

  if (params) {

    for (
      const [k, v]
      of Object.entries(params)
    ) {

      if (
        v !== undefined &&
        v !== null
      ) {

        searchParams.set(
          k,
          String(v)
        );
      }
    }
  }

  // ==========================================================
  // 1. PROXY
  // ==========================================================

  const proxyParams =
    new URLSearchParams(
      searchParams
    );

  if (
    targetScript &&
    targetScript !== DEFAULT_SCRIPT_URL
  ) {

    proxyParams.set(
      'targetUrl',
      targetScript
    );
  }

  const proxyUrl =
    `/api/ddps?${proxyParams.toString()}`;

  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const attemptRes = await fetch(proxyUrl, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Verificação universal para página de warmup (que pode vir com status 200, 502 ou 503)
      const clone = attemptRes.clone();
      try {
        const txt = await clone.text();
        if (
          txt.includes('Starting Server...') ||
          txt.includes('Please wait while your application starts...') ||
          (txt.includes('<!doctype html>') && txt.includes('logo_ai_studio_color'))
        ) {
          console.warn(`[DDPS API] Servidor em inicialização no GET. Tentando novamente em 2s (Tentativa ${attempts + 1}/${maxAttempts})...`);
          attempts++;
          await new Promise(r => setTimeout(r, 2000));
          continue;
        }
      } catch (_) {}

      if (attemptRes.ok) {
        return attemptRes;
      }
      break;
    } catch (proxyErr) {
      console.warn('[DDPS API] Tentativa de Proxy GET falhou:', proxyErr);
      attempts++;
      if (attempts < maxAttempts) {
        await new Promise(r => setTimeout(r, 2000));
      }
    }
  }

  // ==========================================================
  // 2. ACESSO DIRETO
  // ==========================================================

  const directUrl =
    `${targetScript}${
      targetScript.includes('?')
        ? '&'
        : '?'
    }${searchParams.toString()}`;

  const directController =
    new AbortController();

  const directTimeout =
    setTimeout(
      () =>
        directController.abort(),
      TIMEOUT_MS
    );

  const directRes =
    await fetch(
      directUrl,
      {
        method: 'GET',
        headers: {
          Accept:
            'application/json'
        },
        signal:
          directController.signal
      }
    );

  clearTimeout(
    directTimeout
  );

  return directRes;
}

// Cache em memória para funcionários
let funcionariosCache: {
  timestamp: number;
  incluirInativos: boolean;
  data: Funcionario[];
} | null = null;

export function invalidateFuncionariosCache() {
  funcionariosCache = null;
}

// ============================================================
// POST
// ============================================================

async function postWithFallback(
  bodyData: any
): Promise<Response> {

  const actionName = bodyData.action || bodyData.acao || 'desconhecido';
  const tStart = performance.now();
  console.log(`[DDPS PERF LOG] INÍCIO REQUEST POST (${actionName})`);

  const targetScript =
    getConfiguredScriptUrl();

  const token = getStoredAuthToken();

  const payload = {
    token: bodyData.token || token,
    ...bodyData,
    action: bodyData.action || bodyData.acao,
    acao: bodyData.acao || bodyData.action
  };

  // ==========================================================
  // 1. PROXY
  // ==========================================================

  let proxyUrl =
    '/api/ddps';

  if (
    targetScript &&
    targetScript !== DEFAULT_SCRIPT_URL
  ) {

    proxyUrl =
      `/api/ddps?targetUrl=${
        encodeURIComponent(
          targetScript
        )
      }`;
  }

  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const attemptRes = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Verificação universal para página de warmup (que pode vir com status 200, 502 ou 503)
      const clone = attemptRes.clone();
      try {
        const txt = await clone.text();
        if (
          txt.includes('Starting Server...') ||
          txt.includes('Please wait while your application starts...') ||
          (txt.includes('<!doctype html>') && txt.includes('logo_ai_studio_color'))
        ) {
          console.warn(`[DDPS API] Servidor em inicialização no POST. Tentando novamente em 2s (Tentativa ${attempts + 1}/${maxAttempts})...`);
          attempts++;
          await new Promise(r => setTimeout(r, 2000));
          continue;
        }
      } catch (_) {}

      if (attemptRes.ok) {
        const tEnd = performance.now();
        console.log(`[DDPS PERF LOG] RESPONSE RECEBIDA (${actionName}) -> TEMPO TOTAL: ${(tEnd - tStart).toFixed(0)} ms`);
        return attemptRes;
      }

      console.warn('[DDPS API] Proxy POST retornou HTTP:', attemptRes.status);
      break;
    } catch (proxyErr) {
      console.warn('[DDPS API] Tentativa de Proxy POST falhou:', proxyErr);
      attempts++;
      if (attempts < maxAttempts) {
        await new Promise(r => setTimeout(r, 2000));
      }
    }
  }

  // ==========================================================
  // 2. ACESSO DIRETO AO GOOGLE APPS SCRIPT
  // ==========================================================

  const directController =
    new AbortController();

  const directTimeout =
    setTimeout(
      () =>
        directController.abort(),
      TIMEOUT_MS
    );

  const directRes =
    await fetch(
      targetScript,
      {
        method: 'POST',
        redirect: 'follow',
        headers: {
          'Content-Type':
            'text/plain;charset=utf-8',
          Accept:
            'application/json'
        },
        body:
          JSON.stringify(payload),
        signal:
          directController.signal
      }
    );

  clearTimeout(
    directTimeout
  );

  if (directRes.status === 302 || directRes.status === 301) {
    const location = directRes.headers.get('location');
    if (location) {
      return await fetch(location, {
        method: 'GET',
        headers: {
          Accept: 'application/json'
        }
      });
    }
  }

  return directRes;
}

// ============================================================
// API
// ============================================================

export const api = {

  // ==========================================================
  // 0. AUTENTICAÇÃO E USUÁRIOS
  // ==========================================================

  async login(usuario: string, senha?: string): Promise<{ sucesso: boolean; primeiroAcesso?: boolean; usuario?: Usuario; token?: string; mensagem?: string }> {
    try {
      const response = await postWithFallback({
        acao: 'login',
        usuario,
        senha: senha || ''
      });
      const data = await response.json();
      if (data.sucesso && data.token) {
        setStoredAuthToken(data.token);
      }
      return data;
    } catch (err: any) {
      console.error('[DDPS API] Erro ao realizar login:', err);
      return { sucesso: false, mensagem: err.message || 'Erro de comunicação ao realizar login.' };
    }
  },

  async definirPrimeiraSenha(usuario: string, novaSenha: string): Promise<{ sucesso: boolean; primeiroAcesso?: boolean; usuario?: Usuario; token?: string; mensagem?: string }> {
    try {
      const response = await postWithFallback({
        acao: 'definirPrimeiraSenha',
        usuario,
        novaSenha
      });
      const data = await response.json();
      if (data.sucesso && data.token) {
        setStoredAuthToken(data.token);
      }
      return data;
    } catch (err: any) {
      console.error('[DDPS API] Erro ao definir senha:', err);
      return { sucesso: false, mensagem: err.message || 'Erro de comunicação ao definir senha.' };
    }
  },

  async logout(): Promise<void> {
    try {
      const token = getStoredAuthToken();
      if (token) {
        await postWithFallback({ acao: 'logout', token });
      }
    } catch (err) {
      console.warn('[DDPS API] Erro no logout:', err);
    } finally {
      setStoredAuthToken(null);
    }
  },

  async validarSessao(): Promise<{ sucesso: boolean; usuario?: Usuario; mensagem?: string }> {
    const token = getStoredAuthToken();
    if (!token) {
      return { sucesso: false, mensagem: 'Sem token armazenado.' };
    }
    try {
      const response = await postWithFallback({ acao: 'validarSessao', token });
      const data = await response.json();
      if (!data.sucesso) {
        setStoredAuthToken(null);
      }
      return data;
    } catch (err: any) {
      console.warn('[DDPS API] Erro ao validar sessão:', err);
      return { sucesso: false, mensagem: 'Erro de comunicação ao validar sessão.' };
    }
  },

  async listarUsuarios(): Promise<Usuario[]> {
    try {
      const response = await postWithFallback({ acao: 'listarUsuarios' });
      const data = await response.json();
      if (Array.isArray(data)) return data;
      if (data.dados && Array.isArray(data.dados)) return data.dados;
      if (data.usuarios && Array.isArray(data.usuarios)) return data.usuarios;
      return [];
    } catch (err) {
      console.error('[DDPS API] Erro ao listar usuários:', err);
      throw err;
    }
  },

  async cadastrarUsuario(dados: { usuario: string; nome: string; perfil: PerfilUsuario }): Promise<{ sucesso: boolean; idUsuario?: string; mensagem?: string }> {
    const response = await postWithFallback({ acao: 'cadastrarUsuario', ...dados });
    return await response.json();
  },

  async editarUsuario(dados: { idUsuario: string; nome?: string; perfil?: PerfilUsuario; ativo?: boolean }): Promise<{ sucesso: boolean; mensagem?: string }> {
    const response = await postWithFallback({ acao: 'editarUsuario', ...dados });
    return await response.json();
  },

  async redefinirSenhaUsuario(dados: { idUsuario: string }): Promise<{ sucesso: boolean; credencialTemporaria?: string; mensagem?: string }> {
    const response = await postWithFallback({ acao: 'redefinirSenhaUsuario', ...dados });
    return await response.json();
  },

  async solicitarRecuperacaoSenha(usuario: string): Promise<{ sucesso: boolean; credencialTemporaria?: string; mensagem?: string }> {
    const response = await postWithFallback({ acao: 'solicitarRecuperacaoSenha', usuario });
    return await response.json();
  },

  async alterarMinhaSenha(dados: { senhaAtual: string; novaSenha: string }): Promise<{ sucesso: boolean; mensagem?: string }> {
    const response = await postWithFallback({ acao: 'alterarMinhaSenha', ...dados });
    return await response.json();
  },

  async salvarRascunhoDDS(rascunho: string): Promise<{ sucesso: boolean; mensagem?: string }> {
    const response = await postWithFallback({ acao: 'salvarRascunhoDDS', rascunho });
    return await response.json();
  },

  async obterRascunhoDDS(): Promise<{ sucesso: boolean; rascunho?: string }> {
    try {
      const res = await fetchWithFallback('obterRascunhoDDS');
      if (!res.ok) return { sucesso: false };
      const data = await res.json();
      return data;
    } catch {
      return { sucesso: false };
    }
  },

  // ==========================================================
  // 1. STATUS
  // ==========================================================

  async getStatus():
    Promise<DDPSStatus> {

    try {

      const res =
        await fetchWithFallback(
          'status'
        );

      if (!res.ok) {
        throw new Error(
          `HTTP ${res.status}`
        );
      }

      const text =
        await res.text();

      const data =
        JSON.parse(text);

      const payload =
        data.dados ||
        data.data ||
        data;

      const fallback =
        getFallbackStatus();

      return {

        semana:
          payload.semana ??
          fallback.semana,

        data:
          payload.data ??
          fallback.data,

        horario:
          payload.horario ??
          fallback.horario,

        dataHora:
          payload.dataHora ??
          fallback.dataHora,

        diaSemana:
          payload.diaSemana ??
          fallback.diaSemana,

        diaSemanaNumero:
          payload.diaSemanaNumero ??
          fallback.diaSemanaNumero,

        timestamp:
          payload.timestamp ??
          Date.now(),

        responsavelPadrao:
          payload.responsavelPadrao ||
          payload.responsavel ||
          'Engenharia / SESMT'
      };

    } catch (err) {

      console.warn(
        '[DDPS API] Fallback getStatus acionado:',
        err
      );

      return getFallbackStatus();
    }
  },

  // ==========================================================
  // 2. FUNCIONÁRIOS
  // ==========================================================

  async getFuncionarios(incluirInativos = false, forceRefresh = false):
    Promise<Funcionario[]> {

    if (!forceRefresh && funcionariosCache && funcionariosCache.incluirInativos === incluirInativos && (Date.now() - funcionariosCache.timestamp) < 300000) {
      console.log('[DDPS PERF LOG] Retornando lista de funcionários do CACHE EM MEMÓRIA (0 ms)');
      return funcionariosCache.data;
    }

    try {

      const res =
        await fetchWithFallback(
          'funcionarios'
        );

      if (!res.ok) {

        throw new Error(
          `HTTP ${res.status}`
        );
      }

      const text =
        await res.text();

      let responseData: any;

      try {

        responseData =
          JSON.parse(text);

      } catch {

        throw new Error(
          'Resposta inválida da API'
        );
      }

      let rawList: any[] = [];

      if (
        Array.isArray(
          responseData?.dados
        )
      ) {

        rawList =
          responseData.dados;

      } else if (
        Array.isArray(
          responseData
        )
      ) {

        rawList =
          responseData;

      } else if (
        Array.isArray(
          responseData?.data
        )
      ) {

        rawList =
          responseData.data;

      } else if (
        Array.isArray(
          responseData?.funcionarios
        )
      ) {

        rawList =
          responseData.funcionarios;
      }

      const mappedList:
        Funcionario[] =
        rawList.map(
          (item: any) => {

            const id =
              String(
                item.id ??
                item.idFuncionario ??
                ''
              ).trim();

            const nome =
              String(
                item.nome ?? ''
              ).trim();

            const ativoVal =
              String(
                item?.ativo ?? ''
              )
                .trim()
                .toUpperCase();

            const isAtivo =
              ativoVal === 'SIM' ||
              ativoVal === 'TRUE' ||
              ativoVal === '1' ||
              item?.ativo === true;

            return {

              id,

              idFuncionario:
                id,

              nome,

              ativo:
                isAtivo,

              cargo:
                item.cargo || item.funcao
                  ? String(
                      item.cargo || item.funcao
                    ).trim()
                  : undefined,

              funcao:
                item.funcao || item.cargo
                  ? String(
                      item.funcao || item.cargo
                    ).trim()
                  : undefined,

              setor:
                item.setor
                  ? String(
                      item.setor
                    ).trim()
                  : undefined
            };
          }
        ).filter(f => f.id && f.nome);

      if (
        mappedList.length > 0
      ) {

        LocalDDSStorage
          .saveCachedFuncionarios(
            mappedList
          );
      }

      const resultList = incluirInativos ? mappedList : mappedList.filter(f => f.ativo === true || f.ativo === 'SIM');
      funcionariosCache = {
        timestamp: Date.now(),
        incluirInativos,
        data: resultList
      };
      return resultList;

    } catch (err: any) {

      console.warn(
        '[DDPS API] Usando funcionários locais/cache:',
        err?.message || err
      );

      const localList =
        LocalDDSStorage
          .getLocalFuncionarios();

      const resultLocal = incluirInativos ? localList : localList.filter(f => f.ativo === true || f.ativo === 'SIM');
      funcionariosCache = {
        timestamp: Date.now(),
        incluirInativos,
        data: resultLocal
      };
      return resultLocal;
    }
  },

  async cadastrarFuncionario(nome: string, funcao: string): Promise<any> {
    invalidateFuncionariosCache();
    try {
      const res = await postWithFallback({ action: 'cadastrarFuncionario', nome, funcao, cargo: funcao });
      if (res.ok) {
        const text = await res.text();
        const parsed = JSON.parse(text);
        if (parsed.sucesso) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn('[DDPS API] Fallback local cadastrarFuncionario:', err);
    }
    const created = LocalDDSStorage.cadastrarFuncionarioLocal(nome, funcao);
    return { sucesso: true, ...created };
  },

  async obterFuncionario(idFuncionario: string): Promise<any> {
    try {
      const res = await fetchWithFallback(`funcionarios&idFuncionario=${encodeURIComponent(idFuncionario)}`);
      if (res.ok) {
        const text = await res.text();
        const parsed = JSON.parse(text);
        return parsed;
      }
    } catch (err) {
      console.warn('[DDPS API] Fallback local obterFuncionario:', err);
    }
    const list = LocalDDSStorage.getLocalFuncionarios();
    const found = list.find(f => (f.idFuncionario || f.id) === idFuncionario);
    return { sucesso: true, funcionario: found };
  },

  async editarFuncionario(idFuncionario: string, nome: string, funcao: string): Promise<any> {
    invalidateFuncionariosCache();
    try {
      const res = await postWithFallback({ action: 'editarFuncionario', idFuncionario, nome, funcao, cargo: funcao });
      if (res.ok) {
        const text = await res.text();
        const parsed = JSON.parse(text);
        if (parsed.sucesso) {
          return parsed;
        } else {
          throw new Error(parsed.erro || 'Erro ao editar funcionário.');
        }
      }
    } catch (err: any) {
      console.warn('[DDPS API] Fallback local editarFuncionario:', err);
      const updated = LocalDDSStorage.atualizarFuncionarioLocal(idFuncionario, nome, funcao);
      return { sucesso: true, ...updated };
    }
  },

  async atualizarFuncionario(idFuncionario: string, nome: string, funcao: string): Promise<any> {
    return this.editarFuncionario(idFuncionario, nome, funcao);
  },

  async alterarStatusFuncionario(idFuncionario: string, ativo: boolean): Promise<any> {
    invalidateFuncionariosCache();
    try {
      const res = await postWithFallback({ action: 'alterarStatusFuncionario', idFuncionario, ativo });
      if (res.ok) {
        const text = await res.text();
        const parsed = JSON.parse(text);
        if (parsed.sucesso) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn('[DDPS API] Fallback local alterarStatusFuncionario:', err);
    }
    const updated = LocalDDSStorage.alterarStatusFuncionarioLocal(idFuncionario, ativo);
    return { sucesso: true, ...updated };
  },

  async excluirFuncionario(idFuncionario: string): Promise<any> {
    invalidateFuncionariosCache();
    try {
      const res = await postWithFallback({ action: 'excluirFuncionario', idFuncionario });
      if (res.ok) {
        const text = await res.text();
        const parsed = JSON.parse(text);
        if (parsed.sucesso) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn('[DDPS API] Fallback local excluirFuncionario:', err);
    }
    return LocalDDSStorage.excluirFuncionarioLocal(idFuncionario);
  },

  // ==========================================================
  // 3. DDS DA SEMANA (LEGADO)
  // ==========================================================

  async getDDSSemana(): Promise<DDS[]> {
    return this.listarDDS();
  },

  // ==========================================================
  // 3.1 LISTAR DDS (NOVO PADRÃO POST)
  // ==========================================================

  async listarDDS(): Promise<DDS[]> {
    console.log('[DDPS API] Chamando listarDDS (GET)');
    try {
      const res = await fetchWithFallback('listarDDS');
      
      console.log('[DDPS API] HTTP Status:', res.status);
      const text = await res.text();
      console.log('[DDPS API] Resposta Bruta:', text);
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      
      const data = JSON.parse(text);
      console.log('[DDPS API] JSON interpretado:', data);
      
      if (!data.sucesso || !Array.isArray(data.dds)) {
        throw new Error('Formato de resposta inválido');
      }
      
      console.log('[DDPS API] Quantidade de DDS recebidos:', data.dds.length);
      
      const baseDDSList: DDS[] = data.dds.map((item: any) => ({
        idDDS: String(item.idDDS || ''),
        semana: item.semanaId || '',
        diaSemana: item.diaSemana || '',
        data: item.data || '',
        horario: item.horario || '',
        tema: item.tema || '',
        conteudo: item.conteudo || '',
        local: item.local || '',
        responsavel: item.responsavel || '',
        observacoes: item.observacoes || '',
        status: (item.status || 'pendente').toLowerCase() as any,
        participantesQtd: Array.isArray(item.participantes)
          ? item.participantes.length
          : (typeof item.participantesQtd === 'number'
            ? item.participantesQtd
            : (LocalDDSStorage.getParticipantes(String(item.idDDS || '')).length || 0))
      }));

      // Carrega a contagem de participantes de cada DDS registrado
      const enrichedList = await Promise.all(
        baseDDSList.map(async (dds) => {
          if (!dds.idDDS) return dds;
          try {
            const parts = await this.getParticipantes(dds.idDDS);
            if (Array.isArray(parts)) {
              return {
                ...dds,
                participantes: parts,
                participantesQtd: parts.length
              };
            }
          } catch (pErr) {
            console.warn(`[DDPS API] Falha ao enriquecer participantes para ${dds.idDDS}:`, pErr);
          }
          return dds;
        })
      );

      return enrichedList;
    } catch (err) {
      console.error('[DDPS API] Erro ao listar DDS:', err);
      return LocalDDSStorage.getDDSList();
    }
  },


  // ==========================================================
  // 4. PARTICIPANTES
  // ==========================================================

  async getParticipantes(
    idDDS: string
  ): Promise<Participante[]> {

    console.log('[DDPS API] Chamando getParticipantes (GET) para:', idDDS);

    try {
      const res = await fetchWithFallback('participantes', { idDDS });

      if (!res.ok) {

        throw new Error(
          `HTTP ${res.status}`
        );
      }

      const text =
        await res.text();

      const data =
        JSON.parse(text);

      let list: any[] = [];

      if (
        Array.isArray(
          data?.dados
        )
      ) {

        list =
          data.dados;

      } else if (
        Array.isArray(data?.participantes)
      ) {
        list = data.participantes;
      } else if (
        Array.isArray(data)
      ) {

        list =
          data;
      }

      return list.map(
        (item: any) => {
          const isAusente =
            item.ausente === true ||
            String(item.ausente || '').trim().toUpperCase() === 'SIM' ||
            String(item.ausente || '').trim().toUpperCase() === 'TRUE';

          return {
            idFuncionario:
              String(
                item.idFuncionario ||
                item.id ||
                ''
              ).trim(),

            nome:
              String(
                item.nome ||
                ''
              ).trim(),

            emociograma: isAusente ? 'BOM' : normalizeEmojiToEmociograma(
              item.emociograma
            ),

            assinatura: isAusente ? '' : String(
              item.assinatura ||
              ''
            ),

            horaAssinatura:
              item.horaAssinatura ||
              item.horarioAssinatura ||
              item.dataHora,

            ausente: isAusente,

            motivoAusencia: isAusente ? sanitizeMotivoAusencia(
              item.motivoAusencia ||
              item.motivo ||
              item.MOTIVO_AUSENCIA ||
              ''
            ) : ''
          };
        }
      );

    } catch (err) {

      console.warn(
        '[DDPS API] Fallback getParticipantes acionado:',
        err
      );

      return LocalDDSStorage
        .getParticipantes(idDDS);
    }
  },

  async getDDSCompleto(
    idDDS: string
  ): Promise<{
    sucesso: boolean;
    dds: DDS;
    participantes: Participante[];
  }> {
    console.log('[DDPS API] Chamando getDDSCompleto para:', idDDS);
    try {
      const res = await fetchWithFallback('obterDDSCompleto', { idDDS });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const text = await res.text();
      const data = JSON.parse(text);
      if (data && data.sucesso) {
        return {
          sucesso: true,
          dds: {
            ...data.dds,
            status: (data.dds.status || 'pendente').toLowerCase() as any,
          },
          participantes: (data.participantes || []).map((item: any) => {
            const isAusente =
              item.ausente === true ||
              String(item.ausente || '').trim().toUpperCase() === 'SIM' ||
              String(item.ausente || '').trim().toUpperCase() === 'TRUE';
            return {
              idFuncionario: String(item.idFuncionario || item.id || '').trim(),
              nome: String(item.nome || '').trim(),
              emociograma: isAusente ? 'BOM' : normalizeEmojiToEmociograma(item.emociograma),
              assinatura: isAusente ? '' : String(item.assinatura || ''),
              horaAssinatura: item.horaAssinatura || item.horarioAssinatura || item.dataHora,
              ausente: isAusente,
              motivoAusencia: isAusente ? sanitizeMotivoAusencia(
                item.motivoAusencia || item.motivo || item.MOTIVO_AUSENCIA || ''
              ) : ''
            };
          })
        };
      }
      throw new Error(data?.erro || 'Erro desconhecido');
    } catch (err) {
      console.warn('[DDPS API] Fallback getDDSCompleto acionado:', err);
      const list = LocalDDSStorage.getDDSList();
      const localDDS = list.find((d) => d.idDDS === idDDS);
      if (!localDDS) {
        throw new Error(`DDS ${idDDS} não encontrado localmente.`);
      }
      const parts = LocalDDSStorage.getParticipantes(idDDS);
      return {
        sucesso: true,
        dds: localDDS,
        participantes: parts
      };
    }
  },

  // ==========================================================
  // 5. CRIAR DDS
  // ==========================================================

  async criarDDS(
    payload: {
      tema: string;
      conteudo: string;
      local: string;
      responsavel: string;
      observacoes?: string;
      encarregadoId?: string;
      encarregadoNome?: string;
      assinaturaEncarregado?: string;
    }
  ): Promise<{
    idDDS: string;
    success: boolean;
  }> {

    const status =
      await this.getStatus();

    const res =
      await postWithFallback({
        acao:
          'criarDDS',
        action:
          'criarDDS',
        ...payload
      });

    if (!res.ok) {
      const erro =
        await res.text();
      throw new Error(
        `HTTP ${res.status}: ${erro}`
      );
    }

    const text =
      await res.text();

    let data: any = {};
    try {
      data =
        JSON.parse(text);
    } catch {
      throw new Error(
        `Resposta inválida do servidor: ${text}`
      );
    }

    if (
      data &&
      (
        data.sucesso === false ||
        data.success === false
      )
    ) {
      throw new Error(
        data.erro ||
        data.mensagem ||
        data.message ||
        'Erro ao criar DDS na planilha.'
      );
    }

    if (
      data &&
      (
        data.mensagem === 'POST recebido com sucesso.' ||
        data.message === 'POST recebido com sucesso.'
      )
    ) {
      throw new Error(
        'Ação criarDDS não foi processada pelo Google Apps Script (retornou rota padrão genérica).'
      );
    }

    const idDDS =
      String(
        data.idDDS ||
        data.id ||
        data.data?.idDDS ||
        data.dados?.idDDS ||
        ''
      ).trim();

    if (!idDDS || idDDS.startsWith('DDS-OFFLINE-')) {
      throw new Error(
        data.erro ||
        data.mensagem ||
        'O servidor não retornou um ID_DDS válido.'
      );
    }

    const novoDDS: DDS = {
      idDDS,
      semana:
        status.semana,
      diaSemana:
        status.diaSemana,
      diaSemanaNumero:
        status.diaSemanaNumero,
      data:
        status.data,
      horario:
        status.horario,
      tema:
        payload.tema,
      conteudo:
        payload.conteudo,
      local:
        payload.local,
      responsavel:
        payload.responsavel,
      observacoes:
        payload.observacoes ||
        '',
      status:
        'pendente',
      participantesQtd:
        0,
      encarregadoId:
        payload.encarregadoId || '',
      encarregadoNome:
        payload.encarregadoNome || '',
      assinaturaEncarregado:
        payload.assinaturaEncarregado || ''
    };

    LocalDDSStorage
      .saveDDS(novoDDS);

    return {
      idDDS,
      success:
        true
    };
  },

  // ==========================================================
  // 5.5 SALVAR DDS COMPLETO (FLUXO CONSOLIDADO EM LOTE - 1 HTTP REQUEST)
  // ==========================================================

  async salvarDDSCompleto(dados: {
    idDDS?: string;
    tema?: string;
    conteudo?: string;
    local?: string;
    responsavel?: string;
    observacoes?: string;
    encarregadoId?: string;
    encarregadoNome?: string;
    assinaturaEncarregado?: string;
    participantes?: Array<{
      idFuncionario: string;
      nome?: string;
      emociograma?: string;
      assinatura?: string;
    }>;
    finalizar?: boolean;
  }): Promise<{
    sucesso: boolean;
    idDDS?: string;
    dds?: any;
    message?: string;
  }> {
    const tInicio = performance.now();
    console.log('[DDPS PERF LOG] INÍCIO API salvarDDSCompleto', dados.idDDS || 'NOVO DDS');

    if (dados.idDDS && dados.participantes) {
      LocalDDSStorage.saveParticipantes(dados.idDDS, dados.participantes as any);
    }

    try {
      const res = await postWithFallback({
        acao: 'salvarDDSCompleto',
        action: 'salvarDDSCompleto',
        ...dados
      });

      const text = await res.text();
      const tFim = performance.now();
      console.log(`[DDPS PERF LOG] RESPONSE salvarDDSCompleto RECEBIDA em ${(tFim - tInicio).toFixed(0)} ms`);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${text}`);
      }

      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`Resposta não JSON recebida do servidor: ${text}`);
      }

      if (data && (data.sucesso === false || data.success === false)) {
        throw new Error(
          data.erro || data.message || data.mensagem || 'O Apps Script informou falha ao salvar DDS Completo.'
        );
      }

      return {
        sucesso: true,
        idDDS: data.idDDS || dados.idDDS,
        dds: data.dds,
        message: data.mensagem || data.message || 'DDS salvo com sucesso.'
      };
    } catch (err: any) {
      console.error('[DDPS API] Erro em salvarDDSCompleto:', err);
      throw err;
    }
  },

  // ==========================================================
  // 6. SALVAR PARTICIPANTES
  // ==========================================================

  async salvarParticipantes(
    idDDS: string,
    participantes: Participante[]
  ): Promise<{
    success: boolean;
    message?: string;
  }> {

    LocalDDSStorage
      .saveParticipantes(
        idDDS,
        participantes
      );

    const payloadParticipantes =
      participantes.map(
        (p) => ({
          idFuncionario:
            p.idFuncionario,
          nome:
            p.nome,
          emociograma:
            p.ausente ? '' : normalizeEmociogramaToText(
              p.emociograma
            ),
          assinatura:
            p.ausente ? '' : (p.assinatura || ''),
          ausente:
            p.ausente ? 'SIM' : 'NAO',
          motivoAusencia:
            p.ausente ? (sanitizeMotivoAusencia(p.motivoAusencia) || 'Atestado') : ''
        })
      );

    try {

      const res =
        await postWithFallback({
          acao:
            'salvarParticipantes',
          action:
            'salvarParticipantes',
          idDDS,
          participantes:
            payloadParticipantes
        });

      const text =
        await res.text();

      if (!res.ok) {
        throw new Error(
          `HTTP ${res.status}: ${text}`
        );
      }

      let data: any = {};
      try {
        data =
          JSON.parse(text);
      } catch {
        throw new Error(
          `Resposta não JSON recebida do servidor: ${text}`
        );
      }

      if (
        data &&
        (
          data.success === false ||
          data.sucesso === false
        )
      ) {
        throw new Error(
          data.erro ||
          data.message ||
          data.mensagem ||
          'O Apps Script informou falha ao salvar participantes.'
        );
      }

      if (
        data &&
        (
          data.mensagem === 'POST recebido com sucesso.' ||
          data.message === 'POST recebido com sucesso.'
        )
      ) {
        throw new Error(
          'Ação salvarParticipantes não foi reconhecida pelo Google Apps Script.'
        );
      }

      return {
        success:
          true,
        message:
          data.message ||
          data.mensagem ||
          'Participantes salvos com sucesso.'
      };

    } catch (err: any) {

      console.error(
        '[DDPS API] Erro ao salvar participantes:',
        err
      );

      return {
        success:
          false,
        message:
          err?.message ||
          'Falha ao salvar participantes no servidor.'
      };
    }
  },

  // ==========================================================
  // 7. SALVAR UM PARTICIPANTE
  // ==========================================================

  async salvarParticipante(
    idDDS: string,
    participante: {
      idFuncionario: string;
      nome: string;
      emociograma: string;
      assinatura: string;
      ausente?: boolean;
      motivoAusencia?: string;
    }
  ): Promise<{
    success: boolean;
    message?: string;
  }> {

    try {

      const isAus = Boolean(participante.ausente);

      const res =
        await postWithFallback({
          acao:
            'salvarParticipante',
          action:
            'salvarParticipante',
          idDDS,
          idFuncionario:
            participante.idFuncionario,
          nome:
            participante.nome,
          emociograma:
            isAus ? '' : normalizeEmociogramaToText(
              participante.emociograma
            ),
          assinatura:
            isAus ? '' : (participante.assinatura || ''),
          ausente:
            isAus ? 'SIM' : 'NAO',
          motivoAusencia:
            isAus ? (sanitizeMotivoAusencia(participante.motivoAusencia) || 'Atestado') : ''
        });

      const text =
        await res.text();

      if (!res.ok) {
        throw new Error(
          `HTTP ${res.status}: ${text}`
        );
      }

      let data: any = {};
      try {
        data =
          JSON.parse(text);
      } catch {
        // Permite resposta textual
      }

      if (
        data &&
        (
          data.success === false ||
          data.sucesso === false
        )
      ) {
        throw new Error(
          data.erro ||
          data.message ||
          data.mensagem ||
          'Falha ao salvar participante.'
        );
      }

      if (
        data &&
        (
          data.mensagem === 'POST recebido com sucesso.' ||
          data.message === 'POST recebido com sucesso.'
        )
      ) {
        throw new Error(
          'Ação salvarParticipante não foi reconhecida pelo Google Apps Script.'
        );
      }

      return {
        success:
          true,
        message:
          data.message ||
          data.mensagem ||
          'Participante salvo com sucesso.'
      };

    } catch (err: any) {

      console.error(
        '[DDPS API] Erro ao salvar participante individual:',
        err
      );

      return {
        success:
          false,
        message:
          err?.message ||
          'Falha ao salvar participante.'
      };
    }
  },

  // ==========================================================
  // 8. ATUALIZAR DDS
  // ==========================================================

  async atualizarDDS(
    payload: {
      idDDS: string;
      tema: string;
      conteudo: string;
      local: string;
      responsavel: string;
      observacoes?: string;
      encarregadoId?: string;
      encarregadoNome?: string;
      assinaturaEncarregado?: string;
    }
  ): Promise<{
    success: boolean;
    message?: string;
  }> {

    const list =
      LocalDDSStorage
        .getDDSList();

    const item =
      list.find(
        (d) =>
          d.idDDS ===
          payload.idDDS
      );

    if (item) {
      // Se alterou o encarregado, invalida a assinatura anterior localmente
      if (payload.encarregadoId !== undefined && item.encarregadoId !== payload.encarregadoId) {
        item.assinaturaEncarregado = payload.assinaturaEncarregado || '';
      } else if (payload.assinaturaEncarregado !== undefined) {
        item.assinaturaEncarregado = payload.assinaturaEncarregado;
      }

      Object.assign(
        item,
        payload
      );
      LocalDDSStorage
        .saveDDS(item);
    }

    try {

      const res =
        await postWithFallback({
          acao:
            'atualizarDDS',
          action:
            'atualizarDDS',
          ...payload
        });

      const text =
        await res.text();

      if (!res.ok) {
        throw new Error(
          `HTTP ${res.status}: ${text}`
        );
      }

      return {
        success:
          true
      };

    } catch (err: any) {

      console.warn(
        '[DDPS API] Erro ao atualizar DDS:',
        err
      );

      return {
        success:
          false,
        message:
          err?.message ||
          'Falha ao atualizar DDS.'
      };
    }
  },

  async buscarAssinaturaEncarregado(idDDS: string): Promise<string> {
    try {
      const res = await fetchWithFallback('buscarAssinaturaEncarregado', { idDDS });
      if (!res.ok) return '';
      const text = await res.text();
      const data = JSON.parse(text);
      if (data && data.sucesso) {
        return String(data.assinatura || data.dados || '');
      }
      return '';
    } catch (err) {
      console.warn('[DDPS API] Erro ao buscar assinatura encarregado:', err);
      const list = LocalDDSStorage.getDDSList();
      const item = list.find((d) => d.idDDS === idDDS);
      return item?.assinaturaEncarregado || '';
    }
  },

  async registrarAssinaturaEncarregado(
    idDDS: string,
    idFuncionario: string,
    assinatura: string
  ): Promise<{
    success: boolean;
    message?: string;
  }> {
    // Salva localmente primeiro para resiliência
    const list = LocalDDSStorage.getDDSList();
    const item = list.find((d) => d.idDDS === idDDS);
    if (item) {
      item.assinaturaEncarregado = assinatura;
      LocalDDSStorage.saveDDS(item);
    }

    try {
      const res = await postWithFallback({
        acao: 'registrarAssinaturaEncarregado',
        action: 'registrarAssinaturaEncarregado',
        idDDS,
        idFuncionario,
        assinatura
      });
      
      const text = await res.text();
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${text}`);
      }

      return {
        success: true
      };
    } catch (err: any) {
      console.warn('[DDPS API] Erro ao salvar assinatura do encarregado:', err);
      return {
        success: false,
        message: err?.message || 'Falha ao registrar assinatura do encarregado.'
      };
    }
  },

  // ==========================================================
  // 9. FINALIZAR DDS
  // ==========================================================

  async finalizarDDS(
    idDDS: string
  ): Promise<{
    success: boolean;
    message?: string;
  }> {
    try {
      const res =
        await postWithFallback({
          acao:
            'finalizarDDS',
          action:
            'finalizarDDS',
          idDDS
        });

      const text =
        await res.text();

      if (!res.ok) {
        throw new Error(
          `HTTP ${res.status}: ${text}`
        );
      }

      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch {
        // Ignora se não for JSON
      }

      if (
        data &&
        (
          data.success === false ||
          data.sucesso === false
        )
      ) {
        throw new Error(
          data.erro ||
          data.message ||
          data.mensagem ||
          'Falha ao finalizar DDS.'
        );
      }

      if (
        data &&
        (
          data.mensagem === 'POST recebido com sucesso.' ||
          data.message === 'POST recebido com sucesso.'
        )
      ) {
        throw new Error(
          'Ação finalizarDDS não foi reconhecida pelo Google Apps Script.'
        );
      }

      const list =
        LocalDDSStorage
          .getDDSList();

      const item =
        list.find(
          (d) =>
            d.idDDS === idDDS
        );

      if (item) {
        item.status =
          'finalizado';
        LocalDDSStorage
          .saveDDS(item);
      }

      return {
        success:
          true,
        message:
          data.message ||
          data.mensagem ||
          'DDS finalizado com sucesso.'
      };

    } catch (err: any) {

      console.warn(
        '[DDPS API] Erro ao finalizar DDS:',
        err
      );

      return {
        success:
          false,
        message:
          err?.message ||
          'Falha ao finalizar DDS.'
      };
    }
  },

  // ==========================================================
  // 9b. DELETAR DDS
  // ==========================================================

  async deletarDDS(
    idDDS: string
  ): Promise<{
    success: boolean;
    message?: string;
  }> {
    try {
      const res =
        await postWithFallback({
          acao:
            'deletarDDS',
          action:
            'deletarDDS',
          idDDS
        });

      const text =
        await res.text();

      if (!res.ok) {
        throw new Error(
          `HTTP ${res.status}: ${text}`
        );
      }

      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch {
        // Ignora se não for JSON
      }

      if (
        data &&
        (
          data.success === false ||
          data.sucesso === false
        )
      ) {
        throw new Error(
          data.erro ||
          data.message ||
          data.mensagem ||
          'Falha ao deletar DDS.'
        );
      }

      if (
        data &&
        (
          data.mensagem === 'POST recebido com sucesso.' ||
          data.message === 'POST recebido com sucesso.'
        )
      ) {
        throw new Error(
          'Ação deletarDDS não foi reconhecida pelo Google Apps Script.'
        );
      }

      // Remove localmente do storage
      LocalDDSStorage.deletarDDSLocal(idDDS);

      return {
        success:
          true,
        message:
          data.message ||
          data.mensagem ||
          'DDS deletado com sucesso.'
      };

    } catch (err: any) {

      console.warn(
        '[DDPS API] Erro ao deletar DDS:',
        err
      );

      return {
        success:
          false,
        message:
          err?.message ||
          'Falha ao deletar DDS.'
      };
    }
  },

  // ==========================================================
  // 10. ATUALIZAR ABA DDPS
  // ==========================================================

  async atualizarAbaDDPS(
    idDDS: string
  ): Promise<{
    success: boolean;
    message?: string;
  }> {

    try {

      const res =
        await postWithFallback({

          action:
            'atualizarAbaDDPS',

          idDDS
        });

      const text =
        await res.text();

      if (!res.ok) {

        throw new Error(
          `HTTP ${res.status}: ${text}`
        );
      }

      try {

        const data =
          JSON.parse(text);

        if (
          data.success === false ||
          data.sucesso === false
        ) {

          throw new Error(
            data.message ||
            data.mensagem ||
            data.erro ||
            'Falha ao atualizar aba DDPS.'
          );
        }

        return {

          success:
            true,

          message:
            data.message ||
            data.mensagem
        };

      } catch (parseError) {

        // Se foi erro criado acima, propaga
        if (
          parseError instanceof Error &&
          (
            parseError.message.includes(
              'Falha ao atualizar'
            )
          )
        ) {

          throw parseError;
        }

        return {
          success:
            true
        };
      }

    } catch (err: any) {

      console.error(
        '[DDPS API] Erro ao atualizar aba DDPS:',
        err
      );

      return {

        success:
          false,

        message:
          err?.message ||
          'Falha ao atualizar aba DDPS.'
      };
    }
  },

  // ==========================================================
  // 11. NOVA SEMANA
  // ==========================================================

  async novaSemana():
    Promise<{
      success: boolean;
      message?: string;
    }> {

    try {

      const res =
        await postWithFallback({

          action:
            'novaSemana'
        });

      const text =
        await res.text();

      if (!res.ok) {

        throw new Error(
          `HTTP ${res.status}: ${text}`
        );
      }

      try {

        const data =
          JSON.parse(text);

        if (
          data.success === false ||
          data.sucesso === false
        ) {

          throw new Error(
            data.message ||
            data.mensagem ||
            data.erro ||
            'Falha ao iniciar nova semana.'
          );
        }

        return {

          success:
            true,

          message:
            data.message ||
            data.mensagem
        };

      } catch (parseError) {

        if (
          parseError instanceof Error &&
          parseError.message.includes(
            'Falha ao iniciar'
          )
        ) {

          throw parseError;
        }

        return {
          success:
            true
        };
      }

    } catch (err: any) {

      console.error(
        '[DDPS API] Erro ao iniciar nova semana:',
        err
      );

      return {

        success:
          false,

        message:
          err?.message ||
          'Falha ao iniciar nova semana.'
      };
    }
  }
};