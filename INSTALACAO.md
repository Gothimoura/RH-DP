# 📦 Guia de Instalação - Sistema RH/DP

## Pré-requisitos

- Node.js 18+ instalado
- npm ou yarn instalado
- Conta no Supabase com o banco de dados configurado

## Passo a Passo

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto com o seguinte conteúdo:

```env
NEXT_PUBLIC_SUPABASE_URL=https://quzpakmslmcifvpjkdod.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1enBha21zbG1jaWZ2cGprZG9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5NDQyNDIsImV4cCI6MjA4MDUyMDI0Mn0._WS18cJNzfqv5jwzWKzGNqG-wMKnk3aLTzXn44Z3y3U
```

**Nota:** As credenciais já estão no arquivo `env.config` como referência.

### 3. Executar o Projeto

```bash
npm run dev
```

### 4. Acessar o Sistema

Abra seu navegador em: `http://localhost:3000`

## 🔐 Autenticação

O sistema usa Supabase Auth. Você precisa:

1. Criar usuários no Supabase Authentication
2. Criar registros correspondentes na tabela `Users` do banco de dados

### Criar Usuário Manualmente

1. Acesse o Supabase Dashboard
2. Vá em Authentication > Users
3. Crie um novo usuário
4. No banco de dados, insira um registro na tabela `Users` com:
   - `🔒 Row ID`: ID do usuário criado no Auth
   - `Name`: Nome do usuário
   - `Email`: Email do usuário
   - `Role`: Papel do usuário (admin, rh, ti, manager, employee)

## 🗄️ Estrutura do Banco de Dados

O sistema já está configurado para usar as tabelas existentes no Supabase:

- **Tabelas principais:** Colaboradores, CELULARES, NOTEBOOK, LINHAS, CCs, Users, Etapas
- **Novas tabelas:** kanban_cartoes, calendario_eventos, documentos_templates, etc.

**Importante:** O sistema compartilha o banco com o sistema de medidores (hidrômetros/energia), mas não há conflito pois os nomes são diferentes.

## 🚀 Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Cria build de produção
- `npm run start` - Inicia servidor de produção
- `npm run lint` - Executa o linter

## 📝 Próximos Passos

Após a instalação:

1. Configure os templates de documentos na tabela `documentos_templates`
2. Configure as métricas iniciais na tabela `painel_metricas`
3. Crie eventos no calendário através da interface
4. Adicione colaboradores ao sistema

## ⚠️ Problemas Comuns

### Erro de conexão com Supabase
- Verifique se as variáveis de ambiente estão corretas
- Confirme que o projeto Supabase está ativo

### Erro de autenticação
- Verifique se o usuário existe no Supabase Auth
- Confirme que há um registro correspondente na tabela `Users`

### Erro ao carregar dados
- Verifique as permissões RLS (Row Level Security) no Supabase
- Confirme que as tabelas existem no banco de dados

