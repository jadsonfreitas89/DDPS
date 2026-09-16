import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Eraser, Check, X, PenTool, AlertCircle } from 'lucide-react';
import { Button } from './Button';

interface SignaturePadProps {
  funcionarioNome: string;
  initialSignature?: string;
  onConfirm: (signatureBase64: string) => void | Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  funcionarioNome,
  initialSignature,
  onConfirm,
  onCancel,
  isLoading = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  // Configura estilo de caneta real sobre o canvas
  const configureContext = useCallback((ctx: CanvasRenderingContext2D) => {
    const dpr = window.devicePixelRatio || 1;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    // Traço suave e nítido equivalente a caneta ponta média
    ctx.lineWidth = Math.max(3, 3.2 * dpr);
    ctx.strokeStyle = '#111827'; // Tinta escura sólida
  }, []);

  // Inicializa o canvas com suporte a Retina / DPR mantendo a escala visual 1:1
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    // Dimensões visuais em CSS
    const width = Math.floor(rect.width);
    const height = Math.floor(Math.max(rect.height, 220));

    // Se já havia desenho, captura snapshot antes de redimensionar o buffer interno
    let prevDataUrl: string | null = null;
    if (canvas.width > 0 && canvas.height > 0 && hasDrawn) {
      try {
        prevDataUrl = canvas.toDataURL('image/png');
      } catch {
        // Ignora erro de snapshot
      }
    }

    // Ajusta o buffer interno para nitidez sem distorção visual
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    configureContext(ctx);

