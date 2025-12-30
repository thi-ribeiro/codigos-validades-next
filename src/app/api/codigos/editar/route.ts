
import { NextResponse } from 'next/server';
import { pool } from '@/app/lib/db'; // Importa a piscina que você criou
export async function POST(request: Request) {
    try {
        // 1. Captura o JSON enviado pelo fetch
        const data = await request.json();

        // 2. Desestrutura os dados (os nomes devem bater com o seu objeto 'produto')
        const {
            editarCodigoProduto,
            idProduto,
            nomeProduto,
            marcaProduto,
            codigoProduto,
            responsavelCadastro
        } = data;

        // 3. Lógica para EDITAR (UPDATE) ou CADASTRAR (INSERT)
        if (editarCodigoProduto && idProduto) {
            // Exemplo de UPDATE no banco do Atacadão
            const query = `
                UPDATE codigos_produtos SET nome_produto = ?, codigo_produto = ?, marca_produto = ?, responsavel_cadastro = ? WHERE idCodigo = ?       
            `;
            await pool.execute(query, [nomeProduto, codigoProduto, marcaProduto, responsavelCadastro, idProduto]);

            return NextResponse.json({ message: "Produto atualizado com sucesso!" });
        } else {
            // Lógica para novo cadastro se idProduto não existir
            const query = `
                INSERT INTO codigos_produtos (nome_produto, marca_produto, codigo_produto, responsavel_cadastro)
                VALUES (?, ?, ?, ?)
            `;
            await pool.execute(query, [nomeProduto, marcaProduto, codigoProduto, responsavelCadastro]);

            return NextResponse.json({ message: "Produto cadastrado com sucesso!" });
        }

    } catch (error: any) {
        console.error("ERRO NO SERVIDOR (POST):", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}