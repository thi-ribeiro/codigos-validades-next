import { NextResponse } from 'next/server';
import { pool } from '@/app/lib/db'; // O seu pool com a porta 13476 fixa
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export async function POST(request: Request) {
    try {
        const { usuario, senha } = await request.json();

        // 1. Busca o usuário no MariaDB do Aiven
        const [rows]: any = await pool.query(
            "SELECT * FROM usuarios WHERE nome_usuario = ?",
            [usuario]
        );

        if (rows.length === 0) {
            return NextResponse.json(
                { status: 'error', message: 'Usuário não encontrado' },
                { status: 401 }
            );
        }

        const user = rows[0];
        console.log(user);

        const hashFormatado = user.senha_usuario.replace(/^\$2y\$/, '$2a$');
        // 2. Compara a senha (compatível com password_hash do PHP)
        const senhaValida = await bcrypt.compare(senha, hashFormatado);

        if (!senhaValida) {
            return NextResponse.json(
                { status: 'error', message: 'Senha incorreta' },
                { status: 401 }
            );
        }

        // 3. Cria o Token JWT
        const token = jwt.sign(
            {
                id: user.idusuario,
                nome: user.nome_usuario,
                role: user.role_usuario,
                empresa: user.empresa_usuario
            },
            process.env.JWT_SECRET || 'chave_segura_provisoria_123', // Defina no painel da Vercel
            { expiresIn: '7d' } // Expira em 7 dias para facilitar seu uso no Atacadão
        );

        // 4. Prepara a resposta e injeta o Cookie HTTPOnly
        const response = NextResponse.json({
            status: 'success',
            message: 'Login realizado com sucesso!',
            user: { nome: user.nome_usuario, role: user.role_usuario, empresa: user.empresa_usuario }
        });

        response.cookies.set('auth_token', token, {
            httpOnly: true, // Protege contra ataques XSS
            secure: process.env.NODE_ENV === 'production', // Só envia via HTTPS na Vercel
            sameSite: 'strict', // Protege contra CSRF
            maxAge: 60 * 60 * 24 * 7, // 7 dias em segundos
            path: '/', // Disponível em todo o site
        });

        return response;

    } catch (error) {
        console.error('Erro no login:', error);
        return NextResponse.json(
            { status: 'error', message: 'Erro interno no servidor' },
            { status: 500 }
        );
    }
}