import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;
  const { pathname } = request.nextUrl;

  // 1. Defina as rotas que são "Áreas Restritas" (onde o token é obrigatório)
  // Se a sua lista de produtos está na raiz, inclua o '/' aqui.
  const protectedRoutes = ["/validades"];

  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  );

  // Se está protegido e NÃO tem token -> Manda pro Login
  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // SE JÁ TEM TOKEN e está tentando acessar a tela de login -> Manda pra Home/Validades
  if (pathname === "/login" && token) {
    return NextResponse.redirect(new URL("/validades", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
