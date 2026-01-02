import { NextResponse } from 'next/server';
import { pool } from '@/app/lib/db'; // Importa a piscina que você criou

export async function GET(request: Request) {
    try {
        // 1. Capturar parâmetros da URL (Filtro de marca)
        const { searchParams } = new URL(request.url);
        const marca = searchParams.get('marca') || '';
        const termoMarca = `%${marca}%`;

        // 2. Lógica de Datas (Substituindo o modify do PHP)
        const hoje = new Date();

        // Início do mês atual: YYYY-MM-01
        const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
            .toISOString().split('T')[0];

        // Último dia do mês que vem: YYYY-MM-DD
        const dataFim = new Date(hoje.getFullYear(), hoje.getMonth() + 2, 0);
        const fimMesSeguinte = dataFim.toISOString().split('T')[0];

        // Data formatada para o frontend (ISO String)
        const dataFimIntervaloFormatada = dataFim.toISOString();

        // 3. Simulação de Auth (Depois você integra com seu JWT/Cookie)
        // No Next.js, você pegaria isso do cookie da requisição
        const userRole = 1; // 1 para Admin
        const userId = 123; // UID do usuário

        let query = "";
        let params = [];

        // 4. Montagem da Query igual ao seu PHP
        if (userRole === 1) { // Administrador
            query = `
                SELECT *, DATE_FORMAT(validade, '%d/%m/%Y') AS validadeDiaMes 
                FROM validades 
                WHERE validade BETWEEN ? AND ? 
                AND marca_produto LIKE ? 
                ORDER BY validade ASC, produto ASC`;
            params = [inicioMes, fimMesSeguinte, termoMarca];
        } else { // Usuário Comum
            query = `
                SELECT *, DATE_FORMAT(validade, '%d/%m/%Y') AS validadeDiaMes 
                FROM validades 
                WHERE validade BETWEEN ? AND ? 
                AND id_responsavel = ? 
                AND marca_produto LIKE ? 
                ORDER BY validade ASC, produto ASC`;
            params = [inicioMes, fimMesSeguinte, userId, termoMarca];
        }

        // 5. Execução das Queries (Listagem e Marcas para o Filtro)
        // Usando destructuring [rows] pois o mysql2 retorna um array com [dados, metadados]
        const [resultados] = await pool.execute(query, params);
        const [marcasBrutas] = await pool.execute(
            "SELECT DISTINCT marca_produto FROM validades ORDER BY marca_produto ASC"
        );

        // 6. Resposta Final
        if (Array.isArray(resultados) && resultados.length > 0) {
            return NextResponse.json({
                dados: resultados,
                marcas: marcasBrutas,
                dataFimIntervalo: dataFimIntervaloFormatada
            }, { status: 200 });
        }

        return NextResponse.json({
            status: 'info',
            message: 'Nenhuma validade encontrada para o período especificado.',
            marcas: marcasBrutas,
            dataFimIntervalo: dataFimIntervaloFormatada
        }, { status: 200 }); // Retornamos 200 mesmo vazio para o front tratar como 'info'

    } catch (error) {
        console.error('Erro na API de Validades:', error);
        return NextResponse.json(
            { error: 'Erro interno ao processar a consulta' },
            { status: 500 }
        );
    }
}