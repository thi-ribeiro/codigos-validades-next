// import { NextResponse } from 'next/server';
// import { pool } from '@/app/lib/db'; // Importa a piscina que você criou

// export async function GET(request: Request) {
//     try {
//         // 1. Capturar parâmetros da URL (Filtro de marca)
//         const { searchParams } = new URL(request.url);
//         const marca = searchParams.get('marca') || '';
//         const termoMarca = `%${marca}%`;

//         // 2. Lógica de Datas (Substituindo o modify do PHP)
//         const hoje = new Date();

//         // Início do mês atual: YYYY-MM-01
//         const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
//             .toISOString().split('T')[0];

//         // Último dia do mês que vem: YYYY-MM-DD
//         const dataFim = new Date(hoje.getFullYear(), hoje.getMonth() + 2, 0);
//         const fimMesSeguinte = dataFim.toISOString().split('T')[0];

//         // Data formatada para o frontend (ISO String)
//         const dataFimIntervaloFormatada = dataFim.toISOString();

//         // 3. Simulação de Auth (Depois você integra com seu JWT/Cookie)
//         // No Next.js, você pegaria isso do cookie da requisição
//         const userRole = 1; // 1 para Admin
//         const userId = 123; // UID do usuário

//         let query = "";
//         let params = [];


//         // 4. Montagem da Query com JOIN (Relacionamento)
//         if (userRole === 1) { // Administrador
//             query = `
//         SELECT 
//             v.*, 
//             p.descricao_produto AS descricao_produto,
//             p.marca_produto AS marca_produto,
//             p.plu_produto AS codigoInterno,
//             p.ean_produto AS codigoProduto,
//             p.id AS id_ean_produto,
//             DATE_FORMAT(v.validade, '%d/%m/%Y') AS validadeDiaMes 
//         FROM validades v
//         LEFT JOIN ean_plu_produtos p ON v.idRelacionado = p.id
//         WHERE v.validade BETWEEN ? AND ? 
//         AND p.marca_produto LIKE ?
//         ORDER BY v.validade ASC, v.idvalidades ASC`;
//             params = [inicioMes, fimMesSeguinte, termoMarca];
//         } else { // Usuário Comum
//             query = `
//         SELECT 
//             v.*, 
//             p.descricao_produto AS descricao_produto,
//             p.marca_produto AS marca_produto,
//             p.plu_produto AS codigo_produto,
//             p.id AS id_ean_produto,
//             DATE_FORMAT(v.validade, '%d/%m/%Y') AS validadeDiaMes 
//         FROM validades v
//         LEFT JOIN ean_plu_produtos p ON v.idRelacionado = p.id
//         WHERE v.validade BETWEEN ? AND ? 
//                 AND v.id_responsavel = ? 
//                 AND v.marca_produto LIKE ? 
//                 ORDER BY v.validade ASC, v.produto ASC`;
//             params = [inicioMes, fimMesSeguinte, userId, termoMarca];
//         }

//         const [resultados] = await pool.execute(query, params);
//         const [marcasBrutas] = await pool.execute(
//             "SELECT DISTINCT marca_produto FROM validades ORDER BY marca_produto ASC"
//         );

//         // 6. Resposta Final
//         if (Array.isArray(resultados) && resultados.length > 0) {
//             return NextResponse.json({
//                 dados: resultados,
//                 marcas: marcasBrutas,
//                 dataFimIntervalo: dataFimIntervaloFormatada
//             }, { status: 200 });
//         }

//         return NextResponse.json({
//             status: 'info',
//             message: 'Nenhuma validade encontrada para o período especificado.',
//             marcas: marcasBrutas,
//             dataFimIntervalo: dataFimIntervaloFormatada
//         }, { status: 200 }); // Retornamos 200 mesmo vazio para o front tratar como 'info'

//     } catch (error) {
//         console.error('Erro na API de Validades:', error);
//         return NextResponse.json(
//             { error: 'Erro interno ao processar a consulta' },
//             { status: 500 }
//         );
//     }
// }

import { NextResponse } from 'next/server';
import { pool } from '@/app/lib/db';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const marca = searchParams.get('marca') || '';
        const termoMarca = `%${marca}%`;

        const hoje = new Date();
        const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
            .toISOString().split('T')[0];

        const dataFim = new Date(hoje.getFullYear(), hoje.getMonth() + 2, 0);
        const fimMesSeguinte = dataFim.toISOString().split('T')[0];
        const dataFimIntervaloFormatada = dataFim.toISOString();

        const userRole = 1;
        const userId = 123;

        let query = "";
        let params: any[] = [];

        if (userRole === 1) {
            query = `
                SELECT 
                    v.*, 
                    p.descricao_produto AS produto,
                    p.marca_produto AS marca_produto,
                    p.plu_produto AS codigoInterno,
                    p.ean_produto AS codigoProduto,
                    p.id AS id_ean_produto,
                    DATE_FORMAT(v.validade, '%d/%m/%Y') AS validadeDiaMes 
                FROM validades v
                LEFT JOIN ean_plu_produtos p ON v.idRelacionado = p.id
                WHERE v.validade BETWEEN ? AND ? 
                AND p.marca_produto LIKE ?
                ORDER BY v.validade ASC, v.idvalidades ASC`;
            params = [inicioMes, fimMesSeguinte, termoMarca];
        } else {
            // Ignorando lógica conforme solicitado, apenas mantendo a estrutura
            query = `
        SELECT 
            v.*, 
            p.descricao_produto AS produto,
            p.marca_produto AS marca_produto,
            p.plu_produto AS codigoInterno,
            p.ean_produto AS codigoProduto,
            p.id AS id_ean_produto,
            DATE_FORMAT(v.validade, '%d/%m/%Y') AS validadeDiaMes 
        FROM validades v
        LEFT JOIN ean_plu_produtos p ON v.idRelacionado = p.id
        WHERE v.validade BETWEEN ? AND ? 
        /* Aqui garante que ele só veja o que for da marca dele */
        AND p.marca_produto LIKE ? 
        ORDER BY v.validade ASC, v.idvalidades ASC`;

            // Os parâmetros devem seguir a mesma ordem dos '?' na query acima
            params = [inicioMes, fimMesSeguinte, termoMarca];
        }

        // 1. Execução da listagem principal
        const [resultados] = await pool.execute(query, params);

        // 2. BUSCA DAS MARCAS (Corrigido para a tabela ean_plu_produtos)
        // Usamos o termoMarca para manter o suporte ao filtro LIKE
        const [marcasBrutas] = await pool.execute(
            `SELECT DISTINCT marca_produto 
             FROM ean_plu_produtos 
             WHERE marca_produto LIKE ? 
             ORDER BY marca_produto ASC`,
            [termoMarca]
        );

        if (Array.isArray(resultados) && resultados.length > 0) {
            return NextResponse.json({
                dados: resultados,
                marcas: marcasBrutas,
                dataFimIntervalo: dataFimIntervaloFormatada
            }, { status: 200 });
        }

        return NextResponse.json({
            status: 'info',
            message: 'Nenhuma validade encontrada para o período especificado.',
            marcas: marcasBrutas,
            dataFimIntervalo: dataFimIntervaloFormatada
        }, { status: 200 });

    } catch (error) {
        console.error('Erro na API de Validades:', error);
        return NextResponse.json(
            { error: 'Erro interno ao processar a consulta' },
            { status: 500 }
        );
    }
}