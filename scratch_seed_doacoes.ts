import { appendDoacao } from './lib/doacoesSheets.ts';

const PRODUTOS_PADRAO = [
  { nome: 'Arroz',           adultos: 5 },
  { nome: 'Feijão',          adultos: 2 },
  { nome: 'Açúcar',          adultos: 2 },
  { nome: 'Macarrão',        adultos: 2 },
  { nome: 'Farinha de Mesa', adultos: 1 },
  { nome: 'Farinha de Trigo',adultos: 1 },
  { nome: 'Fubá',            adultos: 1 },
  { nome: 'Sal',             adultos: 1 },
  { nome: 'Café',            adultos: 0.25 },
  { nome: 'Milho de Pipoca', adultos: 1 },
  { nome: 'Óleo',            adultos: 1 },
  { nome: 'Leite',           adultos: 2 },
  { nome: 'Biscoito Doce',   adultos: 0.4 },
  { nome: 'Biscoito Salgado',adultos: 0.4 },
  { nome: 'Molho de Tomate', adultos: 0.8 },
  { nome: 'Enlatado',        adultos: 0.5 },
];

async function main() {
  console.log('Iniciando carga de doações para 10 cestas Adulto...');
  
  for (const p of PRODUTOS_PADRAO) {
    const qtd = p.adultos * 10;
    console.log(`Adicionando ${qtd}kg de ${p.nome}...`);
    await appendDoacao({
      rede: 'Semente',
      celula: 'Sistema',
      nome_produto: p.nome,
      quantidade_kg: qtd,
      observacao: 'Carga automática de teste: 10 cestas'
    });
  }
  
  console.log('Carga finalizada com sucesso!');
}

main().catch(console.error);
