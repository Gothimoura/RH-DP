import { useState, useEffect } from 'react'
import { calendarioService } from '@/services/calendario.service'
import { colaboradoresService } from '@/services/colaboradores.service'

export function useCalendar(filters = {}) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadEvents()
  }, [JSON.stringify(filters)])

  const loadEvents = async () => {
    try {
      setLoading(true)
      setError(null)

      const eventsData = await calendarioService.getEvents(filters)
      
      // Buscar nomes dos colaboradores
      const colaboradorIds = [...new Set(eventsData.map(e => e.colaborador_id).filter(Boolean))]
      let colaboradoresMap = {}
      
      if (colaboradorIds.length > 0) {
        const colaboradores = await colaboradoresService.getByIds(colaboradorIds)
        colaboradoresMap = colaboradores.reduce((acc, c) => {
          acc[c.ID] = c.Nome
          return acc
        }, {})
      }

      const eventsWithNames = eventsData.map(event => ({
        ...event,
        colaboradorNome: colaboradoresMap[event.colaborador_id] || null
      }))

      setEvents(eventsWithNames)
    } catch (err) {
      setError(err.message)
      console.error('Erro ao carregar eventos:', err)
    } finally {
      setLoading(false)
    }
  }

  const createEvent = async (eventData) => {
    try {
      const newEvent = await calendarioService.createEvent(eventData)
      await loadEvents()
      return newEvent
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const updateEvent = async (eventId, updates) => {
    try {
      const updatedEvent = await calendarioService.updateEvent(eventId, updates)
      await loadEvents()
      return updatedEvent
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const deleteEvent = async (eventId) => {
    try {
      await calendarioService.deleteEvent(eventId)
      await loadEvents()
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  return {
    events,
    loading,
    error,
    createEvent,
    updateEvent,
    deleteEvent,
    refetch: loadEvents,
  }
}

