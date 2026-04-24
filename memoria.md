# Memória do Projeto IbaSocial3

Este documento serve como memória persistente das decisões arquiteturais, alterações estruturais e regras de negócio do sistema IbaSocial3.

## 📌 Visão Geral
Sistema de gestão social para a Igreja Batista Atitude, integrando controle de estoque, doações, saídas e gestão de células, utilizando Google Sheets como backend.

## 🛠️ Stack Tecnológica
- **Frontend**: Next.js 14 (App Router)
- **Estilização**: Tailwind CSS (Identidade visual: Laranja e Branco)
- **Backend**: Google Sheets API (via `googleapis`)
- **Autenticação**: Admin Auth via lib dedicada

---

## 🏗️ Estrutura de Dados e Regras de Negócio

### 1. Estoque (`estoque`)
- **Identificador**: `nome_produto` (O campo `id_produto` foi removido para simplificar a gestão).
- **Colunas**: `id_estoque`, `nome_produto`, `quantidade_kg`, `data_atualizacao`, `observacao`.
- **Regra**: O sistema realiza *upsert* baseado no nome do produto.

### 2. Doações (`doacoes`)
- **Colunas**: `id_doacao`, `Rede`, `Celula`, `Produto`, `Quantidade (kg)`, `Obsercacoes`.
- **UX**: Fluxo invertido - o usuário seleciona a **Célula** primeiro, e o sistema preenche a **Rede** automaticamente.
- **Integração**: Toda doação registrada dispara automaticamente um incremento na quantidade do produto correspondente na tabela de **Estoque**.
- **Regra**: Se o produto doado não existir no estoque, uma nova entrada é criada.

### 3. Células (`celula`)
- **Colunas**: `id_celula`, `Rede`, `NomeDaCelula`, `Lider`, `Telefone`, `Supervisor`, `TelefoneSupervisor`, `email`.
- **Ajuste Crítico**: A Coluna B é `Rede` e a Coluna C é `NomeDaCelula`. O sistema foi corrigido para não inverter esses campos.

### 4. Produtos (`produtos`)
- Lista mestre de produtos ativos para seleção nos módulos de doação e estoque.

---

## 🎨 Identidade Visual e UI/UX
- **Paleta**: Laranja (`orange-500/600`) para ações principais e tons neutros para tabelas.
- **Home**: Dashboard centralizado com grid de cards para acesso rápido a todos os módulos.
- **Componentes**: 
    - `NavBar`: Navegação fixa com links para Início e Pedidos.
    - `Footer`: Identidade institucional com logo da Igreja Batista Atitude.

---

## 📝 Histórico de Mudanças Importantes (Últimas)
- **Remoção de ID Técnico**: Migração de `id_produto` para `nome_produto` em todo o ecossistema (Estoque/Doações/API).
- **Fluxo Automatizado**: Implementação da função `incrementarEstoquePorNome` para sincronizar doações e saldo de estoque.
- **Correção de Mapeamento**: Ajuste nos índices de colunas das Células para coincidir com o layout manual da planilha.

---
*Última atualização: 24/04/2026*
