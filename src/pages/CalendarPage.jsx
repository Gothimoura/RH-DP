import { useState, useMemo, useEffect, useRef } from 'react'
import MainLayout from '@/components/shared/MainLayout'
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import 'moment/locale/pt-br'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { useCalendar } from '@/hooks/useCalendar'
import { Plus, Calendar } from 'lucide-react'
import CreateEventModal from '@/components/Calendar/CreateEventModal'
import { getFeriadosBrasileiros } from '@/lib/feriados'

// Configurar moment para português brasileiro
moment.locale('pt-br')

// Criar localizer com moment configurado e garantir início da semana como domingo
const localizer = momentLocalizer(moment)

// Configurar início da semana como domingo (padrão brasileiro)
moment.updateLocale('pt-br', {
  week: {
    dow: 0, // Domingo é o primeiro dia da semana
  }
})

// Cores dos eventos - ajustadas para melhor contraste e legibilidade
const eventColors = {
  entrada: '#10b981',      // Verde mais suave
  documentos: '#3b82f6',   // Azul mais suave
  saida: '#ef4444',        // Vermelho mais suave
  aniversario: '#a855f7',  // Roxo mais suave
  ferias: '#f59e0b',       // Laranja mais suave
  feriado: '#f87171',      // Vermelho claro mais suave
}

