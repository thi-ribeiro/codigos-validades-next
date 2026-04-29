import React, { useState } from 'react';

interface MenuProps {
	filtrarVencimentos: () => void;
	filtrarEmAberto: () => void;
	filtrarFinalizados: () => void;
}

// Desestruturando as funções direto nas chaves
export default function FiltroValidades({
	filtrarVencimentos,
	filtrarEmAberto,
	filtrarFinalizados,
}: MenuProps) {
	const [menuAberto, setMenuAberto] = useState(false);

	return (
		<div className={`menu-lateral ${menuAberto ? 'aberto' : 'fechado'}`}>
			{/* O botão da setinha */}
			<button
				type='button' // Boa prática adicionar o type
				className='botao-toggle'
				onClick={() => setMenuAberto(!menuAberto)}>
				{menuAberto ? '❮' : '❯'}
			</button>

			{/* Seus botões de filtro */}
			<div className='conteudo-menu'>
				<button
					type='button'
					className='btn-todos'
					onClick={() => {
						filtrarEmAberto();
						setMenuAberto(false);
					}}>
					EA
				</button>
				<button
					type='button'
					className='btn-finalizado'
					onClick={() => {
						filtrarFinalizados();
						setMenuAberto(false);
					}}>
					F
				</button>
				<button
					type='button'
					className='btn-vencendo'
					onClick={() => {
						filtrarVencimentos();
						setMenuAberto(false);
					}}>
					V
				</button>
			</div>
		</div>
	);
}
