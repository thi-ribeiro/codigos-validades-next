import { NextResponse } from 'next/server';
import { pool } from '@/app/lib/db'; // [cite: 2025-12-31]

export async function DELETE(request: Request) {
    try {
        const { id_validade } = await request.json();

        if (!id_validade) {
            return NextResponse.json({ status: 'error', message: 'ID não fornecido' }, { status: 400 });
        }

        // A query usa o nome da coluna que vimos na sua foto anterior
        const query = "DELETE FROM validades WHERE idvalidades = ?";
        await pool.execute(query, [id_validade]); // [cite: 2025-12-31]

        return NextResponse.json({ status: 'success', message: 'Registro removido com sucesso!' });

    } catch (error: any) {
        return NextResponse.json({ status: 'error', message: 'Erro ao deletar no banco' }, { status: 500 });
    }
}