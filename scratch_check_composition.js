
const { getProdutos } = require('./lib/produtosSheets');

async function main() {
    try {
        const produtos = await getProdutos();
        console.log('Composition:');
        produtos.forEach(p => {
            if (p.adultos > 0 || p.kids > 0) {
                console.log(`${p.nome_produto}: Adulto=${p.adultos}, Kids=${p.kids} (${p.unidade})`);
            }
        });
    } catch (e) {
        console.error(e);
    }
}

main();
