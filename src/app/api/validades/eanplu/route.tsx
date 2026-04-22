import { NextResponse } from 'next/server';
import { pool } from '@/app/lib/db'; // [cite: 2025-12-31]

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { ean_produto, plu_produto, descricao_produto, marca_produto } = body;

		// O 'IGNORE' faz o MySQL pular o insert se o EAN já existir,
		// em vez de retornar um erro e travar o sistema.
		const sql = `
            INSERT IGNORE INTO ean_plu_produtos 
            (ean_produto, plu_produto, descricao_produto, marca_produto) 
            VALUES (?, ?, ?, ?)
        `;

		const values = [
			ean_produto || null,
			plu_produto || null,
			descricao_produto,
			marca_produto,
		];
		const [result]: any = await pool.execute(sql, values);

		// Se affectedRows for 0, o banco ignorou porque já existia.
		if (result.affectedRows === 0) {
			return NextResponse.json({
				success: true,
				message: 'Produto já existe no cadastro. Nada foi alterado.',
			});
		}

		return NextResponse.json({
			success: true,
			message: 'Novo produto cadastrado com sucesso!',
			id: result.insertId,
		});
	} catch (error: any) {
		return NextResponse.json(
			{ error: 'Erro no servidor: ' + error.message },
			{ status: 500 },
		);
	}
}
