import { Link } from 'react-router-dom'
import { Plus, FileText, Calendar, Users, ArrowRight } from 'lucide-react'

const actions = [
  {
    to: '/onboarding',
    icon: Users,
    label: 'Novo Funcionário',
    description: 'Iniciar processo de onboarding',
    color: 'bg-primary hover:bg-primary/90',
    iconColor: 'text-primary',
  },
  {
    to: '/documents',
    icon: FileText,
    label: 'Gerar Documento',
    description: 'Criar documentos personalizados',
    color: 'bg-success hover:bg-success/90',
    iconColor: 'text-success',
  },
  {
    to: '/calendar',
    icon: Calendar,
    label: 'Novo Evento',
    description: 'Agendar eventos e compromissos',
    color: 'bg-purple-500 hover:bg-purple-600',
    iconColor: 'text-purple-500',
  },
]

export default function QuickActions() {
  return (
    <div className="bg-card rounded-xl border border-border shadow-sm p-5 md:p-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
        {actions.map((action) => {
          const Icon = action.icon
          return (
            <Link
              key={action.to}
              to={action.to}
              className={`${action.color} text-white p-5 md:p-6 rounded-xl flex flex-col items-start justify-between gap-3 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg group`}
            >
              <div className="flex items-center justify-between w-full">
                <div className={`p-3 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors`}>
                  <Icon className="w-6 h-6 md:w-7 md:h-7" />
                </div>
                <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="w-full">
                <h4 className="font-semibold text-base md:text-lg mb-1">{action.label}</h4>
                <p className="text-xs md:text-sm text-white/80">{action.description}</p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