    // Restaura o desenho anterior ou a assinatura inicial
    const imageToRestore = prevDataUrl || initialSignature;
    if (imageToRestore) {
      const img = new Image();
      img.onload = () => {
        const currentCanvas = canvasRef.current;
        if (!currentCanvas) return;
        const currentCtx = currentCanvas.getContext('2d');
        if (!currentCtx) return;
        currentCtx.clearRect(0, 0, currentCanvas.width, currentCanvas.height);
        currentCtx.drawImage(img, 0, 0, currentCanvas.width, currentCanvas.height);
        configureContext(currentCtx);
        setHasDrawn(true);
      };
      img.src = imageToRestore;
    }
  }, [configureContext, hasDrawn, initialSignature]);

  useEffect(() => {
    setupCanvas();

    const container = containerRef.current;
    let resizeObserver: ResizeObserver | null = null;
    if (container && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        setupCanvas();
      });
      resizeObserver.observe(container);
    }

    const handleResize = () => setupCanvas();
    window.addEventListener('resize', handleResize);

    return () => {
      if (resizeObserver) resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, [setupCanvas]);

  // Cálculo das coordenadas considerando a escala entre o tamanho visual do Canvas e a resolução interna
  const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement> | PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width > 0 ? canvas.width / rect.width : 1;
    const scaleY = rect.height > 0 ? canvas.height / rect.height : 1;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  // POINTER EVENTS: Início do traço contínuo
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // Apenas botão principal se for mouse
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Captura o ponteiro para evitar perda do movimento
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {
      // Ignora caso não suportado
    }

    const coords = getCoordinates(e);
    lastPointRef.current = coords;
    isDrawingRef.current = true;
    setAlertMessage(null);

    const ctx = canvas.getContext('2d');
    if (ctx) {
      configureContext(ctx);
      // Traço suave imediato no ponto de contato (lineTo no mesmo ponto com lineCap round cria ponto suave)
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    }

    setHasDrawn(true);
  };

  // POINTER EVENTS: Movimento contínuo e sem interrupções
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !lastPointRef.current) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    configureContext(ctx);

    // Suporte a coalesced events para canetas stylus e telas touch de alta frequência (120Hz)
    const nativeEvent = e.nativeEvent;
    const pointerEvents: PointerEvent[] = 
      typeof (nativeEvent as any).getCoalescedEvents === 'function'
        ? (nativeEvent as any).getCoalescedEvents()
        : [nativeEvent];

    for (const pEvent of pointerEvents) {
      if (!lastPointRef.current) break;
      const currentPoint = getCoordinates(pEvent);

      // Desenho de linha contínua conectando o ponto anterior ao atual
      ctx.beginPath();
      ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
      ctx.lineTo(currentPoint.x, currentPoint.y);
      ctx.stroke();

      lastPointRef.current = currentPoint;
    }

    setHasDrawn(true);
  };

  // POINTER EVENTS: Fim do desenho
  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (isDrawingRef.current) {
      const canvas = canvasRef.current;
      if (canvas && typeof canvas.hasPointerCapture === 'function' && canvas.hasPointerCapture(e.pointerId)) {
        try {
          canvas.releasePointerCapture(e.pointerId);
        } catch {
          // Ignora
        }
      }
      isDrawingRef.current = false;
      lastPointRef.current = null;
    }
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLCanvasElement>) => {
    handlePointerUp(e);
  };

  // Botão LIMPAR: apaga completamente a assinatura do canvas
  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Limpa toda a extensão interna do buffer
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    lastPointRef.current = null;
    isDrawingRef.current = false;
    setHasDrawn(false);
    setAlertMessage(null);
  };

  // Verifica se o canvas possui pixels desenhados
  const isCanvasBlank = (canvas: HTMLCanvasElement): boolean => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return true;
    try {
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      // Verifica o canal alpha de cada pixel
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] > 0) return false;
      }
      return true;
    } catch {
      return !hasDrawn;
    }
  };

  // Botão CONFIRMAR ASSINATURA: valida a existência de traço antes de salvar
  const handleConfirm = async () => {
    const canvas = canvasRef.current;

    if (!canvas || !hasDrawn || isCanvasBlank(canvas)) {
      setAlertMessage('Por favor, faça a assinatura antes de confirmar.');
      return;
    }

    const dataUrl = canvas.toDataURL('image/png');

    try {
      await onConfirm(dataUrl);
    } catch (error) {
      console.error('[DDPS] Erro ao confirmar assinatura:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-3xl bg-white border border-gray-200 rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[95vh]">
        {/* Cabeçalho da assinatura */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-yellow-100 text-yellow-800">
              <PenTool className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-[#1A1C1E] leading-tight">
                Assinatura do Participante
              </h3>
              <p className="text-sm font-semibold text-gray-600 truncate max-w-[240px] sm:max-w-md">
                {funcionarioNome}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-2.5 rounded-xl text-gray-400 hover:text-black hover:bg-gray-200 transition-colors"
            title="Fechar"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Quadro de Assinatura */}
        <div className="p-4 sm:p-6 flex-1 flex flex-col gap-3 bg-white">
          <div className="flex items-center justify-between text-xs text-gray-500 font-medium px-1">
            <span>Assine com o dedo, caneta ou mouse no quadro abaixo:</span>
            <span className={hasDrawn ? 'text-green-600 font-bold' : 'text-gray-400'}>
              {hasDrawn ? '✓ Assinatura em andamento' : 'Aguardando traço...'}
            </span>
          </div>

          <div
            ref={containerRef}
            className="relative w-full h-[220px] sm:h-[280px] md:h-[320px] bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300 overflow-hidden touch-none flex flex-col justify-end select-none"
            style={{ touchAction: 'none' }}
          >
            {/* Linha guia de assinatura como em papel de presença */}
            <div className="absolute inset-x-6 bottom-14 border-b border-gray-300 pointer-events-none flex justify-between items-end pb-1 select-none">
              <span className="text-[11px] uppercase font-bold tracking-wider text-gray-400 select-none">
                Assinar sobre esta linha
              </span>
              <span className="text-[10px] text-gray-400 select-none">DDPS Campo</span>
            </div>

            {/* Canvas HTML5 com Pointer Events e touch-action: none */}
            <canvas
              ref={canvasRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerCancel}
              style={{ touchAction: 'none' }}
              className="absolute inset-0 w-full h-full cursor-crosshair touch-none select-none"
            />
          </div>

          {alertMessage && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 text-red-700 text-xs font-semibold border border-red-200 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{alertMessage}</span>
            </div>
          )}
        </div>

        {/* Barra de ações */}
        <div className="p-4 sm:p-5 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row gap-3">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={handleClear}
            leftIcon={<Eraser className="w-5 h-5 text-gray-600" />}
            className="sm:w-1/3 bg-white text-gray-700 hover:bg-gray-100"
            disabled={!hasDrawn || isLoading}
          >
            LIMPAR
          </Button>

          <Button
            type="button"
            variant="primary"
            size="lg"
            onClick={handleConfirm}
            leftIcon={<Check className="w-6 h-6 stroke-[3]" />}
            className="flex-1"
            disabled={!hasDrawn || isLoading}
          >
            {isLoading ? 'SALVANDO...' : 'CONFIRMAR ASSINATURA'}
          </Button>
        </div>
      </div>
    </div>
  );
};
