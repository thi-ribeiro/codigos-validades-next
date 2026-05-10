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
        // const [produtoExistente]: any = await connection.execute(
        //     "SELECT id FROM ean_plu_produtos WHERE ean_produto = ? LIMIT 1",
        //     [codigoProduto]
        // );

        // 1. PRIMEIRO: Verifica se o produto (EAN ou PLU) já existe
        const [produtoExistente]: any = await connection.execute(
            // Adicionei as colunas aqui no SELECT:
            "SELECT id, ean_produto, plu_produto FROM ean_plu_produtos WHERE ean_produto = ? OR plu_produto = ? LIMIT 1",
            [codigoProduto, codigoInterno || '']
        );

        let produtoId: number;
        if (produtoExistente.length > 0) {
            const p = produtoExistente[0];

            // VALIDAÇÃO DE INTEGRIDADE:
            // 1. Se o EAN que você enviou já existe, mas está cadastrado com OUTRO PLU no banco...
            if (p.ean_produto === codigoProduto && p.plu_produto !== (codigoInterno || '')) {
                await connection.rollback();
                return NextResponse.json(
                    { status: 'info', message: `Conflito: O EAN ${codigoProduto} já está cadastrado com outro Código Interno (${p.plu_produto})!` },
                    { status: 400 }
                );
            }

            // 2. Se o PLU que você enviou já existe, mas está cadastrado com OUTRO EAN no banco...
            if (p.plu_produto === (codigoInterno || '') && p.ean_produto !== codigoProduto) {
                await connection.rollback();
                return NextResponse.json(
                    { status: 'info', message: `Conflito: O Código Interno ${codigoInterno} já pertence ao produto com EAN ${p.ean_produto}!` },
                    { status: 400 }
                );
            }
            // Se passou pelas validações, significa que o que você digitou bate com o que está no banco
            produtoId = p.id;
        } else {
            // SE NÃO EXISTE: Aí sim fazemos o INSERT do produto novo.
            const [novoProduto]: any = await connection.execute(
                `INSERT INTO ean_plu_produtos 
        (descricao_produto, marca_produto, ean_produto, plu_produto) 
        VALUES (?, ?, ?, ?)`,
                [produto, marca || '', codigoProduto, codigoInterno || '']
            );
            produtoId = novoProduto.insertId;
        }

        // 2. AGORA: Verifica se ESSA VALIDADE específica já existe para ESSE produtoId
        const [validadeExistente]: any = await connection.execute(
            "SELECT idvalidades FROM validades WHERE idRelacionado = ? AND validade = ? LIMIT 1",
            [produtoId, validade]
        );

        if (validadeExistente.length > 0) {
            // IMPORTANTE: Se você iniciou uma transação, precisa encerrar ela 
            // antes de dar o return, ou dar o rollback/commit.
            await connection.rollback(); // Como não vamos inserir nada, desfazemos o início da transação
            return NextResponse.json(
                { status: 'info', message: 'Produto já cadastrado nesta validade!' },
                { status: 400 }
            );
        }

        // 4. Inserção (Caso não exista)
        const queryValidade = `
            INSERT INTO validades 
            (idRelacionado, responsavel, validade, data_inserido, quantidade_produto)
            VALUES (?, ?, ?, ?, ?)`;

        const [resultValidade]: any = await connection.execute(queryValidade, [
            produtoId,
            responsavel || '',
            validade,
            data_inserido,
            quantidadeDesc
        ]);

        // 5. BUSCA O ITEM COMPLETO PARA O FRONTEND
        // Usamos o insertId para pegar exatamente o que acabamos de criar
        const [rows]: any = await connection.execute(`
            SELECT 
                v.idvalidades, 
                v.idRelacionado,
                v.responsavel,
                v.validade,
                DATE_FORMAT(v.validade, '%d/%m/%Y') as validadeDiaMes,
                v.data_inserido,
                v.quantidade_produto,
                v.verificado,
                v.finalizado,
                v.rebaixa,
                p.descricao_produto as produto, 
                p.marca_produto,
                p.ean_produto as codigoProduto,
                p.plu_produto as codigoInterno
            FROM validades v
            JOIN ean_plu_produtos p ON v.idRelacionado = p.id
            WHERE v.idvalidades = ?
        `, [resultValidade.insertId]);

        const itemCompleto = rows[0];

        // Finaliza a transação com sucesso
        await connection.commit();

        return NextResponse.json(
            {
                status: 'success',
                message: 'Produto vinculado e validade cadastrada!',
                item: itemCompleto // <--- O "pulo do gato" está aqui
            },
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