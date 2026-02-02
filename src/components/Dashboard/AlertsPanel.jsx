import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { AlertTriangle } from 'lucide-react'

export default function AlertsPanel() {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAlerts()
  }, [])

  const loadAlerts = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      // Buscar alertas não enviados SEM join - buscar eventos separadamente
      const { data, error } = await supabase
        .from('rh_calendario_alertas')
        .select('*')
        .eq('enviado', false)
        .order('prioridade', { ascending: false })
        .limit(5)

      if (error) throw error
      
      // Buscar eventos relacionados
      if (data && data.length > 0) {
        const eventoIds = [...new Set(data.map(a => a.evento_id).filter(Boolean))]
        
        if (eventoIds.length > 0) {
          const { data: eventos } = await supabase
            .from('rh_calendario_eventos')
            .select('id, data_evento, titulo, tipo_evento')
            .in('id', eventoIds)
          
          // Mapear eventos aos alertas
          const eventosMap = {}
          if (eventos) {
            eventos.forEach(e => {
              eventosMap[e.id] = e
            })
          }
          
          // Filtrar apenas alertas cujos eventos estão próximos ou passados
          const filteredAlerts = data.filter(alert => {
            if (!alert.evento_id) return false
            const evento = eventosMap[alert.evento_id]
            if (!evento) return false
            return evento.data_evento <= today
          })
          
          setAlerts(filteredAlerts)
        } else {
          setAlerts([])
        }
      } else {
        setAlerts([])
      }
    } catch (error) {
      console.error('Erro ao carregar alertas:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-card rounded-lg border border-border shadow-sm p-4 md:p-6">
        <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
          <div className="p-2 bg-warning/10 rounded-lg">
            <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-warning" />
          </div>
          <h3 className="text-base md:text-lg font-semibold text-foreground">ALERTAS</h3>
        </div>
        <p className="text-muted-foreground text-sm">Carregando...</p>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-xl border-2 border-warning/20 shadow-sm p-5 md:p-6 hover:shadow-lg transition-all duration-200">
      <div className="flex items-center gap-3 mb-4 md:mb-5">
        <div className="p-2.5 bg-warning/10 rounded-xl">
          <AlertTriangle className="w-5 h-5 md:w-6 md:h-6 text-warning" />
        </div>
        <div>
          <h3 className="text-lg md:text-xl font-bold text-foreground">
            Alertas Pendentes
          </h3>
          <p className="text-xs md:text-sm text-muted-foreground">
            Requerem atenção imediata
          </p>
        </div>
      </div>
      
      {alerts.length === 0 ? (
        <div className="text-center py-8">
          <AlertTriangle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Nenhum alerta pendente</p>
          <p className="text-xs text-muted-foreground mt-1">Tudo em ordem! 🎉</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {alerts.map((alert) => {
            const priorityConfig = {
              alta: {
                bg: 'bg-destructive/10',
                border: 'border-destructive/30',
                text: 'text-destructive',
                badge: 'bg-destructive text-destructive-foreground',
              },
              media: {
                bg: 'bg-warning/10',
                border: 'border-warning/30',
                text: 'text-warning',
                badge: 'bg-warning text-warning-foreground',
              },
              baixa: {
                bg: 'bg-primary/10',
                border: 'border-primary/30',
                text: 'text-primary',
                badge: 'bg-primary text-primary-foreground',
              },
            }
            const config = priorityConfig[alert.prioridade] || priorityConfig.baixa
            
            return (
              <li
                key={alert.id}
                className={`p-4 rounded-lg border-2 ${config.border} ${config.bg} hover:shadow-md transition-all`}
              >
                <div className="flex items-start gap-3">
                  <div className={`${config.badge} px-2 py-1 rounded-md text-xs font-semibold uppercase shrink-0`}>
                    {alert.prioridade}
                  </div>
                  <p className={`text-sm md:text-base font-medium ${config.text} flex-1`}>
                    {alert.mensagem}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

