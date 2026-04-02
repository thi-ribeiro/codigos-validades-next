// import { NextResponse } from 'next/server';
// import { pool } from '@/app/lib/db'; // Seu arquivo de conexão com o pool [cite: 2025-12-31]

// export async function POST(request: Request) {
//     try {
//         // No Next.js, pegamos o corpo da requisição assim:
//         const input_data = await request.json();

//         // Extração dos dados (Substituindo o seu sanitize_input_string)
//         const {
//             produto,
//             marca,
//             responsavel,
//             validade,
//             data_inserido,
//             quantidadeDesc,
//             codigoProduto,
//             codigoInterno
//         } = input_data;

//         // Validação básica (igual ao seu IF no PHP)
//         if (!produto || !validade || !quantidadeDesc) {
//             return NextResponse.json(
//                 { status: 'info', message: 'Dados incompletos para cadastro!' },
//                 { status: 400 }
//             );
//         }

//         // Query de inserção
//         const query = `
//             INSERT INTO validades 
//             (produto, marca_produto, responsavel, validade, data_inserido, quantidade_produto, codigoProduto, codigoInterno)
//             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

//         // No mysql2 com pool, passamos apenas o array de valores
//         const [result] = await pool.execute(query, [
//             produto,
//             marca || '',
//             responsavel || '',
//             validade,
//             data_inserido,
//             quantidadeDesc,
//             codigoProduto,
//             codigoInterno
//         ]);

//         return NextResponse.json(
//             { status: 'success', message: 'Validade cadastrada com sucesso!' },
//             { status: 200 }
//         );

//     } catch (error: any) {
//         console.error('Erro ao inserir validade:', error);
//         return NextResponse.json(
//             { status: 'error', message: 'Erro interno no servidor' },
//             { status: 500 }
//         );
//     }
// }

import { NextResponse } from 'next/server';
import { pool } from '@/app/lib/db';

export async function POST(request: Request) {
    // Iniciamos uma conexão do pool para usar Transações
    const connection = await pool.getConnection();

    try {
        const input_data = await request.json();

        const {
            produto,       // Descrição
            marca,
            responsavel,
            validade,
            data_inserido,
            quantidadeDesc,
            codigoProduto, // EAN
            codigoInterno  // PLU
        } = input_data;

        if (!produto || !validade || !codigoProduto) {
            return NextResponse.json(
                { status: 'info', message: 'Dados incompletos para cadastro!' },
                { status: 400 }
            );
        }

        // Início da Transação
        await connection.beginTransaction();

        // 1. Verificar se o produto já existe no cadastro (pelo EAN)
        const [produtoExistente]: any = await connection.execute(
            "SELECT id FROM ean_plu_produtos WHERE ean_produto = ? LIMIT 1",
            [codigoProduto]
        );

        let produtoId: number;

        if (produtoExistente.length > 0) {
            // Se existir, pegamos o ID dele
            produtoId = produtoExistente[0].id;
        } else {
            // 2. Se não existir, inserimos no cadastro de produtos primeiro
            const [novoProduto]: any = await connection.execute(
                `INSERT INTO ean_plu_produtos 
                (descricao_produto, marca_produto, ean_produto, plu_produto) 
                VALUES (?, ?, ?, ?)`,
                [produto, marca || '', codigoProduto, codigoInterno || '']
            );
            produtoId = novoProduto.insertId;
        }

        // 3. Agora inserimos na tabela de validades usando o idRelacionado
        const queryValidade = `
    INSERT INTO validades 
    (idRelacionado, responsavel, validade, data_inserido, quantidade_produto)
    VALUES (?, ?, ?, ?, ?)`;

        await connection.execute(queryValidade, [
            produtoId,          // Link para a tabela ean_plu_produtos
            responsavel || '',  // Usuário
            validade,           // A data de vencimento
            data_inserido,      // Data do cadastro
            quantidadeDesc      // A quantidade/descrição (ex: "10 cx")
        ]);

        // Finaliza a transação com sucesso
        await connection.commit();

        return NextResponse.json(
            { status: 'success', message: 'Produto vinculado e validade cadastrada!' },
            { status: 200 }
        );

    } catch (error: any) {
        // Se der erro, desfaz tudo o que foi feito no banco
        await connection.rollback();
        console.error('Erro ao processar cadastro:', error);
        return NextResponse.json(
            { status: 'error', message: 'Erro interno ao salvar os dados' },
            { status: 500 }
        );
    } finally {
        // Importante: Liberar a conexão de volta para o pool
        connection.release();
    }
}