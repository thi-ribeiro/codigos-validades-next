import { NextResponse } from 'next/server';
import { pool } from '@/app/lib/db'; // Seu arquivo de conexão com o pool [cite: 2025-12-31]

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Extraímos os dados que vêm do frontend
        const {
            id_validade, produto, marca, validade, quantidadeDesc,
            responsavel, id_responsavel, verificado, finalizado, rebaixa
        } = body;

        const agora = new Date().toISOString().slice(0, 19).replace('T', ' ');

        const data_verificado = verificado ? agora : null;
        const data_finalizado = finalizado ? agora : null;
        const data_rebaixa = rebaixa ? agora : null;

        // Query atualizada com os nomes REAIS da sua foto
        const query = `
            UPDATE validades SET 
                produto = ?, 
                validade = ?, 
                responsavel = ?, 
                verificado = ?, 
                data_verificado = ?, 
                finalizado = ?, 
                data_finalizado = ?, 
                marca_produto = ?, 
                quantidade_produto = ?, 
                id_responsavel = ?, 
                rebaixa = ?, 
                data_rebaixa = ?
            WHERE idvalidades = ?
        `;

        const values = [
            produto,           // produto
            validade,          // validade
            responsavel,       // responsavel
            verificado,        // verificado
            data_verificado,   // data_verificado
            finalizado,        // finalizado
            data_finalizado,   // data_finalizado
            marca,             // marca_produto
            quantidadeDesc,    // quantidade_produto
            id_responsavel,    // id_responsavel
            rebaixa,           // rebaixa
            data_rebaixa,      // data_rebaixa
            id_validade        // WHERE idvalidades
        ];

        await pool.execute(query, values); // [cite: 2025-12-31]

        return NextResponse.json({ status: 'success', message: 'Validade atualizada com sucesso!' });

    } catch (error: any) {
        console.error("Erro ao editar:", error);
        return NextResponse.json({ status: 'error', message: 'Erro ao salvar no banco' }, { status: 500 });
    }
}