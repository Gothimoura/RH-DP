import { useNavigate } from 'react-router-dom'
import { Smartphone, Laptop, Phone, User, Building2, Calendar } from 'lucide-react'

const icons = {
  celular: Smartphone,
  notebook: Laptop,
  linha: Phone,
}

const statusColors = {
  'Em uso': 'bg-green-500 text-white border-green-500',
  'Disponível': 'bg-white dark:bg-gray-800 text-primary border-primary',
  'Manutenção': 'bg-warning/20 text-warning border-warning/30',
  'Indisponível': 'bg-destructive/20 text-destructive border-destructive/30',
  'Descarte': 'bg-destructive/20 text-destructive border-destructive/30',
}

// Normalizar status do banco para formato de exibição
const normalizeStatus = (status) => {
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

export default function EquipmentCard({ equipment, type, onAssign, onRelease }) {
  const navigate = useNavigate()
  const Icon = icons[type] || Smartphone

  const getStatus = () => {
    if (equipment.Status) return normalizeStatus(equipment.Status)
    if (equipment['Usuário atual']) return 'Em uso'
    return 'Disponível'
  }

  const status = getStatus()
  const statusClass = statusColors[status] || statusColors['Disponível']

  return (
    <div className="bg-card rounded-lg border border-border shadow-sm p-3 md:p-4 hover:shadow-md transition-shadow flex flex-col h-full">
      {/* Header com badge alinhado */}
      <div className="flex items-start justify-between mb-2 md:mb-3 gap-2 min-h-[3rem]">
        <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
          <div className="p-1.5 md:p-2 bg-primary/10 rounded-lg shrink-0">
            <Icon className="w-4 h-4 md:w-5 md:h-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-foreground text-sm md:text-base truncate">
              {type === 'celular' && equipment.CELULAR}
              {type === 'notebook' && `${equipment.Marca || ''} ${equipment.Modelo || ''}`.trim()}
              {type === 'linha' && equipment.NTC}
            </h3>
            {type === 'celular' && equipment.Modelo && (
              <p className="text-xs md:text-sm text-muted-foreground truncate">{equipment.Modelo}</p>
            )}
            {type === 'notebook' && equipment['Nº Matricula'] && (
              <p className="text-xs md:text-sm text-muted-foreground truncate">Patrimônio: {equipment['Nº Matricula']}</p>
            )}
            {type === 'linha' && equipment.Empresa && (
              <p className="text-xs md:text-sm text-muted-foreground truncate">{equipment.Empresa}</p>
            )}
          </div>
        </div>
        <span className={`px-2.5 py-1 rounded text-xs font-medium border shrink-0 whitespace-nowrap min-w-[70px] text-center ${statusClass}`}>
          {status}
        </span>
      </div>

      {/* Conteúdo do meio - flexível */}
      <div className="space-y-1.5 md:space-y-2 mb-3 md:mb-4 flex-1">
        {equipment['Usuário atual'] && (
          <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
            <User className="w-3 h-3 md:w-4 md:h-4 shrink-0" />
            <span className="truncate">{equipment['Usuário atual']}</span>
          </div>
        )}
        
        {(equipment.Departamento || equipment.DPTO || equipment['Centro de custo']) && (
          <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
            <Building2 className="w-3 h-3 md:w-4 md:h-4 shrink-0" />
            <span className="truncate">
              {equipment.Departamento || equipment.DPTO || equipment['Centro de custo']}
            </span>
          </div>
        )}

        {equipment['Último usuário'] && !equipment['Usuário atual'] && (
          <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
            <Calendar className="w-3 h-3 md:w-4 md:h-4 shrink-0" />
            <span className="truncate">Último: {equipment['Último usuário']}</span>
          </div>
        )}

        {type === 'celular' && equipment.IMEI && (
          <div className="text-xs text-muted-foreground truncate">IMEI: {equipment.IMEI}</div>
        )}
      </div>

      {/* Botões sempre alinhados na parte inferior */}
      <div className="flex gap-2 mt-auto">
        <button
          onClick={() => {
            const equipId = encodeURIComponent(equipment['Row ID'])
            navigate(`/equipamentos/${type}/${equipId}`)
          }}
          className="flex-1 px-3 py-2 text-xs md:text-sm bg-muted text-foreground rounded hover:bg-muted/80 transition-colors font-medium"
        >
          Ver Detalhes
        </button>
        {equipment['Usuário atual'] ? (
          <button
            onClick={() => onRelease(equipment)}
            className="flex-1 px-3 py-2 text-xs md:text-sm bg-warning text-white rounded hover:bg-orange-600 transition-colors font-medium"
          >
            Devolver
          </button>
        ) : (
          <button
            onClick={() => onAssign(equipment)}
            className="flex-1 px-3 py-2 text-xs md:text-sm bg-primary text-white rounded hover:bg-blue-700 transition-colors font-medium"
          >
            Atribuir
          </button>
        )}
      </div>
    </div>
  )
}

