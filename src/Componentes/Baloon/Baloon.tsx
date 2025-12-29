'use-client';

import React, { useEffect, useRef, useState } from 'react';

type Props = {
	conteudo: React.ReactNode;
	conteudoPai: React.ReactNode;
	conteudoPaiClassName: string;
};

function Baloon({ conteudo, conteudoPai, conteudoPaiClassName }: Props) {
	const [ativo, setAtivo] = useState(false);

	const baloonTarget = useRef<HTMLDivElement>(null);
	const paiRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		function clicarFora(event: MouseEvent) {
			// Se o clique NÃO foi no balão E NÃO foi no elemento que disparou
			if (
				baloonTarget.current &&
				!(baloonTarget.current as HTMLDivElement).contains(event.target as Node)
			) {
				setAtivo(false); // Fecha o balão
				console.log('CLICOU FORA');
			}
		}

		if (ativo) {
			document.addEventListener('click', clicarFora);
			console.log('Adicionado o onclick de fora');
		}

		return () => {
			document.removeEventListener('click', clicarFora);
		};
	}, [ativo]);

	// Função para alternar o estado do balão (abrir/fechar)
	const toggleBaloon = () => {
		setAtivo((prev) => !prev);
	};

	return (
		<React.Fragment>
			<div ref={paiRef} onClick={toggleBaloon} className=''>
				{conteudoPai}
			</div>

			{ativo && (
				<div
					ref={baloonTarget}
					onClick={toggleBaloon}
					className='toogleDescription'>
					{conteudo}
				</div>
			)}
		</React.Fragment>
	);
}

export default Baloon;
