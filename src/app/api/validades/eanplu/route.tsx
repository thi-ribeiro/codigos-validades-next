import { NextResponse } from 'next/server';
import { pool } from '@/app/lib/db'; // [cite: 2025-12-31]

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { ean_produto, plu_produto, descricao_produto, marca_produto } = body;

		// Substitua seu SQL por este:
		const sql = `
    INSERT INTO ean_plu_produtos 
    (ean_produto, plu_produto, descricao_produto, marca_produto) 
    VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE 
    plu_produto = VALUES(plu_produto),
    descricao_produto = VALUES(descricao_produto),
    marca_produto = VALUES(marca_produto)
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
				exists: true,
				message: 'Produto já existe no cadastro. Nada foi alterado.',
			});
		}

		// Logica de resposta atualizada:
		// No MySQL, affectedRows é 1 para insert novo e 2 para update de registro existente.
		if (result.affectedRows === 2) {
			return NextResponse.json({
				success: true,
				updated: true,
				message: 'Produto já existia e os dados foram atualizados!',
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
