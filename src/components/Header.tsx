import React from 'react';
import { Calendar, Clock, Settings, HardHat, FileText, Users, UserCheck, LogOut, Shield, KeyRound } from 'lucide-react';
import { DDPSStatus, Usuario } from '../types';
import { formatarHoraApenas, formatarDataApenas } from '../utils/dateFormatter';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  status?: DDPSStatus | null;
  currentUser?: Usuario | null;
  onOpenConfig?: () => void;
  isApiConfigured?: boolean;
  onNavigate?: (screen: 'inicio' | 'lista_dds' | 'funcionarios' | 'usuarios') => void;
  onLogout?: () => void;
  onChangePassword?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  status,
  currentUser,
  onOpenConfig,
  isApiConfigured = false,
  onNavigate,
  onLogout,
  onChangePassword
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#1A1C1E] text-white px-4 py-3 sm:px-6 sm:py-4 flex justify-between items-center shadow-md border-b border-gray-800">
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-3">
        {/* Brand / Title */}
        <div 
          className="flex items-center gap-3.5 cursor-pointer" 
          onClick={() => onNavigate && onNavigate('inicio')}
        >
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-yellow-400 text-black flex items-center justify-center font-black shadow-sm shrink-0">
            <HardHat className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                DDPS
              </h1>
              <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-yellow-400/20 text-yellow-400 border border-yellow-400/30">
                Campo
              </span>
            </div>
            <p className="text-xs text-yellow-500 font-semibold uppercase tracking-widest line-clamp-1">
              Diálogo Diário Participativo de Segurança
            </p>
          </div>
        </div>

        {/* Status / Data da Semana / Horário */}
        <div className="flex items-center gap-2 sm:gap-3">
          {status && (
            <div className="text-right hidden md:block border-r border-gray-800 pr-3">
              <div className="text-base font-mono font-bold text-white tracking-wider flex items-center justify-end gap-1.5">
                <Clock className="w-3.5 h-3.5 text-yellow-400" />
                {formatarHoraApenas(status.horario)}
              </div>
              <div className="text-[11px] text-gray-400 font-medium">
                Semana {status.semana} • {status.diaSemana}, {formatarDataApenas(status.data)}
              </div>
            </div>
          )}

          {/* User Info Badge & Change Password */}
          {currentUser && (
            <div className="hidden sm:flex items-center gap-2 mr-1">
              <div className="flex flex-col items-end">
                <span className="text-xs font-bold text-gray-200 line-clamp-1">{currentUser.nome}</span>
                <span className={`text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded border ${
                  currentUser.perfil === 'ADMIN'
                    ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                    : currentUser.perfil === 'ENCARREGADO'
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                    : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                }`}>
                  {currentUser.perfil}
                </span>
              </div>
              {onChangePassword && (
                <button
                  type="button"
                  onClick={onChangePassword}
                  className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-yellow-400 border border-gray-700 transition-colors"
                  title="Alterar minha senha"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* User Management Button (ADMIN ONLY) */}
          {currentUser?.perfil === 'ADMIN' && onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('usuarios')}
              className="p-2 sm:p-2.5 rounded-xl bg-purple-900/30 hover:bg-purple-800/40 text-purple-300 hover:text-purple-200 border border-purple-700/50 transition-colors flex items-center gap-1.5 px-3"
              title="Gerenciar Usuários"
            >
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
              <span className="hidden lg:inline text-xs font-bold">Usuários</span>
            </button>
          )}

          {/* Funcionarios Button */}
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('funcionarios')}
              className="p-2 sm:p-2.5 rounded-xl bg-gray-800/80 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700 transition-colors flex items-center gap-1.5 px-3"
              title="Gerenciar Colaboradores"
            >
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
              <span className="hidden lg:inline text-xs font-bold">Colaboradores</span>
            </button>
          )}

          {/* DDS List Button */}
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('lista_dds')}
              className="p-2 sm:p-2.5 rounded-xl bg-gray-800/80 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700 transition-colors"
              title="Lista de DDS"
            >
              <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}

          {/* PWA Install Button */}
          <PWAInstallButton />

          {/* Config / API connection button */}
          {onOpenConfig && (
            <button
              type="button"
              onClick={onOpenConfig}
              className="p-2 sm:p-2.5 rounded-xl bg-gray-800/80 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700 transition-colors"
              title="Configurações da API"
            >
              <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}

          {/* Logout Button */}
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="p-2 sm:p-2.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-400 hover:text-red-300 border border-red-800/50 transition-colors flex items-center gap-1 px-2.5"
              title="Sair do sistema"
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline text-xs font-bold">Sair</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

