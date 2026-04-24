
import { getProdutos, updateProduto } from '../lib/produtosSheets';

async function main() {
  const currentProdutos = await getProdutos();
  
  const basketData: Record<string, { adultos: number, kids: number }> = {
    "Arroz": { adultos: 5, kids: 5 },
    "Feijão": { adultos: 2, kids: 2 },
    "Açúcar": { adultos: 2, kids: 2 },
    "Macarrão": { adultos: 2, kids: 2 },
    "Farinha de Mesa": { adultos: 1, kids: 1 },
    "Farinha de Trigo": { adultos: 1, kids: 1 },
    "Fubá": { adultos: 1, kids: 1 },
    "Sal": { adultos: 1, kids: 1 },
    "Café": { adultos: 0.25, kids: 0.25 },
    "Milho de Pipoca": { adultos: 1, kids: 1 },
    "Óleo": { adultos: 1, kids: 1 },
    "Leite": { adultos: 2, kids: 2 },
    "Leite em Pó": { adultos: 0, kids: 0 },
    "Biscoito Doce": { adultos: 0.4, kids: 0.4 },
    "Biscoito Salgado": { adultos: 0.4, kids: 0.4 },
    "Gelatinas": { adultos: 0, kids: 0 },
    "Molho de Tomate": { adultos: 0.8, kids: 0.8 },
    "Enlatado": { adultos: 0.5, kids: 0.5 },
    "Achocolatado": { adultos: 0, kids: 0.5 },
    "Mucilon": { adultos: 0, kids: 0.5 }
  };

  console.log("Iniciando atualização dos padrões de cesta...");

  for (const produto of currentProdutos) {
    const pattern = basketData[produto.nome_produto];
    if (pattern) {
      console.log(`Atualizando ${produto.nome_produto}...`);
      await updateProduto(produto.id_produto, {
        nome_produto: produto.nome_produto,
        unidade: produto.unidade,
        ativo: produto.ativo,
        adultos_kg: pattern.adultos,
        kids_kg: pattern.kids
      });
    }
  }

  console.log("Concluído!");
}

main().catch(console.error);
