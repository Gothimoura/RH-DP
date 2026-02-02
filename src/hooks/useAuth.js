import { useState, useEffect, useCallback, useRef } from 'react'
import { authService } from '@/services/auth.service'
import { usersService } from '@/services/users.service'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)
  const initializedRef = useRef(false)

  const loadUserData = useCallback(async (userId) => {
    try {
      const data = await usersService.getById(userId)
      setUserData(data)
    } catch (error) {
      // Se o usuário não existe na tabela Users, não é um erro crítico
      if (error?.code === 'PGRST116') {
        console.log('Usuário não encontrado na tabela Users')
      } else {
        console.error('Erro ao carregar dados do usuário:', error)
      }
      setUserData(null)
    }
  }, [])

  useEffect(() => {
    let mounted = true
    let timeoutId = null

    // Timeout de segurança para evitar loading eterno (5 segundos)
    timeoutId = setTimeout(() => {
      if (mounted && !initializedRef.current) {
        console.warn('Timeout de autenticação - forçando fim do loading')
        initializedRef.current = true
        setLoading(false)
      }
    }, 5000)

    const initializeAuth = async () => {
      // Evitar inicialização duplicada
      if (initializedRef.current) return
      
      try {
        // Carregar sessão inicial
        const session = await authService.getSession()
        
        if (mounted && !initializedRef.current) {
          initializedRef.current = true
          if (session?.user) {
            setUser(session.user)
            // Carregar userData em paralelo, não bloquear
            loadUserData(session.user.id).catch(() => {})
          } else {
            setUser(null)
            setUserData(null)
          }
          setLoading(false)
        }
      } catch (error) {
        console.error('Erro ao inicializar autenticação:', error)
        // Se houver erro de sessão corrompida, limpar
        if (error?.message?.includes('invalid') || error?.message?.includes('expired') || error?.message?.includes('JWT')) {
          try {
            localStorage.removeItem('rh-dp-auth')
            await authService.signOut()
          } catch (e) {
            // Ignorar erros ao limpar
          }
        }
        if (mounted && !initializedRef.current) {
          initializedRef.current = true
          setUser(null)
          setUserData(null)
          setLoading(false)
        }
      }
    }

    initializeAuth()
    
    // Escutar mudanças de autenticação
    const { data: { subscription } } = authService.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      // Ignorar INITIAL_SESSION se já inicializamos manualmente
      if (event === 'INITIAL_SESSION' && initializedRef.current) {
        return
      }

      // Marcar como inicializado se ainda não foi
      if (!initializedRef.current) {
        initializedRef.current = true
      }

      if (session?.user) {
        setUser(session.user)
        loadUserData(session.user.id).catch(() => {})
      } else {
        setUser(null)
        setUserData(null)
      }
      setLoading(false)
    })

    return () => {
      mounted = false
      if (timeoutId) clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [loadUserData])

  const signOut = async () => {
    try {
      await authService.signOut()
      setUser(null)
      setUserData(null)
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }

  return {
    user,
    userData,
    loading,
    signOut,
  }
}

