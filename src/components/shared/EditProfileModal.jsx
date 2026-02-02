import { useState, useEffect, useRef } from 'react'
import { X, User, Mail, Image, Save, Loader2, Upload, Trash2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { usersService } from '@/services/users.service'
import { supabase } from '@/lib/supabase'

export default function EditProfileModal({ isOpen, onClose }) {
  const { user, userData, signOut } = useAuth()
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [photo, setPhoto] = useState('')
  const [photoPreview, setPhotoPreview] = useState('')
  const [photoFile, setPhotoFile] = useState(null)
  const [role, setRole] = useState('')
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (isOpen && userData) {
      setName(userData.Name || '')
      setEmail(userData.Email || user?.email || '')
      setPhoto(userData.Photo || '')
      setPhotoPreview(userData.Photo || '')
      setRole(userData.Role || '')
      setError('')
      setPhotoFile(null)
    } else if (isOpen && user) {
      setName('')
      setEmail(user.email || '')
      setPhoto('')
      setPhotoPreview('')
      setRole('')
      setError('')
      setPhotoFile(null)
    }
  }, [isOpen, userData, user])

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      setError('Por favor, selecione um arquivo de imagem válido')
      return
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('A imagem deve ter no máximo 5MB')
      return
    }

    setPhotoFile(file)
    setError('')

    // Criar preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPhotoPreview(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const handleRemovePhoto = () => {
    setPhotoFile(null)
    setPhotoPreview('')
    setPhoto('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const uploadPhoto = async (file) => {
    if (!file || !user) return null

    setUploadingPhoto(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`

      // Fazer upload do arquivo diretamente no bucket avatars
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true // Permite sobrescrever se já existir
        })

      if (uploadError) {
        // Se o bucket não existir, informar ao usuário
        if (uploadError.message.includes('Bucket not found') || uploadError.message.includes('not found')) {
          throw new Error('Bucket de armazenamento não configurado. Execute o script migrate_create_avatars_bucket.sql no Supabase.')
        }
        throw uploadError
      }

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      return publicUrl
    } catch (err) {
      console.error('Erro ao fazer upload da foto:', err)
      throw new Error('Erro ao fazer upload da foto: ' + (err.message || 'Erro desconhecido'))
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    if (!user) {
      setError('Usuário não autenticado')
      return
    }

    setSaving(true)
    try {
      const updates = {}
      
      if (name.trim()) {
        updates.Name = name.trim()
      }
      
      if (email.trim() && email !== user.email) {
        // Atualizar email no Supabase Auth
        const { error: emailError } = await supabase.auth.updateUser({
          email: email.trim()
        })
        
        if (emailError) {
          throw new Error('Erro ao atualizar email: ' + emailError.message)
        }
        
        updates.Email = email.trim()
      }
      
      // Upload da foto se houver arquivo selecionado
      if (photoFile) {
        const photoUrl = await uploadPhoto(photoFile)
        if (photoUrl) {
          updates.Photo = photoUrl
        }
      } else if (photo.trim()) {
        // Se não há arquivo novo mas há URL, manter a URL existente
        updates.Photo = photo.trim()
      }
      
      if (role.trim()) {
        updates.Role = role.trim()
      }

      // Verificar se o usuário existe na tabela Users
      let userExists = false
      try {
        await usersService.getById(user.id)
        userExists = true
      } catch (err) {
        if (err?.code === 'PGRST116') {
          // Usuário não existe, criar registro
          await usersService.create({
            'Row ID': user.id,
            Name: name.trim() || null,
            Email: email.trim() || user.email || null,
            Photo: photo.trim() || null,
            Role: role.trim() || null,
          })
          userExists = true
        } else {
          throw err
        }
      }

      // Se o usuário existe, atualizar
      if (userExists && Object.keys(updates).length > 0) {
        await usersService.update(user.id, updates)
      }

      // Recarregar dados do usuário sem recarregar a página
      // O useAuth vai atualizar automaticamente quando detectar mudanças
      // Por enquanto, recarregamos a página para garantir que tudo está atualizado
      window.location.reload()
    } catch (err) {
      console.error('Erro ao salvar perfil:', err)
      setError(err.message || 'Erro ao salvar perfil. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg border border-border shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-border bg-gradient-to-r from-primary/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-lg">
              <User className="w-5 h-5 md:w-6 md:h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-foreground">
                Editar Perfil
              </h2>
              <p className="text-xs md:text-sm text-muted-foreground">
                Atualize suas informações pessoais
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            disabled={saving}
          >
            <X className="w-5 h-5 text-foreground" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <User className="w-4 h-4 inline mr-1" />
                Nome
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-foreground placeholder:text-muted-foreground"
                placeholder="Seu nome completo"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Nome que será exibido no sistema
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <Mail className="w-4 h-4 inline mr-1" />
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-foreground placeholder:text-muted-foreground"
                placeholder="seu@email.com"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Alterar o e-mail requer confirmação por email
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <Image className="w-4 h-4 inline mr-1" />
                Foto de Perfil
              </label>
              
              {/* Preview da foto */}
              {(photoPreview || photo) && (
                <div className="mb-3 relative inline-block">
                  <img
                    src={photoPreview || photo}
                    alt="Preview"
                    className="w-24 h-24 rounded-full object-cover border-2 border-border"
                  />
                  {photoFile && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="absolute -top-2 -right-2 p-1 bg-destructive text-white rounded-full hover:bg-destructive/90 transition-colors"
                      title="Remover foto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}

              {/* Input de arquivo */}
              <div className="flex items-center gap-3">
                <label className="flex-1 cursor-pointer">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                    disabled={uploadingPhoto || saving}
                  />
                  <div className="flex items-center justify-center gap-2 px-4 py-2 bg-background border-2 border-dashed border-input rounded-lg hover:border-primary transition-colors">
                    <Upload className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">
                      {photoFile ? photoFile.name : 'Selecionar foto'}
                    </span>
                  </div>
                </label>
              </div>
              
              <p className="text-xs text-muted-foreground mt-1">
                Formatos aceitos: JPG, PNG, GIF. Tamanho máximo: 5MB
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Função/Cargo
              </label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-foreground placeholder:text-muted-foreground"
                placeholder="Ex: Gerente de RH"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Sua função ou cargo na empresa
              </p>
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-foreground bg-secondary border border-border rounded-lg hover:bg-muted transition-colors"
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={saving || uploadingPhoto}
            >
              {(saving || uploadingPhoto) ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {uploadingPhoto ? 'Enviando foto...' : 'Salvando...'}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Salvar Alterações
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

