import { NextResponse } from 'next/server';
import { pool } from '@/app/lib/db'; // Seu arquivo de conexão com o pool [cite: 2025-12-31]

export async function POST(request: Request) {
    try {
        // No Next.js, pegamos o corpo da requisição assim:
        const input_data = await request.json();

        // Extração dos dados (Substituindo o seu sanitize_input_string)
        const {
            produto,
            marca,
            responsavel,
            validade,
            data_inserido,
            quantidadeDesc,
            id_responsavel
        } = input_data;

        // Validação básica (igual ao seu IF no PHP)
        if (!produto || !validade || !quantidadeDesc) {
            return NextResponse.json(
                { status: 'info', message: 'Dados incompletos para cadastro!' },
                { status: 400 }
            );
        }

        // Query de inserção
        const query = `
            INSERT INTO validades 
            (produto, marca_produto, responsavel, validade, data_inserido, quantidade_produto, id_responsavel) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`;

        // No mysql2 com pool, passamos apenas o array de valores
        const [result] = await pool.execute(query, [
            produto,
            marca || '',
            responsavel || '',
            validade,
            data_inserido,
            quantidadeDesc,
            id_responsavel
        ]);

        return NextResponse.json(
            { status: 'success', message: 'Validade cadastrada com sucesso!' },
            { status: 200 }
        );

    } catch (error: any) {
        console.error('Erro ao inserir validade:', error);
        return NextResponse.json(
            { status: 'error', message: 'Erro interno no servidor' },
            { status: 500 }
        );
    }
}