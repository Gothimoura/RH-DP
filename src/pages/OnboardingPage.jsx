import { useState } from 'react'
import MainLayout from '@/components/shared/MainLayout'
import KanbanBoard from '@/components/Kanban/KanbanBoard'
import { UserPlus, UserMinus, Plus } from 'lucide-react'
import { useIsMobile } from '@/hooks/useIsMobile'
import CreateCardModal from '@/components/Kanban/CreateCardModal'

export default function OnboardingPage() {
  const [activeTab, setActiveTab] = useState('entrada')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const isMobile = useIsMobile()

  return (
    <MainLayout>
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Gestão de Funcionários</h1>
            <p className="text-muted-foreground mt-2 text-sm md:text-base">
              Gerencie processos de entrada e saída de colaboradores
            </p>
          </div>
          {!isMobile && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-primary text-white px-3 md:px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors text-sm md:text-base w-full sm:w-auto justify-center"
            >
              <Plus className="w-4 h-4 md:w-5 md:h-5" />
              Criar Card
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="bg-card rounded-lg border border-border shadow-sm">
          <div className="border-b border-border">
            <nav className="flex -mb-px overflow-x-auto">
              <button
                onClick={() => setActiveTab('entrada')}
                className={`flex items-center gap-2 px-4 md:px-6 py-3 md:py-4 border-b-2 font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'entrada'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }`}
              >
                <UserPlus className="w-4 h-4 md:w-5 md:h-5" />
                <span className="text-sm md:text-base">Entrada</span>
              </button>
              <button
                onClick={() => setActiveTab('saida')}
                className={`flex items-center gap-2 px-4 md:px-6 py-3 md:py-4 border-b-2 font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'saida'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }`}
              >
                <UserMinus className="w-4 h-4 md:w-5 md:h-5" />
                <span className="text-sm md:text-base">Saída</span>
              </button>
            </nav>
          </div>

          <div className="p-4 md:p-6">
            {activeTab === 'entrada' && (
              <div>
                <h2 className="text-lg md:text-xl font-semibold text-foreground mb-3 md:mb-4">
                  Processo de Entrada - Onboarding
                </h2>
                <p className="text-muted-foreground mb-4 md:mb-6 text-sm md:text-base">
                  Acompanhe o processo de integração de novos funcionários na empresa
                </p>
                {!isMobile && <KanbanBoard key={`entrada-${refreshKey}`} tipoProcesso="entrada" />}
                {isMobile && (
                  <div className="bg-muted/50 rounded-lg p-6 text-center">
                    <p className="text-muted-foreground">
                      O Kanban não está disponível em dispositivos móveis.
                      <br />
                      Acesse pelo desktop para visualizar.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'saida' && (
              <div>
                <h2 className="text-lg md:text-xl font-semibold text-foreground mb-3 md:mb-4">
                  Processo de Saída - Offboarding
                </h2>
                <p className="text-muted-foreground mb-4 md:mb-6 text-sm md:text-base">
                  Gerencie a saída de funcionários: devolução de equipamentos e bloqueio de acessos
                </p>
                {!isMobile && <KanbanBoard key={`saida-${refreshKey}`} tipoProcesso="saida" />}
                {isMobile && (
                  <div className="bg-muted/50 rounded-lg p-6 text-center">
                    <p className="text-muted-foreground">
                      O Kanban não está disponível em dispositivos móveis.
                      <br />
                      Acesse pelo desktop para visualizar.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {showCreateModal && (
          <CreateCardModal
            tipoProcesso={activeTab === 'entrada' ? 'entrada' : 'saida'}
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              setShowCreateModal(false)
              setRefreshKey(prev => prev + 1)
            }}
          />
        )}
      </div>
    </MainLayout>
  )
}

