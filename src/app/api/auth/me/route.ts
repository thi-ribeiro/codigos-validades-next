import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose'; // Instale com: npm install jose

export async function GET() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
        return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);

        // Retorna os dados que estavam dentro do JWT (ex: id, nome, cargo)
        return NextResponse.json({
            authenticated: true,
            user: payload
        });
    } catch (error) {
        return NextResponse.json({ authenticated: false }, { status: 401 });
    }
}