import { NextResponse } from 'next/server';
import { pool } from '@/app/lib/db';

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const term = searchParams.get('term') || '';
		const searchByMarca = searchParams.get('searchByMarca') === 'true';
		const searchByNome = searchParams.get('searchByNome') === 'true';

		if (!term || term.length < 2) {
			return NextResponse.json({ dados: [] });
		}

		let query = '';
		const queryTerm = `%${term}%`;

		// Lógica baseada nas colunas da sua imagem: descricao_produto e marca_produto
		if (searchByMarca) {
			query = `
        SELECT DISTINCT marca_produto AS valor 
        FROM ean_plu_produtos 
        WHERE marca_produto LIKE ? 
        ORDER BY marca_produto ASC 
        LIMIT 10`;
		} else if (searchByNome) {
			query = `
        SELECT DISTINCT descricao_produto AS valor 
        FROM ean_plu_produtos 
        WHERE descricao_produto LIKE ? 
        ORDER BY descricao_produto ASC 
        LIMIT 10`;
		} else {
			// Busca geral (opcional)
			query = `
        SELECT DISTINCT descricao_produto AS valor 
        FROM ean_plu_produtos 
        WHERE descricao_produto LIKE ? OR marca_produto LIKE ? 
        LIMIT 10`;
		}

		const [rows] = await pool.query(query, [queryTerm]);

		return NextResponse.json({
			status: 'success',
			dados: rows, // Aqui 'rows' já é a array de objetos [{valor: ...}, ...]
		});
	} catch (error) {
		console.error('Erro na rota de autocomplete:', error);
		return NextResponse.json({ status: 'error', dados: [] }, { status: 500 });
	}
}
