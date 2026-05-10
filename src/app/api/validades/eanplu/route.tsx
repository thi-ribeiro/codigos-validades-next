import { NextResponse } from 'next/server';
import { pool } from '@/app/lib/db'; // [cite: 2025-12-31]

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { ean_produto, plu_produto, descricao_produto, marca_produto } = body;

		const [existente]: any = await pool.execute(
			'SELECT * FROM ean_plu_produtos WHERE ean_produto = ? OR plu_produto = ? LIMIT 1',
			[ean_produto, plu_produto],
		);

		if (existente.length > 0) {
			// Se achou, interrompe e avisa o usuário
			return NextResponse.json({
				success: true,
				exists: true,
				message: 'EAN ou PLU já cadastrado. Nada foi alterado.',
			});
		}

		const sql = `
    INSERT INTO ean_plu_produtos 
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
