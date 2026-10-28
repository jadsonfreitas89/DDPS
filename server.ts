import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import 'dotenv/config';
import { createServer as createViteServer } from 'vite';

const PORT = 3000;
const DEFAULT_APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbxsdyIsb8o5BakjYKAdNTHsgJYuQsytNqthVAtNNy-5wIoqQqepDLx0hmW9w5ktojTo/exec';

function getTargetUrl(req: Request): string {
  const custom =
    (req.headers['x-target-url'] as string) ||
    (req.query.targetUrl as string) ||
    process.env.DDPS_API_URL ||
    process.env.VITE_DDPS_API_URL;
  return (custom && custom.trim().length > 0 ? custom.trim() : DEFAULT_APPS_SCRIPT_URL);
}

// Mapeamento de emociograma para texto padrão aceito pelo Google Apps Script
function normalizeEmociogramaToText(val: any): string {
  const str = String(val || '').trim().toUpperCase();
  if (str.includes('🙂') || str.includes('😀') || str.includes('BOM') || str.includes('BEM') || str.includes('OTIMO') || str.includes('ÓTIMO') || str === '1') {
    return 'BOM';
  }
  if (str.includes('😐') || str.includes('REGULAR') || str.includes('MEDIO') || str.includes('MÉDIO') || str === '2') {
    return 'REGULAR';
  }
  if (str.includes('🙁') || str.includes('😞') || str.includes('😟') || str.includes('RUIM') || str.includes('MAL') || str.includes('TRISTE') || str === '3') {
    return 'RUIM';
  }
  return 'BOM';
}

// In-memory cache para colaboradores (30 segundos)
let cachedFuncionarios: { data: any; timestamp: number } | null = null;
const CACHE_TTL_MS = 30_000;

// Idempotência para operações de sincronização do aplicativo DDPS (Durável em disco)
const IDEMPOTENCY_FILE = path.resolve(process.cwd(), '.idempotency_store.json');
let idempotencyStore = new Map<string, { response: any; timestamp: number }>();

try {
  if (fs.existsSync(IDEMPOTENCY_FILE)) {
    const raw = fs.readFileSync(IDEMPOTENCY_FILE, 'utf-8');
    const data = JSON.parse(raw);
    if (Array.isArray(data)) {
      for (const item of data) {
        if (item && item.key && item.value) {
          idempotencyStore.set(item.key, item.value);
        }
      }
    }
    console.log(`[Backend Proxy] Carregadas ${idempotencyStore.size} operações idempotentes do armazenamento durável.`);
  }
} catch (err) {
  console.warn('[Backend Proxy] Aviso ao carregar arquivo de idempotência:', err);
}

