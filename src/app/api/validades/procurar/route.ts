import { NextResponse } from 'next/server';
import { pool } from '@/app/lib/db';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const codigo = searchParams.get('codigo');

    if (!codigo) {
        return NextResponse.json({ status: 'error', message: 'Código não fornecido' }, { status: 400 });
    }

    try {
        // Buscamos o produto que combine com o EAN ou com o PLU (Código Interno)
        const query = `
            SELECT * 
            FROM ean_plu_produtos 
            WHERE ean_produto = ? OR plu_produto = ? 
            LIMIT 1
        `;

        const [rows]: any = await pool.execute(query, [codigo, codigo]);

        if (rows.length > 0) {
            return NextResponse.json({
                status: 'success',
                produto: rows[0]
            });
        } else {
            return NextResponse.json({
                status: 'not_found',
                message: 'Produto não cadastrado'
            });
        }
    } catch (error) {
        console.error("Erro na busca do produto:", error);
        return NextResponse.json({ status: 'error', message: 'Erro interno no servidor' }, { status: 500 });
    }
}