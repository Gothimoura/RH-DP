# Sistema RH/DP

Sistema web integrado de RH/DP para automatizar o processo de onboarding de funcionários e gestão de equipamentos.

## 🚀 Tecnologias

- **Vite** - Build tool e dev server
- **React 18** - Biblioteca UI
- **React Router** - Roteamento
- **Supabase** - Backend (PostgreSQL + Auth + Storage)
- **Tailwind CSS** - Estilização
- **React Beautiful DnD** - Drag & Drop no Kanban
- **React Big Calendar** - Calendário de eventos
- **jsPDF** - Geração de PDFs

## 📦 Instalação

1. Instale as dependências:
```bash
npm install
```

2. Configure as variáveis de ambiente:
Crie um arquivo `.env` na raiz do projeto:
```env
VITE_SUPABASE_URL=https://quzpakmslmcifvpjkdod.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-aqui
```

3. Execute o projeto:
```bash
npm run dev
```

4. Acesse `http://localhost:3000`

## 🗂️ Estrutura do Projeto

```
src/
├── pages/              # Páginas React Router
├── components/         # Componentes React
│   ├── Dashboard/     # Componentes do dashboard
│   ├── Kanban/        # Componentes do kanban
│   └── shared/        # Componentes compartilhados
├── hooks/             # React Hooks customizados
├── services/          # Camada de serviços (lógica de negócio)
└── lib/               # Utilitários e configurações
    ├── supabase/      # Cliente Supabase
    └── utils.js       # Funções utilitárias
```

## 🔐 Autenticação

O sistema usa Supabase Auth. Para fazer login, você precisa ter uma conta criada no Supabase.

## 📋 Funcionalidades

- ✅ Dashboard com métricas e eventos do dia
- ✅ Kanban de onboarding com drag & drop
- ✅ Calendário de eventos
- ✅ Gerador de documentos em PDF
- ✅ Ações rápidas
- ✅ Sistema de notificações
- ✅ Relatórios

## 🎨 Design System

Cores principais:
- Primary: `#0080FF` (Azul)
- Success: `#00FF00` (Verde)
- Warning: `#FFA500` (Laranja)
- Danger: `#FF0000` (Vermelho)

## 🚀 Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Cria build de produção
- `npm run preview` - Preview do build de produção
- `npm run lint` - Executa o linter

## 📝 Observações

- O sistema compartilha o banco de dados com o sistema de medidores (hidrômetros/energia), mas não há risco de conflito pois os nomes das tabelas são diferentes.
