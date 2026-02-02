import { clsx } from 'clsx'

export function cn(...inputs) {
  return clsx(inputs)
}

export function formatDate(date) {
  if (!date) return ''
  return new Date(date).toLocaleDateString('pt-BR')
}

export function formatDateTime(date) {
  if (!date) return ''
  return new Date(date).toLocaleString('pt-BR')
}

export function formatCurrency(value) {
  if (!value) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

// Normalizar status de equipamento do banco para formato de exibição
export function normalizeEquipmentStatus(status) {
  if (!status) return 'Disponível'
  const statusLower = status.toLowerCase().trim()
  const statusMap = {
    'disponivel': 'Disponível',
    'disponível': 'Disponível',
    'em_uso': 'Em uso',
    'em uso': 'Em uso',
    'manutencao': 'Manutenção',
    'manutenção': 'Manutenção',
    'indisponivel': 'Indisponível',
    'indisponível': 'Indisponível',
    'descarte': 'Descarte',
  }
  return statusMap[statusLower] || status
}
