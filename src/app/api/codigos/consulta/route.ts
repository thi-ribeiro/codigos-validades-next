import { NextResponse } from 'next/server';
import { pool } from '@/app/lib/db'; // Importa a piscina que você criou

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const busca = searchParams.get('consultaProdutoBusca'); // Garante que não é null

        const termo = `%${busca}%`;
        const [rows] = await pool.execute(
            "SELECT * FROM codigos_produtos WHERE nome_produto LIKE ? OR marca_produto LIKE ? ORDER BY marca_produto ASC",
            [termo, termo]
        );

        return NextResponse.json({ dados: rows });
    } catch (err: any) {
        // ESTA LINHA É A MAIS IMPORTANTE:
        console.error("ERRO NO SERVIDOR:", err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}