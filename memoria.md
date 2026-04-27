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
- **Identificador**: `nome_produto` (Chave primária de negócio).
- **Colunas (Google Sheets)**:
    - **A**: `id_estoque`
    - **B**: `nome_produto`
    - **C**: `quantidade_kg` (Físico)
    - **D**: `quantidade_solicitada_kg` (Reservado)
    - **E**: `saldo_kg` (Saldo Real = Físico - Reservado)
    - **F**: `data_atualizacao`
    - **G**: `observacao`
- **Regra**: O sistema realiza *upsert* baseado no nome do produto. O saldo é recalculado a cada operação.

### 2. Doações (`doacoes`)
- **Colunas**: `id_doacao`, `Rede`, `Celula`, `Produto`, `Quantidade (kg)`, `Obsercacoes`.
- **UX**: Fluxo invertido - o usuário seleciona a **Célula** primeiro, e o sistema preenche a **Rede** automaticamente.
- **Integração**: Toda doação registrada dispara automaticamente um incremento na quantidade do produto correspondente na tabela de **Estoque**.
- **Regra**: Se o produto doado não existir no estoque, uma nova entrada é criada.

### 3. Pedidos e Reservas (`pedidos`)
- **Cestas**: O sistema diferencia entre **Cesta Adulto** e **Cesta Kids** (calculado automaticamente se houver 1 ou mais crianças).
- **Reserva Automática**: Todo novo pedido (`appendRow` em `pedidos`) dispara a função `reservarEstoquePorPedido`.
- **Cálculo de Reserva**:
    - Para cada produto na tabela `produtos`, o sistema busca as colunas `Adulto (kg)` e `Kids (kg)`.
    - A quantidade correspondente ao tipo da cesta é somada à coluna `quantidade_solicitada_kg` no estoque.
    - O `saldo_kg` é recalculado instantaneamente.

### 4. Produtos (`produtos`)
- **Configuração de Cestas**: Inclui colunas para definir a composição padrão em Kg para cestas Adulto e Kids.

---

## 🎨 Identidade Visual e UI/UX
- **Paleta**: Laranja (`orange-500/600`) para ações principais e tons neutros para tabelas.
- **Home**: Dashboard centralizado com grid de cards para acesso rápido a todos os módulos.
- **Componentes**: 
    - `NavBar`: Navegação fixa com links para Início e Pedidos.
    - `Footer`: Identidade institucional com logo da Igreja Batista Atitude e créditos para Alexander Araujo.

---

## 📝 Histórico de Mudanças Importantes (Últimas)
- **Refatoração do Parsing de Datas**: Implementação da função `parseBRDate` robusta em `lib/dateUtils.ts` para lidar com o formato brasileiro (`DD/MM/YYYY`) vindo do Google Sheets, eliminando erros de interpretação de meses (ex: Abril interpretado como Dezembro) e falhas de "Invalid Date".
- **Unificação de Lógica de Datas**: Integração do novo parsing em `app/doacoes/page.tsx` (agrupamento e exibição) e `app/api/analises/route.ts`, garantindo consistência total entre o histórico e os gráficos.
- **Aprimoramento de UI nas Análises**: Padronização de cores por Rede (ex: Rede Vermelha = Cor Vermelha), remoção de casas decimais em KPIs críticos e conversão de gráficos de pizza para Donut.
- **Auditoria de Integridade**: Auditoria realizada via scripts de monitoramento confirmando que a integridade dos dados no Sheets estava preservada, sendo as anomalias apenas erros de renderização no frontend.
- **Deploy via CLI**: Utilização do Vercel CLI para deploy manual forçado, garantindo a aplicação imediata das correções em produção.

---
*Última atualização: 27/04/2026*
