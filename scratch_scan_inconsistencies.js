
const { getRows } = require('./lib/googleSheets');
const { getSaidasRows } = require('./lib/saidasSheets');
const { getEstoque } = require('./lib/estoqueSheets');
const { getProdutos } = require('./lib/produtosSheets');

async function scanInconsistencies() {
  console.log('--- Iniciando Varredura de Dados (IbaSocial3) ---');
  
  try {
    const [pedidos, saidas, estoque, produtos] = await Promise.all([
      getRows(),
      getSaidasRows(),
      getEstoque(),
      getProdutos()
    ]);

    const report = {
      pedidosTotal: pedidos.length,
      saidasTotal: saidas.length,
      inconsistencias: []
    };

    // 1. Pedidos sem Registro em Saídas
    const saidaPedidoIds = new Set(saidas.map(s => s.id_pedido));
    const orphanPedidos = pedidos.filter(p => !saidaPedidoIds.has(p.id_pedido));
    
    if (orphanPedidos.length > 0) {
      report.inconsistencias.push({
        tipo: 'Pedidos sem Saída Correspondente',
        quantidade: orphanPedidos.length,
        detalhes: orphanPedidos.map(p => `ID: ${p.id_pedido} | Beneficiado: ${p.beneficiado} | Status: ${p.status}`)
      });
    }

    // 2. Saídas sem Pedido Correspondente (Órfãs)
    const pedidoIds = new Set(pedidos.map(p => p.id_pedido));
    const orphanSaidas = saidas.filter(s => s.id_pedido && !pedidoIds.has(s.id_pedido));
    
    if (orphanSaidas.length > 0) {
      report.inconsistencias.push({
        tipo: 'Saídas sem Pedido Ativo (Órfãs)',
        quantidade: orphanSaidas.length,
        detalhes: orphanSaidas.map(s => `ID Saída: ${s.id} | Pedido Ref: ${s.id_pedido} | Beneficiado: ${s.beneficiado}`)
      });
    }

    // 3. Conflito de Status (Pedido entregue vs Saída pendente)
    // Note: status do pedido 'novo', 'analise', 'aprovado', 'arquivado', 'finalizado'
    const statusConflicts = saidas.filter(s => {
      const p = pedidos.find(p => p.id_pedido === s.id_pedido);
      if (!p) return false;
      // Se o pedido está arquivado/finalizado mas a saída ainda está Pendente
      return (p.status === 'arquivado' || p.status === 'finalizado') && s.status === 'Pendente';
    });

    if (statusConflicts.length > 0) {
      report.inconsistencias.push({
        tipo: 'Conflito de Status (Pedido Finalizado, Saída Pendente)',
        quantidade: statusConflicts.length,
        detalhes: statusConflicts.map(s => `ID Pedido: ${s.id_pedido} | Beneficiado: ${s.beneficiado}`)
      });
    }

    // 4. Verificação de Estoque Reservado vs Saídas Pendentes
    const pendentesCestas = saidas.filter(s => s.status === 'Pendente');
    const adultPendentes = pendentesCestas.filter(s => s.tipo === 'ADULTO').length;
    const kidsPendentes = pendentesCestas.filter(s => s.tipo === 'KIDS').length;

    // Calcular reserva esperada baseada nos produtos
    // Isso é mais complexo porque depende da composição da cesta em produtos.ts
    // Mas podemos verificar o "Reservado" na tabela estoque
    const estoqueReservadoTotal = estoque.reduce((acc, item) => acc + (Number(item.reservado) || 0), 0);
    
    // Simplificação: apenas informar se há pendências não refletidas ou se o reservado está zerado com saídas pendentes
    if (pendentesCestas.length > 0 && estoqueReservadoTotal === 0) {
      report.inconsistencias.push({
        tipo: 'Estoque não Reservado',
        quantidade: pendentesCestas.length,
        detalhes: ['Existem saídas Pendentes mas o estoque reservado total está zerado.']
      });
    }

    console.log(JSON.stringify(report, null, 2));

  } catch (error) {
    console.error('Erro durante a varredura:', error);
  }
}

scanInconsistencies();
