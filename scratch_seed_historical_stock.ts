import fs from 'fs';
import path from 'path';

// Manual loading of .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf-8');
  envConfig.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim().replace(/^"|"$/g, '');
    }
  });
}

import { getRows } from './lib/googleSheets';
import { getProdutos } from './lib/produtosSheets';
import { appendDoacao } from './lib/doacoesSheets';
import { confirmarEntrega } from './lib/saidasSheets';
import { processarSaidaEstoquePorPedido } from './lib/estoqueSheets';

async function seed() {
  const pedidos = await getRows();
  const delivered = pedidos.filter(p => p.status === 'entregue');
  const produtos = await getProdutos();

  if (delivered.length === 0) {
    console.log('Nenhum pedido entregue encontrado.');
    return;
  }

  const counts = delivered.reduce((acc, p) => {
    const type = p.tipo_cesta || 'Adulto';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log('Calculando doações necessárias...', counts);

  // 1. Criar Doações Agregadas por mês para manter histórico
  const byMonth: Record<string, Record<string, number>> = {};
  
  delivered.forEach(p => {
    const month = p.data.split('/')[1] + '/' + p.data.split('/')[2].split(' ')[0]; // MM/YYYY
    if (!byMonth[month]) byMonth[month] = { Kids: 0, Adulto: 0 };
    const type = p.tipo_cesta || 'Adulto';
    byMonth[month][type]++;
  });

  console.log('Distribuição por mês:', byMonth);

  for (const month of Object.keys(byMonth)) {
    console.log(`Processando doações para ${month}...`);
    for (const produto of produtos) {
      const kgKids = (byMonth[month]['Kids'] || 0) * (produto.kids || 0);
      const kgAdulto = (byMonth[month]['Adulto'] || 0) * (produto.adultos || 0);
      const totalKg = kgKids + kgAdulto;

      if (totalKg > 0) {
        await appendDoacao({
          rede: 'SISTEMA',
          celula: `Carga Histórica ${month}`,
          nome_produto: produto.nome_produto,
          quantidade_kg: totalKg,
          observacao: `Carga histórica correspondente a ${month}`
        });
      }
    }
  }

  // 2. Criar Registros de Saída e Processar Estoque
  console.log(`Processando ${delivered.length} saídas...`);
  let count = 0;
  for (const pedido of delivered) {
    count++;
    console.log(`[${count}/${delivered.length}] Processando saída para: ${pedido.beneficiado}`);
    
    // Inserir na tabela saidas
    await confirmarEntrega({
      id_pedido: pedido.id_pedido,
      beneficiado: pedido.beneficiado,
      celula: pedido.celula,
      lider: pedido.lider,
      tipo: pedido.tipo_cesta === 'Kids' ? 'KIDS' : 'ADULTO',
      entregue_por: 'Sistema (Carga Histórica)',
      status: 'Entregue'
    });

    // Baixar do estoque físico
    await processarSaidaEstoquePorPedido(pedido.tipo_cesta || 'Adulto');
  }

  console.log('Seed concluído com sucesso!');
}

seed().catch(console.error);
