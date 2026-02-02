import { useState, useEffect } from 'react'
import { X, User, Loader2 } from 'lucide-react'
import { usersService } from '@/services/users.service'

export default function AssignUserModal({ isOpen, onClose, onAssign, currentUserId = null }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedUserId, setSelectedUserId] = useState(currentUserId || '')
  const [assigning, setAssigning] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadUsers()
      setSelectedUserId(currentUserId || '')
    }
  }, [isOpen, currentUserId])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const data = await usersService.getAll()
      setUsers(data || [])
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
      alert('Erro ao carregar lista de usuários')
    } finally {
      setLoading(false)
    }
  }

  const handleAssign = async () => {
    if (!selectedUserId) {
      alert('Selecione um usuário')
      return
    }

    setAssigning(true)
    try {
      await onAssign(selectedUserId)
      onClose()
    } catch (error) {
      alert('Erro ao atribuir usuário: ' + (error.message || 'Erro desconhecido'))
    } finally {
      setAssigning(false)
    }
  }

  const handleRemove = async () => {
    setAssigning(true)
    try {
      await onAssign(null)
      onClose()
    } catch (error) {
      alert('Erro ao remover atribuição: ' + (error.message || 'Erro desconhecido'))
    } finally {
      setAssigning(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-xl max-w-md w-full">
        <div className="sticky top-0 bg-card border-b border-border p-6 flex items-center justify-between rounded-t-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Atribuir Responsável</h2>
              <p className="text-sm text-muted-foreground">Selecione um usuário para atribuir ao card</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            disabled={assigning}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Usuário Responsável
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-foreground"
                  disabled={assigning}
                >
                  <option value="">Nenhum (remover atribuição)</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name || user.email || 'Usuário sem nome'}
                    </option>
                  ))}
                </select>
              </div>

              {currentUserId && (
                <div className="bg-primary/10 dark:bg-primary/20 border border-primary/20 rounded-lg p-3">
                  <p className="text-sm text-primary">
                    <strong>Atual:</strong>{' '}
                    {users.find(u => u.id === currentUserId)?.name || 
                     users.find(u => u.id === currentUserId)?.email || 
                     'Usuário não encontrado'}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="sticky bottom-0 bg-card border-t border-border p-4 flex justify-end gap-3 rounded-b-lg">
          <button
            onClick={onClose}
            className="px-4 py-2 text-foreground bg-secondary border border-border rounded-lg hover:bg-muted transition-colors"
            disabled={assigning}
          >
            Cancelar
          </button>
          {currentUserId && (
            <button
              onClick={handleRemove}
              className="px-4 py-2 text-destructive bg-secondary border border-destructive/30 rounded-lg hover:bg-destructive/10 transition-colors"
              disabled={assigning}
            >
              Remover
            </button>
          )}
          <button
            onClick={handleAssign}
            disabled={assigning || !selectedUserId}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {assigning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Atribuindo...
              </>
            ) : (
              <>
                <User className="w-4 h-4" />
                {currentUserId ? 'Atualizar' : 'Atribuir'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

