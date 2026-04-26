# Plano de Projeto: Integração Pedidos e Saídas

Este plano detalha a correção na lógica da aplicação para que todos os pedidos atualizem a tabela de saídas.

## 1. Contexto e Objetivos
- Todo pedido criado deve gerar uma linha com status 'Pendente' na tabela `SAIDAS`.
- No momento da entrega, o status muda para 'Entregue' e as informações de entrega são preenchidas.
- O número da cesta é gerado apenas no momento da entrega.
- Exclusão de pedidos remove registros correspondentes em `SAIDAS`.

## 2. Mudanças Propostas

### Fase 1: Sincronização de Esquema
- Adicionar coluna `status` em `SAIDAS`.
- Atualizar tipos TypeScript.

### Fase 2: Lógica de Registro (Create/Delete)
- Modificar `lib/googleSheets.ts` para criar registro pendente no `appendRow`.
- Modificar `lib/googleSheets.ts` para deletar registro no `deletePedidoRow`.

### Fase 3: Lógica de Entrega (Update)
- Refatorar `lib/saidasSheets.ts` para atualizar linhas existentes em vez de adicionar novas.

### Fase 4: Migração
- Executar script de sincronização para pedidos atuais.

## 3. Checklist de Verificação
- [ ] Pedido novo cria linha Pendente.
- [ ] Entrega atualiza linha para Entregue.
- [ ] Exclusão remove linha de Saída.
- [ ] Cesta Básica é incrementada corretamente na entrega.