function saveIdempotencyStore() {
  try {
    const arr = [];
    for (const [key, value] of idempotencyStore.entries()) {
      arr.push({ key, value });
    }
    fs.writeFileSync(IDEMPOTENCY_FILE, JSON.stringify(arr, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[Backend Proxy] Aviso ao salvar arquivo de idempotência:', err);
  }
}

// Controle de concorrência para requisições simultâneas com o mesmo syncOperationId
const activeSyncOperations = new Map<string, Promise<any>>();

async function startServer() {
  const app = express();

  // Parsing de requisições JSON e texto
  app.use(express.json({ limit: '15mb' }));
  app.use(express.text({ limit: '15mb', type: ['text/*', 'application/json'] }));

  // 1. Health check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: Date.now()
    });
  });

  // 2. GET Funcionários
  app.get('/api/funcionarios', async (req: Request, res: Response) => {
    const forceRefresh = req.query.refresh === '1';
    const now = Date.now();

    if (!forceRefresh && cachedFuncionarios && now - cachedFuncionarios.timestamp < CACHE_TTL_MS) {
      return res.json(cachedFuncionarios.data);
    }

    try {
      const targetUrl = getTargetUrl(req);
      const url = `${targetUrl}${targetUrl.includes('?') ? '&' : '?'}action=funcionarios`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);

      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`Google Apps Script respondeu HTTP ${response.status}`);
      }

      const text = await response.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('Formato inválido retornado pelo Google Apps Script');
      }

      cachedFuncionarios = { data, timestamp: now };
      return res.json(data);
    } catch (err: any) {
      console.error('[Backend Proxy] Erro ao buscar funcionarios:', err.message);
      // Se tiver cache expirado, retorna para garantir resiliência no campo
      if (cachedFuncionarios) {
        return res.json(cachedFuncionarios.data);
      }
      return res.status(502).json({
        sucesso: false,
        erro: err.message || 'Erro de comunicação com a planilha do Google Sheets'
      });
    }
  });

  // 3. GET Status
  app.get('/api/status', async (req: Request, res: Response) => {
    try {
      const targetUrl = getTargetUrl(req);
      const url = `${targetUrl}${targetUrl.includes('?') ? '&' : '?'}action=status`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const text = await response.text();
      res.type('application/json').send(text);
    } catch (err: any) {
      console.warn('[Backend Proxy] Erro ao obter status:', err.message);
      res.status(502).json({ sucesso: false, erro: err.message });
    }
  });

  // 4. GET DDS da Semana
  app.get('/api/ddsSemana', async (req: Request, res: Response) => {
    try {
      const targetUrl = getTargetUrl(req);
      const semanaParam = req.query.semana ? `&semana=${encodeURIComponent(String(req.query.semana))}` : '';
      const url = `${targetUrl}${targetUrl.includes('?') ? '&' : '?'}action=ddsSemana${semanaParam}`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const text = await response.text();
      res.type('application/json').send(text);
    } catch (err: any) {
      console.warn('[Backend Proxy] Erro ao obter ddsSemana:', err.message);
      res.status(502).json({ sucesso: false, erro: err.message });
    }
  });

  // 5. GET Participantes de um DDS
  app.get('/api/participantes', async (req: Request, res: Response) => {
    try {
      const targetUrl = getTargetUrl(req);
      const idDDS = req.query.idDDS ? `&idDDS=${encodeURIComponent(String(req.query.idDDS))}` : '';
      const url = `${targetUrl}${targetUrl.includes('?') ? '&' : '?'}action=participantes${idDDS}`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const text = await response.text();
      res.type('application/json').send(text);
    } catch (err: any) {
      console.warn('[Backend Proxy] Erro ao obter participantes:', err.message);
      res.status(502).json({ sucesso: false, erro: err.message });
    }
  });

  // 6. Rota universal de Proxy (GET e POST)
  app.all('/api/ddps', async (req: Request, res: Response) => {
    try {
      const targetUrl = getTargetUrl(req);
      const action = (req.query.action as string) || (req.body && req.body.action) || 'status';

      if (req.method === 'GET') {
        const queryParams = new URLSearchParams(req.query as any);
        queryParams.delete('targetUrl');
        const url = `${targetUrl}${targetUrl.includes('?') ? '&' : '?'}${queryParams.toString()}`;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 12000);

        const response = await fetch(url, {
          method: 'GET',
          signal: controller.signal
        });
        clearTimeout(timeout);

        if (!response.ok) throw new Error(`Apps Script HTTP ${response.status}`);
        const text = await response.text();
        return res.type('application/json').send(text);
      }

      // Requisição POST
      cachedFuncionarios = null; // Invalida cache de funcionários quando há qualquer alteração
      let bodyData = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (!bodyData) bodyData = {};
      if (!bodyData.action && action) bodyData.action = action;
      if (!bodyData.acao && bodyData.action) bodyData.acao = bodyData.action;
      if (!bodyData.action && bodyData.acao) bodyData.action = bodyData.acao;

      // 6.1 Idempotência para operações de sincronização repetidas
      const syncOperationId = String(
        req.headers['x-sync-operation-id'] || bodyData.syncOperationId || ''
      ).trim();

      if (syncOperationId && idempotencyStore.has(syncOperationId)) {
        const cached = idempotencyStore.get(syncOperationId)!;
        console.log(`[Backend Proxy] Retornando resposta idempotente salva para operação: ${syncOperationId}`);
        return res.json(cached.response);
      }

      // Concorrência simultânea: se já há uma execução em andamento para este syncOperationId, aguarda ela
      if (syncOperationId && activeSyncOperations.has(syncOperationId)) {
        console.log(`[Backend Proxy] Requisição simultânea detectada para ${syncOperationId}. Aguardando execução em curso...`);
        try {
          const result = await activeSyncOperations.get(syncOperationId)!;
          return res.json(result);
        } catch (err: any) {
          return res.status(502).json({ sucesso: false, erro: err.message || 'Erro na operação concorrente' });
        }
      }

      const executeOperation = async () => {
        // 6.2 Normalização de ID Offline
        let originalOfflineId: string | null = null;
        if (bodyData.idDDS && typeof bodyData.idDDS === 'string' && bodyData.idDDS.startsWith('DDS-OFFLINE-')) {
          originalOfflineId = bodyData.idDDS;
          bodyData.clientOfflineId = originalOfflineId;
          delete bodyData.idDDS;
        }

        // Normaliza emociograma se houver participantes
        if (bodyData.participantes && Array.isArray(bodyData.participantes)) {
          bodyData.participantes = bodyData.participantes.map((p: any) => ({
            ...p,
            emociograma: normalizeEmociogramaToText(p.emociograma)
          }));
        } else if (bodyData.emociograma) {
          bodyData.emociograma = normalizeEmociogramaToText(bodyData.emociograma);
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 20000);

        const response = await fetch(targetUrl, {
          method: 'POST',
          redirect: 'follow',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8'
          },
          body: JSON.stringify(bodyData),
          signal: controller.signal
        });
        
        let finalResponse = response;
        if (response.status === 302 || response.status === 301) {
          const location = response.headers.get('location');
          if (location) {
            finalResponse = await fetch(location, {
              method: 'GET',
              signal: controller.signal
            });
          }
        }
        clearTimeout(timeout);

        const text = await finalResponse.text();
        let parsed: any;
        try {
          parsed = JSON.parse(text);
        } catch {
          throw new Error('Resposta não formatada do Apps Script: ' + text.substring(0, 100));
        }

        if (originalOfflineId && parsed) {
          parsed.clientOfflineId = originalOfflineId;
        }

        // Salva no cache de idempotência operações com sucesso e persiste em disco
        if (syncOperationId && parsed && (parsed.sucesso !== false && parsed.success !== false)) {
          idempotencyStore.set(syncOperationId, {
            response: parsed,
            timestamp: Date.now()
          });
          
          if (idempotencyStore.size > 200) {
            const cutOff = Date.now() - 24 * 60 * 60 * 1000;
            for (const [key, item] of idempotencyStore.entries()) {
              if (item.timestamp < cutOff) idempotencyStore.delete(key);
            }
          }
          saveIdempotencyStore();
        }

        return parsed;
      };

      if (syncOperationId) {
        const operationPromise = executeOperation();
        activeSyncOperations.set(syncOperationId, operationPromise);
        try {
          const result = await operationPromise;
          activeSyncOperations.delete(syncOperationId);
          return res.json(result);
        } catch (err: any) {
          activeSyncOperations.delete(syncOperationId);
          console.error('[Backend Proxy] Erro na operação sincronizada:', err.message);
          return res.status(502).json({
            sucesso: false,
            erro: err.message || 'Erro no proxy de comunicação com o Google Apps Script'
          });
        }
      } else {
        const result = await executeOperation();
        return res.json(result);
      }

    } catch (err: any) {
      console.error('[Backend Proxy] Erro no /api/ddps:', err.message);
      return res.status(502).json({
        sucesso: false,
        erro: err.message || 'Erro no proxy de comunicação com o Google Apps Script'
      });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
    app.use('*', async (req: Request, res: Response, next) => {
      const url = req.originalUrl;
      try {
        let template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[DDPS Server] Executando em http://0.0.0.0:${PORT}`);
  });
}

startServer();
