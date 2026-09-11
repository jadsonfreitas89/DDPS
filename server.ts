import express, { Request, Response } from 'express';
import path from 'path';
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
        console.warn('[Backend Proxy] Resposta do Apps Script não é JSON:', text.substring(0, 300));
        return res.status(502).json({
          sucesso: false,
          erro: 'Resposta não formatada do Apps Script: ' + text.substring(0, 100)
        });
      }

      return res.json(parsed);
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
