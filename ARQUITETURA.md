# 🏗️ Arquitetura do Sistema RH/DP

## 📋 Padrões e Boas Práticas Implementadas

Este documento descreve a arquitetura e os padrões seguidos no sistema.

## 🎯 Estrutura de Pastas

```
src/
├── app/                    # Next.js App Router (páginas)
│   ├── (auth)/            # Rotas de autenticação
│   ├── dashboard/         # Dashboard principal
│   └── ...
├── components/            # Componentes React
│   ├── Dashboard/        # Componentes específicos do dashboard
│   ├── Kanban/           # Componentes do kanban
│   └── shared/           # Componentes compartilhados
├── hooks/                # React Hooks customizados
│   ├── useAuth.js       # Autenticação
│   ├── useKanban.js     # Kanban
│   ├── useCalendar.js   # Calendário
│   └── ...
├── services/             # Camada de serviços (lógica de negócio)
│   ├── auth.service.js
│   ├── colaboradores.service.js
│   ├── kanban.service.js
│   └── ...
└── lib/                  # Utilitários e configurações
    ├── supabase/        # Cliente Supabase (client/server/middleware)
    ├── errors.js        # Tratamento de erros
    └── utils.js         # Funções utilitárias
```

## 🔄 Camadas da Aplicação

### 1. **Camada de Apresentação (Components)**
- Componentes React puros e reutilizáveis
- Responsáveis apenas pela apresentação
- Recebem dados via props ou hooks

### 2. **Camada de Lógica (Hooks)**
- Hooks customizados que encapsulam lógica de estado
- Gerenciam loading, error e data
- Fazem chamadas aos services

### 3. **Camada de Serviços (Services)**
- Classes que encapsulam lógica de negócio
- Fazem comunicação com o Supabase
- Tratam transformações de dados
- Isolam a lógica de acesso a dados

### 4. **Camada de Dados (Supabase)**
- Cliente Supabase configurado
- Separação entre client-side e server-side
- Middleware para autenticação

## 🎨 Padrões Implementados

### **Service Layer Pattern**
Cada módulo tem seu próprio service que encapsula todas as operações relacionadas:

```javascript
// Exemplo: kanban.service.js
export class KanbanService {
  async getCards() { ... }
  async moveCard() { ... }
  async updateCard() { ... }
}
```

### **Custom Hooks Pattern**
Hooks específicos para cada funcionalidade:

```javascript
// Exemplo: useKanban.js
export function useKanban() {
  const { cards, employees, loading, error, moveCard } = useKanban()
  // ...
}
```

### **Separation of Concerns**
- **Components**: Apenas UI
- **Hooks**: Gerenciamento de estado
- **Services**: Lógica de negócio
- **Lib**: Configurações e utilitários

## 🔐 Autenticação

### **Middleware de Autenticação**
- Protege rotas automaticamente
- Redireciona usuários não autenticados
- Gerencia sessões do Supabase

### **Hook useAuth**
- Gerencia estado de autenticação
- Carrega dados do usuário
- Fornece métodos de sign in/out

## 📦 Services Disponíveis

### **AuthService**
- `signIn(email, password)`
- `signUp(email, password, metadata)`
- `signOut()`
- `getSession()`
- `getUser()`

### **ColaboradoresService**
- `getAll()`
- `getById(id)`
- `getByIds(ids)`
- `create(colaborador)`
- `update(id, updates)`

### **KanbanService**
- `getCards()`
- `moveCard(cardId, newColumn, newPosition, userId)`
- `updateCard(cardId, updates)`
- `createCard(cardData)`

### **CalendarioService**
- `getEvents(filters)`
- `getTodayEvents()`
- `createEvent(eventData)`
- `updateEvent(eventId, updates)`
- `deleteEvent(eventId)`

### **MetricsService**
- `getMetrics()`
- `updateMetric(chave, valor, label, icone, cor)`

### **UsersService**
- `getCurrentUser()`
- `getById(id)`
- `create(userData)`
- `update(id, updates)`

## 🎣 Hooks Disponíveis

### **useAuth**
Gerencia autenticação do usuário:
```javascript
const { user, userData, loading, signOut } = useAuth()
```

### **useKanban**
Gerencia estado do kanban:
```javascript
const { cards, employees, loading, error, moveCard, updateCard } = useKanban()
```

### **useCalendar**
Gerencia eventos do calendário:
```javascript
const { events, loading, error, createEvent, updateEvent } = useCalendar(filters)
```

### **useMetrics**
Gerencia métricas do dashboard:
```javascript
const { metrics, loading, error } = useMetrics()
```

### **useColaboradores**
Gerencia lista de colaboradores:
```javascript
const { colaboradores, loading, error, refetch } = useColaboradores()
```

## 🛡️ Tratamento de Erros

### **Classe AppError**
Erros customizados com código e status:

```javascript
throw new AppError('Mensagem', 'ERROR_CODE', 400)
```

### **Função handleError**
Padroniza tratamento de erros:

```javascript
const errorInfo = handleError(error)
// Retorna: { message, code, statusCode }
```

## 🚀 Benefícios da Arquitetura

1. **Manutenibilidade**: Código organizado e fácil de entender
2. **Testabilidade**: Services e hooks podem ser testados isoladamente
3. **Reutilização**: Services e hooks podem ser reutilizados
4. **Escalabilidade**: Fácil adicionar novas funcionalidades
5. **Separação de Responsabilidades**: Cada camada tem sua função específica
6. **Type Safety**: Preparado para migração para TypeScript

## 📝 Próximos Passos

- [ ] Migrar para TypeScript
- [ ] Adicionar testes unitários
- [ ] Implementar Server Components onde possível
- [ ] Adicionar validação de dados com Zod
- [ ] Implementar cache com React Query
- [ ] Adicionar logging estruturado

