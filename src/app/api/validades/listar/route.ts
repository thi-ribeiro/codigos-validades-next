// import { NextResponse } from 'next/server';
// import { pool } from '@/app/lib/db';

// export async function GET(request: Request) {
//     try {
//         const { searchParams } = new URL(request.url);
//         const marca = searchParams.get('marca') || '';
//         const termoMarca = `%${marca}%`;

//         const hoje = new Date();
//         const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
//             .toISOString().split('T')[0];

//         const dataFim = new Date(hoje.getFullYear(), hoje.getMonth() + 2, 0);
//         const fimMesSeguinte = dataFim.toISOString().split('T')[0];
//         const dataFimIntervaloFormatada = dataFim.toISOString();

//         const userRole = 1;
//         // const userId = 123;

//         let query = "";
//         let params: any[] = [];

//         if (userRole === 1) {
//             query = `
//                 SELECT 
//                     v.*, 
//                     p.descricao_produto AS produto,
//                     p.marca_produto AS marca_produto,
//                     p.plu_produto AS codigoInterno,
//                     p.ean_produto AS codigoProduto,
//                     p.id AS id_ean_produto,
//                     DATE_FORMAT(v.validade, '%d/%m/%Y') AS validadeDiaMes 
//                 FROM validades v
//                 LEFT JOIN ean_plu_produtos p ON v.idRelacionado = p.id
//                 WHERE v.validade BETWEEN ? AND ? 
//                 AND p.marca_produto LIKE ?
//                 ORDER BY v.validade ASC, v.idvalidades ASC`;
//             params = [inicioMes, fimMesSeguinte, termoMarca];
//         } else {
//             // Ignorando lógica conforme solicitado, apenas mantendo a estrutura
//             query = `
//         SELECT 
//             v.*, 
//             p.descricao_produto AS produto,
//             p.marca_produto AS marca_produto,
//             p.plu_produto AS codigoInterno,
//             p.ean_produto AS codigoProduto,
//             p.id AS id_ean_produto,
//             DATE_FORMAT(v.validade, '%d/%m/%Y') AS validadeDiaMes 
//         FROM validades v
//         LEFT JOIN ean_plu_produtos p ON v.idRelacionado = p.id
//         WHERE v.validade BETWEEN ? AND ? 
//         /* Aqui garante que ele só veja o que for da marca dele */
//         AND p.marca_produto LIKE ? 
//         ORDER BY v.validade ASC, v.idvalidades ASC`;

//             // Os parâmetros devem seguir a mesma ordem dos '?' na query acima
//             params = [inicioMes, fimMesSeguinte, termoMarca];
//         }

//         // 1. Execução da listagem principal
//         const [resultados] = await pool.execute(query, params);

//         // 2. BUSCA DAS MARCAS (Corrigido para a tabela ean_plu_produtos)
//         // Usamos o termoMarca para manter o suporte ao filtro LIKE
//         const [marcasBrutas] = await pool.execute(
//             `SELECT DISTINCT marca_produto 
//              FROM ean_plu_produtos 
//              WHERE marca_produto LIKE ? 
//              ORDER BY marca_produto ASC`,
//             [termoMarca]
//         );

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
//         }, { status: 200 });

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
        const hoje = new Date();
        const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
            .toISOString().split('T')[0];

        const dataFim = new Date(hoje.getFullYear(), hoje.getMonth() + 2, 0);
        const dataFimIntervaloFormatada = dataFim.toISOString();
        const fimMesSeguinte = dataFimIntervaloFormatada.split('T')[0];

        const query = `
            SELECT v.*, p.descricao_produto AS produto, p.marca_produto AS marca_produto,
                   p.plu_produto AS codigoInterno, p.ean_produto AS codigoProduto,
                   p.id AS id_ean_produto, DATE_FORMAT(v.validade, '%d/%m/%Y') AS validadeDiaMes 
            FROM validades v
            LEFT JOIN ean_plu_produtos p ON v.idRelacionado = p.id
            WHERE v.validade BETWEEN ? AND ?
            ORDER BY v.validade ASC, v.idvalidades ASC`;

        const params = [inicioMes, fimMesSeguinte];

        const [resultados] = await pool.execute(query, params);

        const respostaFinal = {
            dados: Array.isArray(resultados) && resultados.length > 0 ? resultados : [],
            //dataFimIntervalo: dataFimIntervaloFormatada,
            status: Array.isArray(resultados) && resultados.length > 0 ? undefined : 'info',
            message: Array.isArray(resultados) && resultados.length > 0 ? undefined : 'Nenhuma validade encontrada.'
        };

        return NextResponse.json(respostaFinal, {
            status: 200,
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate',
                'Pragma': 'no-cache'
            }
        });

    } catch (error) {
        console.error('Erro na API de Validades:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}