export default function CalendarPage() {
  const { events: eventsData, loading, refetch } = useCalendar()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [currentDate, setCurrentDate] = useState(new Date())
  const calendarRef = useRef(null)

  // Traduzir cabeçalhos dos dias da semana e meses para português
  useEffect(() => {
    const translateHeaders = () => {
      // Traduzir dias da semana
      const headers = document.querySelectorAll('.rbc-month-view .rbc-header, .rbc-time-view .rbc-header, .rbc-day-view .rbc-header')
      const dayTranslations = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
      
      headers.forEach((header, index) => {
        if (index < 7 && header.textContent) {
          const originalText = header.textContent.trim()
          // Verificar se ainda está em inglês
          if (originalText.match(/^(Sun|Mon|Tue|Wed|Thu|Fri|Sat)$/i)) {
            header.textContent = dayTranslations[index]
          }
        }
      })

      // Traduzir meses no cabeçalho do calendário
      const monthHeaders = document.querySelectorAll('.rbc-toolbar-label')
      const monthTranslations = {
        'January': 'Janeiro',
        'February': 'Fevereiro',
        'March': 'Março',
        'April': 'Abril',
        'May': 'Maio',
        'June': 'Junho',
        'July': 'Julho',
        'August': 'Agosto',
        'September': 'Setembro',
        'October': 'Outubro',
        'November': 'Novembro',
        'December': 'Dezembro'
      }

      monthHeaders.forEach((header) => {
        if (header.textContent) {
          const text = header.textContent.trim()
          // Verificar se contém nome de mês em inglês
          Object.keys(monthTranslations).forEach((monthEn) => {
            if (text.includes(monthEn)) {
              header.textContent = text.replace(monthEn, monthTranslations[monthEn])
            }
          })
        }
      })
    }

    // Executar imediatamente
    translateHeaders()

    // Executar após um pequeno delay para garantir que o calendário renderizou
    const timeoutId = setTimeout(translateHeaders, 100)
    const timeoutId2 = setTimeout(translateHeaders, 500)

    // Observar mudanças no DOM
    const observer = new MutationObserver(translateHeaders)
    if (calendarRef.current) {
      observer.observe(calendarRef.current, {
        childList: true,
        subtree: true,
        characterData: true,
      })
    }

    return () => {
      clearTimeout(timeoutId)
      clearTimeout(timeoutId2)
      observer.disconnect()
    }
  }, [currentDate, eventsData])

  // Buscar feriados para o ano atual e anos adjacentes (para navegação)
  const feriados = useMemo(() => {
    const ano = currentDate.getFullYear()
    return getFeriadosBrasileiros(ano)
  }, [currentDate])

  // Formatar eventos do banco de dados
  const formattedEvents = useMemo(() => {
    const eventos = eventsData.map((event) => ({
      id: event.id,
      title: event.titulo,
      start: new Date(`${event.data_evento}T${event.hora_evento || '00:00:00'}`),
      end: new Date(`${event.data_evento}T${event.hora_evento || '23:59:59'}`),
      resource: {
        tipo: event.tipo_evento,
        descricao: event.descricao,
        colaborador: event.colaboradorNome || null,
      },
    }))

    // Adicionar feriados como eventos
    const eventosFeriados = feriados.map((feriado) => {
      const dataInicio = new Date(feriado.data)
      dataInicio.setHours(0, 0, 0, 0)
      const dataFim = new Date(feriado.data)
      dataFim.setHours(23, 59, 59, 999)
      
      return {
        id: `feriado-${feriado.data.getTime()}`,
        title: feriado.nome,
        start: dataInicio,
        end: dataFim,
        resource: {
          tipo: 'feriado',
          descricao: `Feriado Nacional: ${feriado.nome}`,
          colaborador: null,
        },
      }
    })

    return [...eventos, ...eventosFeriados]
  }, [eventsData, feriados])

  const eventStyleGetter = (event) => {
    const color = eventColors[event.resource?.tipo] || '#808080'
    return {
      style: {
        backgroundColor: 'transparent',
        borderColor: color,
        borderWidth: '2px',
        borderStyle: 'solid',
        color: color,
        fontWeight: 'bold',
        borderRadius: '4px',
      },
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-2 bg-primary rounded-lg">
                <Calendar className="w-5 h-5 md:w-6 md:h-6 text-primary-foreground" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                Calendário RH
              </h1>
            </div>
            <p className="text-muted-foreground mt-2 text-sm md:text-base">Visualize e gerencie eventos e compromissos</p>
          </div>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-primary text-white px-3 md:px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors text-sm md:text-base w-full sm:w-auto justify-center"
          >
            <Plus className="w-4 h-4 md:w-5 md:h-5" />
            Novo Evento
          </button>
        </div>

        <div className="bg-card rounded-lg border border-border shadow-sm p-3 md:p-6 overflow-x-auto">
          <div className="min-w-[600px]" ref={calendarRef}>
            <BigCalendar
              localizer={localizer}
              events={formattedEvents}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 500, minHeight: 500 }}
              eventPropGetter={eventStyleGetter}
              onNavigate={(date) => setCurrentDate(date)}
              culture="pt-BR"
              messages={{
                next: 'Próximo',
                previous: 'Anterior',
                today: 'Hoje',
                month: 'Mês',
                week: 'Semana',
                day: 'Dia',
                agenda: 'Agenda',
                date: 'Data',
                time: 'Hora',
                event: 'Evento',
                noEventsInRange: 'Não há eventos neste período',
                showMore: (total) => `+ Ver mais (${total})`,
              }}
              formats={{
                dayFormat: 'dddd',
                weekdayFormat: (date, culture, localizer) => {
                  const m = moment(date)
                  m.locale('pt-br')
                  return m.format('ddd')
                },
                dayHeaderFormat: (date, culture, localizer) => {
                  const m = moment(date)
                  m.locale('pt-br')
                  return m.format('ddd')
                },
                dayRangeHeaderFormat: ({ start, end }, culture, localizer) => {
                  const startM = moment(start).locale('pt-br')
                  const endM = moment(end).locale('pt-br')
                  return startM.format('ddd DD/MM') + ' - ' + endM.format('ddd DD/MM')
                },
                monthHeaderFormat: (date, culture, localizer) => {
                  const m = moment(date).locale('pt-br')
                  return m.format('MMMM YYYY')
                },
                timeGutterHeaderFormat: 'HH:mm',
                eventTimeRangeFormat: ({ start, end }, culture, localizer) => {
                  const startM = moment(start).locale('pt-br')
                  const endM = moment(end).locale('pt-br')
                  return startM.format('HH:mm') + ' - ' + endM.format('HH:mm')
                },
              }}
            />
          </div>
        </div>

        {/* Legenda */}
        <div className="bg-card rounded-lg border border-border shadow-sm p-3 md:p-4">
          <h3 className="font-semibold text-foreground mb-2 md:mb-3 text-sm md:text-base">Legenda:</h3>
          <div className="flex flex-wrap gap-3 md:gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-2" style={{ borderColor: eventColors.entrada, backgroundColor: 'transparent' }}></div>
              <span className="text-sm font-bold" style={{ color: eventColors.entrada }}>Entrada</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-2" style={{ borderColor: eventColors.documentos, backgroundColor: 'transparent' }}></div>
              <span className="text-sm font-bold" style={{ color: eventColors.documentos }}>Documentos</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-2" style={{ borderColor: eventColors.saida, backgroundColor: 'transparent' }}></div>
              <span className="text-sm font-bold" style={{ color: eventColors.saida }}>Saída</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-2" style={{ borderColor: eventColors.aniversario, backgroundColor: 'transparent' }}></div>
              <span className="text-sm font-bold" style={{ color: eventColors.aniversario }}>Aniversário</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-2" style={{ borderColor: eventColors.ferias, backgroundColor: 'transparent' }}></div>
              <span className="text-sm font-bold" style={{ color: eventColors.ferias }}>Férias</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-2" style={{ borderColor: eventColors.feriado, backgroundColor: 'transparent' }}></div>
              <span className="text-sm font-bold" style={{ color: eventColors.feriado }}>Feriado Nacional</span>
            </div>
          </div>
        </div>

        <CreateEventModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            if (refetch) refetch()
          }}
        />
      </div>
    </MainLayout>
  )
}

