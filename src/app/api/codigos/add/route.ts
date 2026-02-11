
import { NextResponse } from 'next/server';
import { pool } from '@/app/lib/db'; // Importa a piscina que você criou
export async function POST(request: Request) {
    try {

        const data = await request.json();

        const {
            adicionarProduto,
            nomeProduto,
            marcaProduto,
            codigoProduto,
            responsavelCadastro
        } = data;

        if (adicionarProduto) {

            const query = `
                SELECT * FROM codigos_produtos WHERE codigo_produto = ?       
            `;
            const [rows]: any = await pool.execute(query, [codigoProduto]);

            if (rows.length === 0) {
                const query = `
                INSERT INTO codigos_produtos (nome_produto, codigo_produto, marca_produto, responsavel_cadastro) VALUES (?, ?, ?, ?)      
            `;
                await pool.execute(query, [nomeProduto, codigoProduto, marcaProduto, responsavelCadastro]);

                return NextResponse.json({ message: "Produto adicionado com sucesso!" });
            } else {
                return NextResponse.json({ message: "Produto/Código já cadastrado!" });
            }
        }
        return NextResponse.json({ message: "Operação não identificada" }, { status: 400 });

    } catch (error: any) {
        console.error("ERRO NO SERVIDOR (POST):", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}