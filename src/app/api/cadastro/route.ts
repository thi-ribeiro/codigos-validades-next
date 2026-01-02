import { NextResponse } from 'next/server';
import { pool } from '@/app/lib/db';
import bcrypt from 'bcryptjs'; // npm install bcryptjs (mais seguro que password_hash)

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { usuario, senha, empresa } = body;

        // 1. Validação simples
        if (!usuario || !senha || !empresa) {
            return NextResponse.json(
                { status: 'error', message: 'Preencha todos os campos!' },
                { status: 400 }
            );
        }

        // 2. Verificar se o usuário já existe
        const queryIfExist = "SELECT * FROM usuarios WHERE nome_usuario = ?";
        const [existingUser]: any = await pool.execute(queryIfExist, [usuario]);

        if (Array.isArray(existingUser) && existingUser.length > 0) {
            return NextResponse.json(
                { status: 'info', message: 'Usuário já cadastrado!' },
                { status: 200 } // Mantendo o padrão que você usava no PHP
            );
        }

        // 3. Criptografar a senha (Equivalente ao password_hash)
        const salt = await bcrypt.genSalt(10);
        const senhaCripto = await bcrypt.hash(senha, salt);

        // 4. Inserir no banco da Aiven
        // Role 2 conforme seu código original
        const query = "INSERT INTO usuarios (nome_usuario, senha_usuario, role_usuario, empresa_usuario) VALUES (?, ?, ?, ?)";
        await pool.execute(query, [usuario, senhaCripto, 2, empresa]);

        return NextResponse.json(
            { status: 'success', message: 'Usuário cadastrado com sucesso!' },
            { status: 201 }
        );

    } catch (error: any) {
        console.error('Erro no cadastro:', error.message);
        return NextResponse.json(
            { status: 'error', message: 'Erro interno no servidor' },
            { status: 500 }
        );
    }
}