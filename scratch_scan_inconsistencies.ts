
// Script de Varredura de Dados - Sem dependências externas de env
import fs from 'fs';
import path from 'path';

// Manual env loading for .env.local
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim().replace(/^"|"$/g, '');
    }
  });
}

import { getRows } from './lib/googleSheets.js';
import { getSaidasRows } from './lib/saidasSheets.js';
import { getEstoque } from './lib/estoqueSheets.js';
import { getProdutos } from './lib/produtosSheets.js';

async function scanInconsistencies() {
  console.log('\n🔍 --- INICIANDO VARREDURA DE DADOS (IbaSocial3) ---\n');
  
  try {
    const [pedidos, saidas, estoque, produtos] = await Promise.all([
      getRows(),
      getSaidasRows(),
      getEstoque(),
      getProdutos()
    ]);

    const inconsistencies = [];

    // 1. Pedidos sem Registro em Saídas
    const saidaPedidoIds = new Set(saidas.map(s => s.id_pedido));
    const orphanPedidos = pedidos.filter(p => !saidaPedidoIds.has(p.id_pedido));
    
    if (orphanPedidos.length > 0) {
      inconsistencies.push({
        tipo: 'PEDIDOS SEM REGISTRO EM SAÍDAS',
        severidade: 'ALTA',
        impacto: 'Estoque não reservado e falta de rastreabilidade.',
        quantidade: orphanPedidos.length,
        items: orphanPedidos.map(p => `• [${p.id_pedido}] ${p.beneficiado} (Status: ${p.status})`)
      });
    }

    // 2. Saídas sem Pedido Correspondente
    const pedidoIds = new Set(pedidos.map(p => p.id_pedido));
    const orphanSaidas = saidas.filter(s => s.id_pedido && !pedidoIds.has(s.id_pedido));
    
    if (orphanSaidas.length > 0) {
      inconsistencies.push({
        tipo: 'SAÍDAS ÓRFÃS (SEM PEDIDO ATIVO)',
        severidade: 'MÉDIA',
        impacto: 'Registros de saída vinculados a pedidos deletados.',
        quantidade: orphanSaidas.length,
        items: orphanSaidas.map(s => `• [Saída: ${s.id}] Ref Pedido: ${s.id_pedido} - ${s.beneficiado}`)
      });
    }

    // 3. Conflito de Entrega
    const statusConflicts = saidas.filter(s => {
      const p = pedidos.find(p => p.id_pedido === s.id_pedido);
      if (!p) return false;
      return (p.status === 'arquivado' || p.status === 'finalizado') && s.status === 'Pendente';
    });

    if (statusConflicts.length > 0) {
      inconsistencies.push({
        tipo: 'CONFLITO DE ENTREGA (PEDIDO FINALIZADO MAS SAÍDA PENDENTE)',
        severidade: 'ALTA',
        impacto: 'O estoque permanece "reservado" mesmo após a entrega ter ocorrido logicamente.',
        quantidade: statusConflicts.length,
        items: statusConflicts.map(s => `• Pedido ${s.id_pedido} (${s.beneficiado}) ainda consta como Pendente em Saídas.`)
      });
    }

    // 4. Inconsistência de Cesta (Tipo de Cesta divergente)
    const typeConflicts = saidas.filter(s => {
      const p = pedidos.find(p => p.id_pedido === s.id_pedido);
      if (!p) return false;
      const pType = (p.tipo_cesta || 'ADULTO').toUpperCase();
      const sType = (s.tipo || 'ADULTO').toUpperCase();
      return pType !== sType;
    });

    if (typeConflicts.length > 0) {
      inconsistencies.push({
        tipo: 'DIVERGÊNCIA DE TIPO DE CESTA',
        severidade: 'MÉDIA',
        impacto: 'Reserva de itens errados no estoque.',
        quantidade: typeConflicts.length,
        items: typeConflicts.map(s => {
          const p = pedidos.find(p => p.id_pedido === s.id_pedido);
          return `• Pedido: ${p.tipo_cesta} vs Saída: ${s.tipo} (${s.beneficiado})`;
        })
      });
    }

    // RELATÓRIO FINAL
    console.log('====================================================');
    console.log(`📊 RESUMO GERAL:`);
    console.log(`- Total de Pedidos: ${pedidos.length}`);
    console.log(`- Total de Saídas: ${saidas.length}`);
    console.log(`- Inconsistências Detectadas: ${inconsistencies.length}`);
    console.log('====================================================\n');

    if (inconsistencies.length === 0) {
      console.log('✅ Nenhuma inconsistência detectada. Os dados estão saudáveis.');
    } else {
      inconsistencies.forEach((inc, i) => {
        console.log(`${i + 1}. [${inc.severidade}] ${inc.tipo}`);
        console.log(`   Qtd: ${inc.quantidade}`);
        console.log(`   Impacto: ${inc.impacto}`);
        inc.items.slice(0, 10).forEach(item => console.log(`   ${item}`));
        if (inc.items.length > 10) console.log(`   ... e mais ${inc.items.length - 10} itens.`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ ERRO DURANTE A VARREDURA:', error);
  }
}

scanInconsistencies();
