export type Emociograma = 'BOM' | 'REGULAR' | 'RUIM';

export interface DDPSStatus {
  semana: number | string;
  data: string;
  horario: string;
  dataHora: string;
  diaSemana: string;
  diaSemanaNumero: number;
  timestamp: number;
  responsavelPadrao?: string;
}

export interface Funcionario {
  id: string;
  idFuncionario?: string;
  nome: string;
  ativo: string | boolean;
  cargo?: string;
  funcao?: string;
  setor?: string;
}

export interface Participante {
  idFuncionario: string;
  nome: string;
  emociograma: Emociograma;
  assinatura: string; // Base64 data URL
  cargo?: string;
  horaAssinatura?: string;
  ausente?: boolean;
  motivoAusencia?: string;
}

export interface DDS {
  idDDS: string;
  semana?: number | string;
  semanaId?: string;
  diaSemana: string;
  diaSemanaNumero?: number;
  data: string;
  horario: string;
  createdAt?: string; // Data/hora oficial da criação do registro
  tema: string;
  conteudo: string;
  local: string;
  responsavel: string;
  observacoes?: string;
  status?: 'realizado' | 'pendente' | 'finalizado';
  participantes?: Participante[];
  participantesQtd?: number;
  encarregadoId?: string;
  encarregadoNome?: string;
  assinaturaEncarregado?: string; // Base64 data URL
  horarioFinalizacao?: string; // Horário real da assinatura final do responsável (ex: "07:37:00")
  dataFinalizacao?: string; // Data ISO de conclusão
  finalizedAt?: string; // Data e hora oficial da assinatura final do responsável
  duracaoMinutos?: number; // Duração calculada (finalizedAt - 07:00)
  syncStatus?: 'synced' | 'pending' | 'syncing' | 'error';
  clientOfflineId?: string;
  clientSyncId?: string;
  updatedAt?: number;
}

export type SyncOperationType = 
  | 'CRIAR_DDS'
  | 'SALVAR_PARTICIPANTES'
  | 'FINALIZAR_DDS'
  | 'SALVAR_DDS_COMPLETO';

export interface SyncQueueItem {
  id: string; // UUID único da operação
  tipo: SyncOperationType;
  idDDS: string; // ID local ou remoto
  payload: any;
  timestamp: number;
  tentativas: number;
  status: 'pendente' | 'sincronizando' | 'erro' | 'concluido';
  ultimoErro?: string;
}

export interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncTime: number | null;
  lastSyncError: string | null;
}

export interface DiaSemanaProgramacao {
  dia: 'Segunda' | 'Terça' | 'Quarta' | 'Quinta' | 'Sexta' | 'Sábado' | 'Domingo';
  nomeCompleto: string;
  numero: number;
  realizado: boolean;
  dds?: DDS;
}

export type PerfilUsuario = 'ADMIN' | 'TST' | 'ENCARREGADO';

export interface Usuario {
  idUsuario: string;
  usuario: string;
  nome: string;
  perfil: PerfilUsuario;
  ativo?: boolean;
  primeiroAcesso?: boolean;
  dataCriacao?: string;
  dataAtualizacao?: string;
}

export type ScreenView = 
  | 'inicio' 
  | 'novo_dds' 
  | 'participantes' 
  | 'conferencia' 
  | 'visualizar_dds'
  | 'lista_dds'
  | 'funcionarios'
  | 'usuarios'
  | 'consultar_semanas'
  | 'dashboard';
