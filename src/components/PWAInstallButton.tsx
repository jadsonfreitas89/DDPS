import React, { useState } from 'react';
import { Download, Smartphone, X, Check } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  // If already running in standalone mode (installed), hide the button
  if (isInstalled) {
    return null;
  }

  // Handle click for Android/Windows (Chromium browsers)
  const handleInstallClick = async () => {
    const success = await install();
    if (success) {
      setInstalledSuccess(true);
      setTimeout(() => setInstalledSuccess(false), 3000);
    }
  };

  // Chromium / Android / Desktop (Windows, Chrome, Edge)
  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={handleInstallClick}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-yellow-400 hover:bg-yellow-300 text-black font-bold text-xs shadow-md transition-all active:scale-95 ${className}`}
        title="Instalar aplicativo DDPS no dispositivo"
      >
        {installedSuccess ? (
          <>
            <Check className="w-4 h-4 text-emerald-950" />
            <span>Instalado!</span>
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Instalar DDPS</span>
            <span className="sm:hidden">Instalar</span>
          </>
        )}
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-yellow-400 border border-yellow-400/30 font-semibold text-xs transition-all ${className}`}
          title="Instalar DDPS no iOS"
        >
          <Smartphone className="w-4 h-4" />
          <span>Instalar no iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 text-white">
            <div className="w-full max-w-sm rounded-2xl bg-[#1A1C1E] border border-gray-800 p-6 shadow-2xl relative space-y-4">
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 border-b border-gray-800 pb-3">
                <div className="p-2 rounded-xl bg-yellow-400/10 border border-yellow-400/30 text-yellow-400">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Instalar o DDPS no iOS</h3>
                  <p className="text-xs text-gray-400">iPhone ou iPad (Safari)</p>
                </div>
              </div>

              <ol className="space-y-3 text-xs text-gray-300 list-decimal list-inside leading-relaxed">
                <li className="p-2 rounded-lg bg-gray-900 border border-gray-800">
                  Toque no ícone de <strong className="text-yellow-400">Compartilhar</strong> (quadrado com seta para cima) na barra do Safari.
                </li>
                <li className="p-2 rounded-lg bg-gray-900 border border-gray-800">
                  Role a lista de opções e selecione <strong className="text-yellow-400">Adicionar à Tela de Início</strong>.
                </li>
                <li className="p-2 rounded-lg bg-gray-900 border border-gray-800">
                  Confirme clicando em <strong className="text-yellow-400">Adicionar</strong> no canto superior direito.
                </li>
              </ol>

              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black font-bold text-xs uppercase"
              >
                Entendido
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
