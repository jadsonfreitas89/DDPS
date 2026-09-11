import React, { useEffect, useState } from 'react';
import { FileText, ArrowLeft, Loader2, AlertCircle, FileDown } from 'lucide-react';
import { DDPSStatus, DDS } from '../types';
import { api } from '../services/api';
import { Button } from '../components/Button';
import { formatarDataHora } from '../utils/dateFormatter';
import { gerarPDFSemanalDDPS } from '../utils/pdfGenerator';

interface DDSListViewProps {
  status?: DDPSStatus | null;
  onSelectDDS: (dds: DDS) => void;
  onBack: () => void;
}

export const DDSListView: React.FC<DDSListViewProps> = ({ status = null, onSelectDDS, onBack }) => {
  const [ddsList, setDdsList] = useState<DDS[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handleGerarPDF = async () => {
    if (isGeneratingPdf || ddsList.length === 0) return;
    setIsGeneratingPdf(true);
    try {
      await gerarPDFSemanalDDPS(status, ddsList);
    } catch (err) {
      console.error('Erro ao gerar PDF da lista de DDS:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  useEffect(() => {
    async function loadDDS() {
      setIsLoading(true);
      setError(null);
      try {
        const list = await api.listarDDS();
        console.log('[DDPS UI] TOTAL DDS ANTES DO FILTRO:', list.length);
        const filteredList = list; // Nenhum filtro identificado
        console.log('[DDPS UI] TOTAL DDS DEPOIS DO FILTRO:', filteredList.length);
        setDdsList(filteredList);
      } catch (err) {
        setError('Não foi possível carregar a lista de DDS.');
      } finally {
        setIsLoading(false);
      }
    }
    loadDDS();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-10 h-10 text-yellow-500 animate-spin" />
        <p className="text-gray-500 font-medium">Carregando lista de DDS...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <p className="text-red-600 font-bold">{error}</p>
        <Button onClick={() => window.location.reload()}>Tentar novamente</Button>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-6 pb-8 animate-fadeIn">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack} className="p-2">
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h2 className="text-2xl font-bold text-[#1A1C1E]">Lista de DDS</h2>
        </div>

        {ddsList.length > 0 && (
          <Button
            type="button"
            variant="primary"
            size="md"
            disabled={isGeneratingPdf}
            onClick={handleGerarPDF}
            leftIcon={<FileDown className={`w-4 h-4 ${isGeneratingPdf ? 'animate-bounce text-black' : 'text-black'}`} />}
            className="text-xs font-bold uppercase tracking-wider py-2 px-3 sm:px-4"
          >
            {isGeneratingPdf ? 'GERANDO PDF...' : 'FOLHA SEMANAL (PDF)'}
          </Button>
        )}
      </div>

      {ddsList.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-200">
          <p className="text-gray-500">Nenhum DDS encontrado.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-xs border border-gray-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider font-bold">
              <tr>
                <th className="px-6 py-4">Data/Horário</th>
                <th className="px-6 py-4">Tema</th>
                <th className="px-6 py-4">Responsável</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ddsList.map((dds) => (
                <tr 
                  key={dds.idDDS} 
                  onClick={() => onSelectDDS(dds)}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900 whitespace-nowrap">
                    {formatarDataHora(dds.data, dds.horario)}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">{dds.tema}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{dds.responsavel}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                        dds.status === 'realizado' || dds.status === 'finalizado' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {dds.status}
                      </span>
                    </td>
                  </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
