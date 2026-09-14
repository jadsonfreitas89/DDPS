import React, { useState, useRef, useEffect } from 'react';
import { Calendar, Clock, Settings, HardHat, Users, LogOut, Shield, KeyRound, ChevronDown, Menu, X } from 'lucide-react';
import { DDPSStatus, Usuario } from '../types';
import { formatarHoraApenas, formatarDataApenas } from '../utils/dateFormatter';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  status?: DDPSStatus | null;
  currentUser?: Usuario | null;
  onOpenConfig?: () => void;
  isApiConfigured?: boolean;
  onNavigate?: (screen: 'inicio' | 'lista_dds' | 'funcionarios' | 'usuarios' | 'consultar_semanas') => void;
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
  const [showConfigMenu, setShowConfigMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const menuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowConfigMenu(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-[#1A1C1E] text-white px-3 sm:px-6 py-2.5 sm:py-3.5 shadow-md border-b border-gray-800 w-full max-w-full box-border">
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-2">
        
        {/* BRAND / LOGO - TOQUE REDIRECIONA PARA O INÍCIO */}
        <div 
          className="flex items-center gap-2.5 sm:gap-3.5 cursor-pointer hover:opacity-95 transition-opacity shrink-0" 
          onClick={() => {
            setIsMobileMenuOpen(false);
            onNavigate && onNavigate('inicio');
          }}
          title="Ir para o Início"
        >
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-yellow-400 text-black flex items-center justify-center font-black shadow-sm shrink-0">
            <HardHat className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="text-lg sm:text-2xl font-black tracking-tight text-white leading-none">
                DDPS
              </h1>
              <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-yellow-400/20 text-yellow-400 border border-yellow-400/30">
                Campo
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-yellow-500 font-semibold uppercase tracking-wider sm:tracking-widest truncate max-w-[140px] xs:max-w-[190px] sm:max-w-none">
              Diálogo Diário Participativo
            </p>
          </div>
        </div>

        {/* ÁREA CENTRAL / STATUS / OPÇÕES */}
        <div className="flex items-center gap-2">
          {status && (
            <>
              {/* MOBILE BADGE: APENAS "SEMANA XX" */}
              <div className="md:hidden bg-yellow-400/10 text-yellow-400 border border-yellow-400/30 px-2.5 py-1 rounded-lg text-xs font-black tracking-wide shrink-0">
                Semana {status.semana}
              </div>

              {/* DESKTOP & TABLET: DETALHES COMPLETOS DE DATA E HORA */}
              <div className="text-right hidden md:block border-r border-gray-800 pr-3">
                <div className="text-sm lg:text-base font-mono font-bold text-white tracking-wider flex items-center justify-end gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-yellow-400" />
                  {formatarHoraApenas(status.horario)}
                </div>
                <div className="text-[10px] lg:text-[11px] text-gray-400 font-medium">
                  Semana {status.semana} • {status.diaSemana}, {formatarDataApenas(status.data)}
                </div>
              </div>
            </>
          )}

          {/* BADGE DO USUÁRIO ATIVO (DESKTOP EXTENDIDO) */}
          {currentUser && (
            <div className="hidden xl:flex items-center gap-2 mr-1">
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
            </div>
          )}

          {/* =========================================================
              NAVEGAÇÃO DESKTOP & TABLET (OCULTA NO MOBILE < 768px)
          ========================================================= */}
          <div className="hidden md:flex items-center gap-1.5 sm:gap-2">
            {/* INÍCIO */}
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('inicio')}
                className="p-2 sm:p-2.5 rounded-xl bg-gray-800/80 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700 transition-colors flex items-center gap-1.5 px-2.5 sm:px-3 min-h-[40px] shrink-0"
                title="Início"
              >
                <HardHat className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 shrink-0" />
                <span className="hidden lg:inline text-xs font-bold whitespace-nowrap">Início</span>
              </button>
            )}

            {/* CONSULTAR SEMANAS */}
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('consultar_semanas')}
                className="p-2 sm:p-2.5 rounded-xl bg-gray-800/80 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700 transition-colors flex items-center gap-1.5 px-2.5 sm:px-3 min-h-[40px] shrink-0"
                title="Consultar Semanas"
              >
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 shrink-0" />
                <span className="hidden lg:inline text-xs font-bold whitespace-nowrap">Consultar Semanas</span>
              </button>
            )}

            {/* COLABORADORES */}
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('funcionarios')}
                className="p-2 sm:p-2.5 rounded-xl bg-gray-800/80 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700 transition-colors flex items-center gap-1.5 px-2.5 sm:px-3 min-h-[40px] shrink-0"
                title="Gerenciar Colaboradores"
              >
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 shrink-0" />
                <span className="hidden lg:inline text-xs font-bold whitespace-nowrap">Colaboradores</span>
              </button>
            )}

            {/* BOTÃO INSTALAÇÃO PWA */}
            <PWAInstallButton />

            {/* MENU DROPDOWN DE CONFIGURAÇÕES (DESKTOP) */}
            <div className="relative shrink-0" ref={menuRef}>
              <button
                type="button"
                onClick={() => setShowConfigMenu(!showConfigMenu)}
                className="p-2 sm:p-2.5 rounded-xl bg-gray-800/80 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700 transition-colors flex items-center gap-1 px-2 sm:px-2.5 min-h-[40px]"
                title="Configurações do Sistema"
              >
                <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300 shrink-0" />
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              </button>

              {showConfigMenu && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#222529] border border-gray-700 shadow-2xl py-2 z-50 animate-fadeIn">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-800 mb-1">
                    Configurações
                  </div>

                  {onOpenConfig && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowConfigMenu(false);
                        onOpenConfig();
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs font-semibold text-gray-200 hover:bg-gray-800 hover:text-yellow-400 flex items-center gap-2 transition-colors"
                    >
                      <Settings className="w-4 h-4 text-yellow-400" />
                      <span>URL da API</span>
                    </button>
                  )}

                  {currentUser?.perfil === 'ADMIN' && onNavigate && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowConfigMenu(false);
                        onNavigate('usuarios');
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs font-semibold text-gray-200 hover:bg-gray-800 hover:text-purple-300 flex items-center gap-2 transition-colors"
                    >
                      <Shield className="w-4 h-4 text-purple-400" />
                      <span>Gerenciar Usuários</span>
                    </button>
                  )}

                  {onChangePassword && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowConfigMenu(false);
                        onChangePassword();
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs font-semibold text-gray-200 hover:bg-gray-800 hover:text-yellow-400 flex items-center gap-2 transition-colors"
                    >
                      <KeyRound className="w-4 h-4 text-yellow-400" />
                      <span>Alterar Minha Senha</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* SAIR (DESKTOP) */}
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="p-2 sm:p-2.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-400 hover:text-red-300 border border-red-800/50 transition-colors flex items-center gap-1 px-2.5 min-h-[40px] shrink-0"
                title="Encerrar sessão"
              >
                <LogOut className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                <span className="hidden lg:inline text-xs font-bold whitespace-nowrap">Sair</span>
              </button>
            )}
          </div>

          {/* =========================================================
              BOTÃO DE MENU MOBILE HAMBÚRGUER (☰) (APENAS < 768px)
          ========================================================= */}
          <div className="md:hidden flex items-center gap-1.5" ref={mobileMenuRef}>
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-yellow-400 border border-gray-700 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0"
              aria-label="Abrir Menu Principal"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6 text-white" />
              ) : (
                <Menu className="w-6 h-6 text-yellow-400" />
              )}
            </button>

            {/* PAINEL FLUTUANTE DO MENU MOBILE */}
            {isMobileMenuOpen && (
              <div className="absolute right-3 top-16 w-[calc(100vw-24px)] max-w-sm rounded-2xl bg-[#222529] border border-gray-700 shadow-2xl py-3 px-2 z-50 animate-fadeIn space-y-1 text-white">
                
                {/* IDENTIFICAÇÃO DO USUÁRIO LOGADO */}
                {currentUser && (
                  <div className="px-3 py-2.5 mb-2 rounded-xl bg-gray-800/80 border border-gray-700/60 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white">{currentUser.nome}</div>
                      <div className="text-[10px] text-gray-400 font-mono">@{currentUser.usuario}</div>
                    </div>
                    <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border ${
                      currentUser.perfil === 'ADMIN'
                        ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                        : currentUser.perfil === 'ENCARREGADO'
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                        : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                    }`}>
                      {currentUser.perfil}
                    </span>
                  </div>
                )}

                {/* OPÇÃO 1: INÍCIO */}
                {onNavigate && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onNavigate('inicio');
                    }}
                    className="w-full text-left px-4 py-3 rounded-xl text-sm font-bold text-gray-200 hover:bg-gray-800 hover:text-yellow-400 flex items-center gap-3 transition-colors min-h-[44px]"
                  >
                    <HardHat className="w-5 h-5 text-yellow-400" />
                    <span>Início</span>
                  </button>
                )}

                {/* OPÇÃO 2: CONSULTAR SEMANAS */}
                {onNavigate && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onNavigate('consultar_semanas');
                    }}
                    className="w-full text-left px-4 py-3 rounded-xl text-sm font-bold text-gray-200 hover:bg-gray-800 hover:text-yellow-400 flex items-center gap-3 transition-colors min-h-[44px]"
                  >
                    <Calendar className="w-5 h-5 text-yellow-400" />
                    <span>Consultar Semanas</span>
                  </button>
                )}

                {/* OPÇÃO 3: COLABORADORES */}
                {onNavigate && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onNavigate('funcionarios');
                    }}
                    className="w-full text-left px-4 py-3 rounded-xl text-sm font-bold text-gray-200 hover:bg-gray-800 hover:text-yellow-400 flex items-center gap-3 transition-colors min-h-[44px]"
                  >
                    <Users className="w-5 h-5 text-yellow-400" />
                    <span>Colaboradores</span>
                  </button>
                )}

                <div className="my-1 border-t border-gray-800"></div>

                <div className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Configurações & Acesso
                </div>

                {/* OPÇÕES GERENCIAIS & CONFIGURAÇÃO */}
                {onOpenConfig && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenConfig();
                    }}
                    className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white flex items-center gap-3 transition-colors min-h-[44px]"
                  >
                    <Settings className="w-5 h-5 text-yellow-400" />
                    <span>URL da API</span>
                  </button>
                )}

                {currentUser?.perfil === 'ADMIN' && onNavigate && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onNavigate('usuarios');
                    }}
                    className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-purple-300 hover:bg-purple-900/30 flex items-center gap-3 transition-colors min-h-[44px]"
                  >
                    <Shield className="w-5 h-5 text-purple-400" />
                    <span>Gerenciar Usuários</span>
                  </button>
                )}

                {onChangePassword && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onChangePassword();
                    }}
                    className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white flex items-center gap-3 transition-colors min-h-[44px]"
                  >
                    <KeyRound className="w-5 h-5 text-yellow-400" />
                    <span>Alterar Minha Senha</span>
                  </button>
                )}

                {onLogout && (
                  <>
                    <div className="my-1 border-t border-gray-800"></div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onLogout();
                      }}
                      className="w-full text-left px-4 py-3 rounded-xl text-sm font-bold text-red-400 hover:bg-red-950/50 flex items-center gap-3 transition-colors min-h-[44px]"
                    >
                      <LogOut className="w-5 h-5 text-red-400" />
                      <span>Sair do Sistema</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};


