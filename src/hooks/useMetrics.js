import { useState, useEffect } from 'react'
import { metricsService } from '@/services/metrics.service'

export function useMetrics() {
  const [metrics, setMetrics] = useState({
    funcionarios: 0,
    notebooks: 0,
    celulares: 0,
    processos: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadMetrics()
  }, [])

  const loadMetrics = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await metricsService.getMetrics()
      setMetrics(data)
    } catch (err) {
      setError(err.message)
      console.error('Erro ao carregar métricas:', err)
    } finally {
      setLoading(false)
    }
  }

  return {
    metrics,
    loading,
    error,
    refetch: loadMetrics,
  }
}

