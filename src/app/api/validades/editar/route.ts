import { NextResponse } from 'next/server';
import { pool } from '@/app/lib/db';

export async function POST(request: Request) {
    const connection = await pool.getConnection();

    try {
        const body = await request.json();

        // 1. Extração dos dados do Frontend
        const {
            id_validade,
            //produto,         // Vai para descricao_produto na tabela ean
            //marca,           // Vai para marca_produto na tabela ean
            validade,
            quantidadeDesc,  // Vai para quantidade_produto na tabela validades
            responsavel,
            id_responsavel,
            //codigoProduto,   // EAN
            codigoInterno,   // PLU (usado para busca)
            verificado,      // INT (0 ou 1)
            finalizado,      // INT (0 ou 1)
            rebaixa          // INT (0 ou 1)
        } = body;

        // 2. Preparação das datas (apenas se o campo estiver marcado como 1)
        const agora = new Date().toISOString().slice(0, 19).replace('T', ' ');
        const data_verificado = verificado === 1 ? agora : null;
        const data_finalizado = finalizado === 1 ? agora : null;
        const data_rebaixa = rebaixa === 1 ? agora : null;

        await connection.beginTransaction();

        // --- PASSO 1: Buscar o ID real do produto pelo Código Interno (PLU) ---
        const [produtoRows]: any = await connection.execute(
            'SELECT id FROM ean_plu_produtos WHERE plu_produto = ? LIMIT 1',
            [codigoInterno]
        );

        if (produtoRows.length === 0) {
            throw new Error(`Produto com código interno ${codigoInterno} não localizado no cadastro.`);
        }

        //PEGA O ID DO PRODUTO NA TABELA EAN_PLU_PRODUTOS
        const idRealDoProduto = produtoRows[0].id;

        const queryValidades = `
            UPDATE validades SET 
                validade = ?, 
                responsavel = ?, 
                verificado = ?, 
                data_verificado = ?, 
                finalizado = ?, 
                data_finalizado = ?, 
                quantidade_produto = ?, 
                id_responsavel = ?, 
                rebaixa = ?, 
                data_rebaixa = ?,
                idRelacionado = ?
            WHERE idvalidades = ?
        `;

        const valuesValidades = [
            validade,           // datetime
            responsavel,        // varchar
            verificado,         // int (0 ou 1) - SEMPRE ENVIAR O INT AQUI
            data_verificado,    // datetime ou null
            finalizado,         // int (0 ou 1) - SEMPRE ENVIAR O INT AQUI
            data_finalizado,    // datetime ou null
            quantidadeDesc,     // varchar
            id_responsavel,     // int
            rebaixa,            // int (0 ou 1) - SEMPRE ENVIAR O INT AQUI
            data_rebaixa,       // datetime ou null
            idRealDoProduto,    // int
            id_validade         // int (WHERE)
        ];

        await connection.execute(queryValidades, valuesValidades);

        // Se tudo deu certo, confirma as alterações
        await connection.commit();

        return NextResponse.json({
            status: 'success',
            message: 'Validade atualizada com sucesso!'
        });

    } catch (error: any) {
        // Se houver qualquer erro, desfaz as alterações em ambas as tabelas
        await connection.rollback();
        console.error("Erro na transação:", error.message);

        return NextResponse.json({
            status: 'error',
            message: error.message || 'Erro interno ao salvar dados'
        }, { status: 500 });

    } finally {
        // Libera a conexão de volta para o pool
        connection.release();
    }
}