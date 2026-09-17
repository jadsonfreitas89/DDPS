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
  | 'consultar_semanas';
