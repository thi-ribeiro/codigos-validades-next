import { NextResponse } from 'next/server';
import { pool } from '@/app/lib/db'; // Seu pool com a porta 13476 fixa
import bcrypt from 'bcrypt';

export async function POST(request: Request) {
    try {
        const { usuario, senha, empresa } = await request.json();

        // 1. Verificar se usuário existe (Equivalente ao seu SELECT no PHP)
        const [exist]: any = await pool.query(
            "SELECT * FROM usuarios WHERE nome_usuario = ?",
            [usuario]
        );

        if (exist.length > 0) {
            return NextResponse.json(
                { status: 'info', message: 'Usuário já cadastrado!' },
                { status: 200 }
            );
        }

        // 2. Criar o Hash (Equivalente ao password_hash do PHP)
        const saltRounds = 10;
        const senhaHash = await bcrypt.hash(senha, saltRounds);

        // 3. Inserir no Banco
        await pool.execute(
            "INSERT INTO usuarios (nome_usuario, senha_usuario, role_usuario, empresa_usuario) VALUES (?, ?, ?, ?)",
            [usuario, senhaHash, 2, empresa]
        );

        return NextResponse.json(
            { status: 'success', message: 'Usuário cadastrado com sucesso!' },
            { status: 201 }
        );

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Erro no servidor' }, { status: 500 });
    }
}