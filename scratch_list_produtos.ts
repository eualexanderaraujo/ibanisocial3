import { getProdutos } from './lib/produtosSheets.ts';

async function main() {
  const produtos = await getProdutos();
  console.log(JSON.stringify(produtos, null, 2));
}

main().catch(console.error);
