export type Stage =
  | 'pendente'
  | 'em_analise'
  | 'aprovado'
  | 'reprovado'
  | 'condicionado'
  | 'desistencia'
  | 'contrato'
  | 'formularios'
  | 'repasse'
  | 'concluido'

export type EventType = 'visita' | 'call' | 'reuniao'
export type CreatedBy = 'corretor' | 'agent'
export type ConversationRole = 'lead' | 'agent'
export type CreditStatus = 'draft' | 'enviado' | 'aprovado' | 'reprovado' | 'condicionado'

export interface Proponente {
  nome: string | null
  cpf: string | null
  email: string | null
  telefone: string | null
  endereco: string | null
  profissao: string | null
  renda: number | null
  tipo_renda: 'formal' | 'informal' | null
  cotista: boolean
  fator_social: boolean
}

export interface Lead {
  id: string
  nome: string
  telefone: string
  email: string | null
  cpf: string | null
  renda: number | null
  tipo_imovel: string | null
  stage: Stage
  campaign_source: string | null
  loss_reason: string | null
  observations: string | null
  endereco: string | null
  profissao: string | null
  tipo_renda: 'formal' | 'informal' | null
  cotista: boolean
  fator_social: boolean
  regiao_interesse: string | null
  empreendimento: string | null
  vgv: number | null
  proponentes: Proponente[] | null
  created_at: string
  updated_at: string
}

export interface Document {
  id: string
  lead_id: string
  name: string
  type: string | null
  storage_path: string
  uploaded_by: CreatedBy
  uploaded_at: string
}

export interface Conversation {
  id: string
  lead_id: string
  role: ConversationRole
  content: string
  type: 'text' | 'audio'
  created_at: string
}

export interface Appointment {
  id: string
  lead_id: string
  type: EventType
  title: string
  start_at: string
  end_at: string
  location: string | null
  notes: string | null
  status: 'pendente' | 'realizado' | 'cancelado'
  created_by: CreatedBy
  created_at: string
  lead?: Pick<Lead, 'nome' | 'telefone'>
}

export interface CreditAnalysis {
  id: string
  lead_id: string
  status: CreditStatus
  sent_at: string | null
  responded_at: string | null
  approved_value: number | null
  response_text: string | null
  created_at: string
}

export interface TimelineEvent {
  id: string
  lead_id: string
  type: string
  payload: Record<string, unknown> | null
  created_at: string
}

export interface PortalLink {
  id: string
  name: string
  url: string
  icon_label: string | null
  created_at: string
}

export const STAGE_CONFIG: Record<Stage, { label: string; color: string }> = {
  pendente:     { label: 'Pendente',     color: '#666666' },
  em_analise:   { label: 'Em Análise',  color: '#42a5f5' },
  aprovado:     { label: 'Aprovado',     color: '#10b981' },
  reprovado:    { label: 'Reprovado',    color: '#ef5350' },
  condicionado: { label: 'Condicionado', color: '#ffab40' },
  desistencia:  { label: 'Desistência',  color: '#b71c1c' },
  contrato:     { label: 'Contrato',     color: '#1b5e20' },
  formularios:  { label: 'Formulários',  color: '#ab47bc' },
  repasse:      { label: 'Repasse',      color: '#e65100' },
  concluido:    { label: 'Concluído',    color: '#6ee7b7' },
}

export const STAGES: Stage[] = [
  'pendente', 'em_analise', 'aprovado', 'reprovado', 'condicionado',
  'desistencia', 'contrato', 'formularios', 'repasse', 'concluido',
]
