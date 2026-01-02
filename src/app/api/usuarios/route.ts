import { NextResponse } from 'next/server';
import { pool } from '@/app/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Aqui pegamos os nomes exatamente como você definiu no loginData do frontend
        const { usuario, senha, empresa } = body;

        // 1. Validação (mesma que você fez no front, mas garantindo no back)
        if (!usuario || !senha || !empresa) {
            return NextResponse.json(
                { status: 'error', message: 'Dados incompletos!' },
                { status: 400 }
            );
        }

        // 2. Verifica se já existe
        const queryIfExist = "SELECT * FROM usuarios WHERE nome_usuario = ?";
        const [rows]: any = await pool.execute(queryIfExist, [usuario]);

        if (rows.length > 0) {
            return NextResponse.json(
                { status: 'info', message: 'Usuário já cadastrado!' },
                { status: 200 }
            );
        }

        // 3. Criptografia da senha (Segurança em primeiro lugar!)
        const salt = await bcrypt.genSalt(10);
        const senhaCripto = await bcrypt.hash(senha, salt);

        // 4. Inserção no banco da Aiven
        const query = "INSERT INTO usuarios (nome_usuario, senha_usuario, role_usuario, empresa_usuario) VALUES (?, ?, ?, ?)";
        await pool.execute(query, [usuario, senhaCripto, 2, empresa]);

        return NextResponse.json(
            { status: 'success', message: 'Usuário cadastrado com sucesso!' },
            { status: 201 }
        );

    } catch (error: any) {
        console.error('Erro no cadastro:', error);
        return NextResponse.json(
            { status: 'error', message: 'Erro ao processar cadastro' },
            { status: 500 }
        );
    }
}