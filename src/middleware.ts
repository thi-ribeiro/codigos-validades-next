// import { NextResponse } from 'next/server';
// import type { NextRequest } from 'next/server';

// export function middleware(request: NextRequest) {
//     // 1. Tenta pegar o token do cookie
//     const token = request.cookies.get('auth_token')?.value;
//     //console.log("Passou pelo Middleware! Rota acessada:", request.nextUrl.pathname);

//     // 1. Defina a lista de rotas que precisam de login
//     const protectedRoutes = ['/validades', '/admin', '/configuracoes', '/'];

//     // 2. Verifique se a rota atual começa com alguma das rotas da lista
//     //SOME FUNCIONA COMO UM INCLUDES DENTRO DO ARRAY
//     const isProtectedRoute = protectedRoutes.some(route =>
//         request.nextUrl.pathname.startsWith(route)
//     );

//     if (isProtectedRoute) {
//         if (!token) {
//             // Se tentar entrar no dashboard sem token, vai para o login
//             return NextResponse.redirect(new URL('/login', request.url));
//         }

//         // Opcional: Se o token existir mas você quer garantir que ele seja removido 
//         // caso algo dê errado (ex: formato estranho), você pode fazer aqui.
//     }

//     return NextResponse.next();
// }

// // 3. Configura para o middleware NÃO rodar em arquivos de imagem, css ou na tela de login
// export const config = {
//     matcher: ['/((?!api|_next/static|_next/image|favicon.ico|login).*)'],
// };

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const token = request.cookies.get('auth_token')?.value;
    const { pathname } = request.nextUrl;

    // 1. Defina as rotas que são "Áreas Restritas" (onde o token é obrigatório)
    // Se a sua lista de produtos está na raiz, inclua o '/' aqui.
    const protectedRoutes = ['/', '/validades', '/admin', '/configuracoes'];

    const isProtectedRoute = protectedRoutes.some(route =>
        pathname === route || pathname.startsWith(route + '/')
    );

    // 2. Se o cara tentar entrar em qualquer rota protegida (inclusive a Home) sem token
    if (isProtectedRoute && !token) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // 3. Se ele estiver no /login, a gente não faz NADA. 
    // Mesmo logado, ele vai conseguir ver a tela de login.

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};