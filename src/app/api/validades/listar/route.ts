import { NextResponse } from 'next/server';
import { pool } from '@/app/lib/db';

export async function GET(request: Request) {
    try {

        const query = `
    SELECT v.*, p.descricao_produto AS produto, p.marca_produto AS marca_produto,
           p.plu_produto AS codigoInterno, p.ean_produto AS codigoProduto,
           p.id AS id_ean_produto, DATE_FORMAT(v.validade, '%d/%m/%Y') AS validadeDiaMes 
    FROM validades v
    LEFT JOIN ean_plu_produtos p ON v.idRelacionado = p.id
    WHERE v.finalizado = 0 -- Corrigido para o nome real da sua coluna!
      AND v.validade BETWEEN DATE_SUB(CURDATE(), INTERVAL DAYOFMONTH(CURDATE())-1 DAY)
                     AND LAST_DAY(CURDATE()+ INTERVAL 1 MONTH)
    ORDER BY v.validade ASC, v.idvalidades ASC`;

        const [resultados] = await pool.execute(query);

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