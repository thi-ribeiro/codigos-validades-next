import { NextResponse } from 'next/server';

export async function POST() {
    const response = NextResponse.json({ message: 'Logout realizado com sucesso' });

    // Deleta o cookie definindo o tempo de vida como zero
    response.cookies.set('auth_token', '', {
        httpOnly: true,
        expires: new Date(0), // Data no passado expira o cookie na hora
        path: '/',
    });

    return response;
}