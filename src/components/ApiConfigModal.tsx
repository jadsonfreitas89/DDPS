import React, { useState } from 'react';
import { X, CheckCircle, AlertCircle, Link2, RefreshCw, Database, Code2, Copy, Check } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { getConfiguredScriptUrl, setApiUrlOverride, api } from '../services/api';

interface ApiConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved: () => void;
}

export const ApiConfigModal: React.FC<ApiConfigModalProps> = ({
  isOpen,
  onClose,
  onConfigSaved
}) => {
  const [url, setUrl] = useState(getConfiguredScriptUrl());
  const [isTesting, setIsTesting] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleCopyCode = async () => {
    try {
      const response = await fetch('/Code.gs');
      let scriptContent = '';
      if (response.ok) {
        scriptContent = await response.text();
      } else {
        scriptContent = '// Veja o arquivo Code.gs no diretório raiz do projeto';
      }
      await navigator.clipboard.writeText(scriptContent);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    } catch {
      setCopiedCode(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      setApiUrlOverride(url);
      const [status, funcs] = await Promise.all([
        api.getStatus(),
        api.getFuncionarios()
      ]);
      
      const count = funcs ? funcs.length : 0;
      setTestResult({
        success: true,
        message: `Conexão bem-sucedida! Semana: ${status.semana} • ${count} colaboradores ativos carregados da planilha em tempo real.`
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `Falha na conexão: ${err.message || 'Verifique se a URL do Apps Script está correta e implantada como Web App acessível.'}`
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    setApiUrlOverride(url);
    onConfigSaved();
    onClose();
  };

  const isConfigured = Boolean(url.trim());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-lg bg-white border border-gray-200 rounded-3xl p-6 shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto text-[#1A1C1E]">
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-yellow-100 text-yellow-800">
              <Database className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#1A1C1E]">Configuração da API</h3>
              <p className="text-xs text-gray-500">Google Apps Script & Planilha</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-black p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-xs text-gray-700 leading-relaxed">
            <p className="font-bold text-gray-900 mb-1">🔗 Backend Oficial:</p>
            O DDPS consome os dados via <span className="font-mono font-bold text-gray-900 bg-gray-200 px-1 py-0.5 rounded">VITE_DDPS_API_URL</span>. Quando configurado, todas as chamadas são sincronizadas diretamente com a sua planilha do Google Sheets.
          </div>

          <Input
            label="URL da API (Google Apps Script Web App)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://script.google.com/macros/s/.../exec"
            leftIcon={<Link2 className="w-5 h-5" />}
            helperText="A URL será injetada por variável de ambiente ou você pode testá-la aqui."
          />

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={handleTestConnection}
              disabled={!url || isTesting}
              leftIcon={<RefreshCw className={`w-4 h-4 ${isTesting ? 'animate-spin' : ''}`} />}
              className="bg-white border-gray-300 text-gray-700"
            >
              {isTesting ? 'Testando...' : 'Testar Conexão'}
            </Button>

            {!isConfigured && (
              <span className="text-xs text-yellow-700 font-semibold">
                ● Modo Demonstração Ativo
              </span>
            )}
          </div>

          {testResult && (
            <div
              className={`p-3.5 rounded-2xl border flex items-start gap-2.5 text-xs sm:text-sm font-medium ${
                testResult.success
                  ? 'bg-green-50 border-green-200 text-green-900'
                  : 'bg-red-50 border-red-200 text-red-900'
              }`}
            >
              {testResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}

          {/* Seção do Script Google Apps Script com função atualizarAbaDDPS */}
          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                <Code2 className="w-4 h-4 text-amber-700" />
                Google Apps Script (Code.gs)
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition-colors shadow-2xs"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copiar Code.gs
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-amber-900/80 leading-relaxed">
              Inclui a função oficial <code className="font-mono font-bold bg-amber-100 px-1 py-0.5 rounded text-amber-950">atualizarAbaDDPS(idDDS)</code> que preenche automaticamente as colunas da aba visual semanal <strong>DDPS</strong> (Segunda: C/D, Terça: E/F, Quarta: G/H, etc.) mantendo a formatação e os outros dias protegidos.
            </p>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-3 border-t border-gray-100">
          <Button
            type="button"
            variant="outline"
            size="md"
            fullWidth
            onClick={onClose}
            className="bg-white border-gray-300 text-gray-700"
          >
            Fechar
          </Button>

          <Button
            type="button"
            variant="primary"
            size="md"
            fullWidth
            onClick={handleSave}
          >
            Salvar Configuração
          </Button>
        </div>
      </div>
    </div>
  );
};
