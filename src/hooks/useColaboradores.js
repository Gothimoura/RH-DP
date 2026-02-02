import { useState, useEffect } from 'react'
import { colaboradoresService } from '@/services/colaboradores.service'

export function useColaboradores() {
  const [colaboradores, setColaboradores] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadColaboradores()
  }, [])

  const loadColaboradores = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await colaboradoresService.getAll()
      setColaboradores(data)
    } catch (err) {
      setError(err.message)
      console.error('Erro ao carregar colaboradores:', err)
    } finally {
      setLoading(false)
    }
  }

  return {
    colaboradores,
    loading,
    error,
    refetch: loadColaboradores,
  }
}

