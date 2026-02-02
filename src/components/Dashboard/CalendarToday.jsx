import { useCalendar } from '@/hooks/useCalendar'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar, UserPlus, FileText, UserMinus, Cake, Plane, Circle } from 'lucide-react'

const colorMap = {
  entrada: { icon: UserPlus, color: 'text-success bg-success/10 dark:bg-success/20' },
  documentos: { icon: FileText, color: 'text-primary bg-primary/10 dark:bg-primary/20' },
  saida: { icon: UserMinus, color: 'text-destructive bg-destructive/10 dark:bg-destructive/20' },
  aniversario: { icon: Cake, color: 'text-purple-500 bg-purple-500/10 dark:bg-purple-500/20' },
  ferias: { icon: Plane, color: 'text-warning bg-warning/10 dark:bg-warning/20' },
  default: { icon: Circle, color: 'text-muted-foreground bg-muted' },
}

export default function CalendarToday() {
  const today = format(new Date(), 'yyyy-MM-dd')
  const { events, loading } = useCalendar({ data_evento: today })

  if (loading) {
    return (
      <div className="bg-card rounded-xl border-2 border-primary/20 shadow-sm p-5 md:p-6">
        <div className="flex items-center gap-3 mb-4 md:mb-5">
          <div className="p-2.5 bg-primary/10 rounded-xl">
            <Calendar className="w-5 h-5 md:w-6 md:h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg md:text-xl font-bold text-foreground">
              {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </h3>
            <p className="text-xs md:text-sm text-muted-foreground">Eventos de hoje</p>
          </div>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground text-sm mt-3">Carregando eventos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-xl border-2 border-primary/20 shadow-sm p-5 md:p-6 hover:shadow-lg transition-all duration-200">
      <div className="flex items-center gap-3 mb-4 md:mb-5">
        <div className="p-2.5 bg-primary/10 rounded-xl">
          <Calendar className="w-5 h-5 md:w-6 md:h-6 text-primary" />
        </div>
        <div>
          <h3 className="text-lg md:text-xl font-bold text-foreground">
            {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </h3>
          <p className="text-xs md:text-sm text-muted-foreground">Eventos de hoje</p>
        </div>
      </div>
      
      {events.length === 0 ? (
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Nenhum evento agendado para hoje</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => {
            const eventConfig = colorMap[event.tipo_evento] || colorMap.default
            const Icon = eventConfig.icon
            return (
              <div
                key={event.id}
                className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 transition-all group"
              >
                <div className={`p-2.5 rounded-lg ${eventConfig.color} group-hover:scale-110 transition-transform`}>
                  <Icon className="w-4 h-4 md:w-5 md:h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm md:text-base leading-relaxed">
                    {event.hora_evento && (
                      <span className="font-bold text-primary whitespace-nowrap mr-2">
                        {event.hora_evento.substring(0, 5)}
                      </span>
                    )}
                    <span className="font-semibold text-foreground">
                      {event.titulo}
                    </span>
                  </p>
                  {event.colaboradorNome && (
                    <p className="text-xs md:text-sm text-muted-foreground mt-1.5">
                      👤 {event.colaboradorNome}
                    </p>
                  )}
                  {event.descricao && (
                    <p className="text-xs md:text-sm text-muted-foreground mt-1.5 line-clamp-2">
                      {event.descricao}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

