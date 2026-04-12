import { useState } from 'react';

import React from 'react';

export default function FiltroValidades() {
	const [menuAberto, setMenuAberto] = useState(false);

	return (
		<div className={`menu-lateral ${menuAberto ? 'aberto' : 'fechado'}`}>
			{/* O botão da setinha que fica sempre visível */}
			<button
				className='botao-toggle'
				onClick={() => setMenuAberto(!menuAberto)}>
				{menuAberto ? '❮' : '❯'}
			</button>

			{/* Seus botões de filtro */}
			<div className='conteudo-menu'>
				<button className='btn-todos'>T</button>
				<button className='btn-vencendo'>V</button>
			</div>
		</div>
	);
}
