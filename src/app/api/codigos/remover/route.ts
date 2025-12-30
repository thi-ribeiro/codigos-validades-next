import { NextResponse } from 'next/server';
import { pool } from '@/app/lib/db'; // Importa a piscina que você criou

export async function POST(request: Request) {
    try {
        // 1. Pega o ID enviado pelo seu fetch
        const { idProduto } = await request.json();

        // 2. Validação básica do ID
        const id = Number(idProduto);
        if (!id || isNaN(id)) {
            return NextResponse.json(
                { status: 'error', message: 'ID inválido.' },
                { status: 400 }
            );
        }

        // 3. Executa o DELETE no MySQL
        // Verifique se o nome da coluna é 'idcodigo' ou 'id' no seu banco atual
        const query = "DELETE FROM codigos_produtos WHERE idcodigo = ?";
        const [result]: any = await pool.execute(query, [id]);

        // 4. Retorna o sucesso
        return NextResponse.json({
            status: 'success',
            message: 'Produto excluído com sucesso!'
        });

    } catch (error: any) {
        console.error("ERRO AO APAGAR:", error.message);
        return NextResponse.json(
            { status: 'error', message: 'Erro no servidor ao apagar.' },
            { status: 500 }
        );
    }
}