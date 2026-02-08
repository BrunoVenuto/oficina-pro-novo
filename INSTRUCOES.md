# Oficina Pro - Sistema de Gestão de Oficinas

Sistema web mobile-first completo para gestão profissional de oficinas mecânicas.

## Funcionalidades

### Dashboard
- Visão geral com métricas importantes
- OS abertas e em andamento
- Faturamento do dia
- Lista de OS recentes
- Busca rápida por placa ou número da OS

### Ordens de Serviço
- Lista completa de OS com filtros por status
- Criação rápida de OS via wizard em 3 etapas
- Detalhamento completo com abas:
  - Resumo (cliente, veículo, problema)
  - Itens (serviços e peças)
  - Checklist do veículo
  - Fotos (antes/durante/depois)
  - Timeline de eventos
- Status coloridos (aberta, em andamento, aguardando peça, concluída, entregue)

### Clientes
- Lista de clientes cadastrados
- Busca por nome, telefone ou email
- Informações completas de contato

### Configurações
- Informações da conta
- Opção de logout

### Integração WhatsApp
- Envio de atualizações para clientes via WhatsApp
- Mensagem pré-formatada com detalhes da OS
- Personalizável antes do envio

## Design System

### Paleta de Cores
- **Base**: Grafite escuro (#0F1216), Cinza aço (#1A1F26)
- **Destaques**: Amarelo mecânico (#FFC107), Azul técnico (#1E88E5)
- **Semânticas**: Verde (#22C55E), Vermelho (#EF4444), Laranja (#F97316)

### Componentes
- Botões grandes (mínimo 48px) para uso com toque
- Cards com bordas arredondadas (12px)
- Chips de status coloridos
- Inputs com foco amarelo
- Alto contraste para uso em ambientes externos

## Como Usar

### Primeira Vez

1. **Criar Conta**
   - Clique em "Não tem conta? Criar agora"
   - Digite email e senha
   - Clique em "Criar conta"
   - Faça login com as credenciais criadas

2. **Ou use a Demonstração**
   - Clique em "Entrar como demonstração"
   - Crie uma conta demo: email `demo@oficina.com` e senha `demo123`

### Criando uma Nova OS

1. Clique no botão flutuante **+** (amarelo, canto inferior direito)
2. **Etapa 1**: Preencha dados do cliente e veículo
   - Nome do cliente (obrigatório)
   - Telefone (obrigatório)
   - Placa do veículo (obrigatório)
3. **Etapa 2**: Detalhes da OS
   - Problema relatado (obrigatório)
   - Quilometragem (obrigatório)
   - Nível de combustível (slider)
   - Previsão de entrega (opcional)
4. **Etapa 3**: Checklist do veículo
   - Marque os itens presentes
5. Clique em "Criar OS"

### Visualizando OS

- No Dashboard ou na lista de OS, clique em qualquer card de OS
- Navegue pelas abas para ver diferentes informações
- Use o botão WhatsApp para enviar atualizações ao cliente

### Navegação

- Use a barra inferior para alternar entre:
  - Dashboard
  - OS (lista completa)
  - Clientes
  - Configurações

## Tecnologias

- **Frontend**: React + TypeScript + Vite
- **Estilização**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Autenticação**: Supabase Auth
- **Ícones**: Lucide React

## Características Técnicas

- Mobile-first (otimizado para celular)
- Componentes reutilizáveis
- Design system completo
- Segurança com Row Level Security (RLS)
- Interface rápida e responsiva
- Alto contraste para ambientes de oficina
