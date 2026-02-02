import { useEffect } from 'react'
import MainLayout from '@/components/shared/MainLayout'
import MetricCard from '@/components/Dashboard/MetricCard'
import CalendarToday from '@/components/Dashboard/CalendarToday'
import AlertsPanel from '@/components/Dashboard/AlertsPanel'
import QuickActions from '@/components/Dashboard/QuickActions'
import { useMetrics } from '@/hooks/useMetrics'
import { Users, Laptop, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react'

export default function HomePage() {
  const { metrics, loading } = useMetrics()

  return (
    <>
      {/* Estilos CSS para animação de fundo */}
      <style>{`
        .home-background-animation {
          position: relative;
          overflow: hidden;
        }
        
        /* Gradiente rotativo simples */
        .home-background-animation::before {
          content: '';
          position: fixed;
          top: 50%;
          left: 50%;
          width: 200%;
          height: 200%;
          background: conic-gradient(
            from 0deg, 
            transparent 0deg, 
            rgba(59, 130, 246, 0.08) 90deg, 
            transparent 180deg, 
            rgba(59, 130, 246, 0.08) 270deg, 
            transparent 360deg
          );
          z-index: 0;
          pointer-events: none;
          animation: rotate-slow 50s linear infinite;
        }
        
        @keyframes rotate-slow {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        
        @media (prefers-color-scheme: dark) {
          .home-background-animation::before {
            opacity: 1;
          }
        }
      `}</style>
      
      <MainLayout>
        <div className="home-background-animation">
          <div className="space-y-6 md:space-y-8 relative z-10">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Bem-vindo ao Sistema RH/DP
          </h1>
          <p className="text-muted-foreground text-base md:text-lg">
            Visão geral e controle centralizado de recursos humanos e departamento pessoal
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Carregando informações...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Cards de Métricas - Grid melhorado */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <MetricCard
                title="Funcionários"
                value={metrics.funcionarios}
                subtitle="Total de colaboradores ativos"
                icon={<Users className="w-6 h-6" />}
                color="primary"
              />
              <MetricCard
                title="Equipamentos"
                value={`${metrics.notebooks + metrics.celulares}`}
                subtitle={`${metrics.notebooks} notebooks • ${metrics.celulares} celulares`}
                icon={<Laptop className="w-6 h-6" />}
                color="success"
              />
              <MetricCard
                title="Processos"
                value={metrics.processos}
                subtitle="Onboarding em andamento"
                icon={<CheckCircle className="w-6 h-6" />}
                color="warning"
              />
              <MetricCard
                title="Alertas"
                value={metrics.alertas || 0}
                subtitle="Pendentes de atenção"
                icon={<AlertTriangle className="w-6 h-6" />}
                color="danger"
              />
            </div>

            {/* Grid de 2 colunas - Calendário e Alertas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              <CalendarToday />
              <AlertsPanel />
            </div>

            {/* Atalhos */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-primary" />
                <h2 className="text-xl md:text-2xl font-semibold text-foreground">
                  Atalhos
                </h2>
              </div>
              <QuickActions />
            </div>
          </>
        )}
          </div>
        </div>
      </MainLayout>
    </>
  )
}

