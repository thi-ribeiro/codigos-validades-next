import { NextResponse } from 'next/server';
import { pool } from '@/app/lib/db'; // Importa seu pool de conexão

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const termo = searchParams.get('term') || '';
        const searchByNome = searchParams.get('searchByNome') === 'true';
        const searchByMarca = searchParams.get('searchByMarca') === 'true';

        if (!termo) return NextResponse.json({ dados: [] });
        const termoLike = `%${termo}%`;

        let query = "";
        let params: any[] = [];

        if (searchByMarca && !searchByNome) {
            // Retorna apenas marcas únicas
            query = "SELECT marca_produto as valor FROM codigos_produtos WHERE marca_produto LIKE ? GROUP BY marca_produto LIMIT 10";
            params.push(termoLike);
        } else if (searchByNome && !searchByMarca) {
            // Retorna apenas nomes de produtos únicos
            query = "SELECT nome_produto as valor FROM codigos_produtos WHERE nome_produto LIKE ? GROUP BY nome_produto LIMIT 10";
            params.push(termoLike);
        } else {
            // Retorna a combinação formatada Nome - Marca
            query = "SELECT CONCAT(nome_produto, ' - ', marca_produto) as valor FROM codigos_produtos WHERE nome_produto LIKE ? OR marca_produto LIKE ? GROUP BY nome_produto, marca_produto LIMIT 10";
            params.push(termoLike, termoLike);
        }

        const [resultados] = await pool.execute(query, params);
        return NextResponse.json({ dados: resultados }, { status: 200 });

    } catch (error: any) {
        return NextResponse.json({ dados: [] }, { status: 500 });
    }
}