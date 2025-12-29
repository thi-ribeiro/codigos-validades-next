import _ from 'lodash';
import React, { useEffect, useRef, useState } from 'react';

export interface AutoCompleteProps {
	placeholder?: string;
	marca?: boolean;
	nome?: boolean;
	nameInput?: string;
	required?: boolean;
	valorPadrao?: string;
}

const AutoComplete = (props: AutoCompleteProps) => {
	//Aqui desestruturo as props e defino valores padrao para elas
	const {
		placeholder = 'Buscar ...', // Valor padrão para placeholder
		marca = false,
		nome = false,
		nameInput = '', // Valor padrão para nameInput
		required = false, // Valor padrão para required
		valorPadrao = '',
	} = props;

	const [loading, setLoading] = useState<boolean>(false);
	const [resultado, setResultado] = useState<Record<string, any>>({});
	const [produtoSelecionado, setProdutoSelecionado] = useState<string>(
		valorPadrao || ''
	);

	const autocompleteRef = useRef<HTMLDivElement>(null); // Ref para a div de resultados

	// Efeito para fechar a div de autocomplete ao clicar fora
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			// Se a div de autocomplete existe E o clique NÃO foi dentro dela
			if (
				autocompleteRef.current &&
				!autocompleteRef.current.contains(event.target as Node)
			) {
				setResultado([]); // <--- Limpa os resultados, o que faz a div desaparecer
			}
		};

		// Função para lidar com o pressionar da tecla 'Tab' ou 'Escape'
		function handleKeyDown(event: KeyboardEvent) {
			if (resultado.length && (event.key === 'Tab' || event.key === 'Escape')) {
				event.preventDefault();
				setResultado([]);
			}
		}

		// Adiciona o event listener APENAS se houver resultados para mostrar (ou seja, a div está aberta)
		if (resultado.length > 0) {
			document.addEventListener('mousedown', handleClickOutside);
			document.addEventListener('keydown', handleKeyDown);
		}

		// Função de limpeza: remove o event listener quando o componente desmonta ou quando resultado.length se torna 0
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
			document.removeEventListener('keydown', handleKeyDown);
		};
	}, [resultado.length]); // O efeito roda novamente quando a quantidade de resultados muda

	const fetchNameProducts = async (
		searchByMarca: boolean,
		searchByNome: boolean,
		e?: React.FormEvent,
		produtoDetail: string = ''
	) => {
		if (e && typeof e.preventDefault === 'function') {
			e.preventDefault();
		}

		if (!produtoDetail) {
			setResultado({}); // Limpa resultados se o termo estiver vazio
			return;
		}

		try {
			setLoading(true);
			const acesso_fetch = process.env.NEXT_PUBLIC_API_URL;
			const response = await fetch(
				`${acesso_fetch}?autoCompleteSearch=${produtoDetail}&searchByMarca=${searchByMarca}&searchByNome=${searchByNome}`,
				{
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
					},
				}
			);
			if (!response.ok) {
				throw new Error('Network response was not ok');
			}
			const data = await response.json();
			//const agruparPorMarca = _.groupBy(data[0].dados, 'marca_produto');
			if (data && Array.isArray(data.dados) && data.dados.length > 0) {
				setResultado(data.dados); // Define os resultados, o que faz a div aparecer
			} else {
				setResultado({}); // Limpa se não houver dados válidos, o que faz a div desaparecer
			}

			setLoading(false);
		} catch (error) {
			console.error('Fetch error:', error);
			setLoading(false);
			setResultado({}); // Limpa resultados em caso de erro
		}
	};

	const onChangeHandle = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;

		setProdutoSelecionado(value);

		if (value.length >= 3) {
			fetchNameProducts(marca, nome, e, value);
		} else {
			setResultado({});
		}
	};

	const selecionarProdutoHandler = (produto: string) => {
		setProdutoSelecionado(produto);
		setResultado({});
	};

	return (
		<React.Fragment>
			{
				<div className='autocompleteContainer'>
					<input
						type='text'
						placeholder={placeholder}
						onChange={(e) => onChangeHandle(e)}
						value={produtoSelecionado}
						name={nameInput}
						autoComplete='off'
						required={required} // Adiciona o atributo required se necessário
					/>

					{resultado?.length >= 1 && (
						<div className='autocompleteResults' ref={autocompleteRef}>
							{resultado.map((produto: any, index: number) => {
								const displayParts = [];
								if (nome && produto.nome_produto) {
									displayParts.push(produto.nome_produto);
								}
								if (marca && produto.marca_produto) {
									displayParts.push(produto.marca_produto);
								}

								if (displayParts.length === 0) {
									return null;
								}

								// 1. Calcule o texto exato que será exibido
								const textoExibido = displayParts.join(' - ');

								return (
									<div
										key={index + 1} // Sempre use uma chave única e estável
										className='autocompleteItem'
										onClick={() => selecionarProdutoHandler(textoExibido)}>
										{textoExibido}
									</div>
								);
								// if (!produto.nome_produto || !produto.marca_produto) {
								// 	return null;
								// } else {
								// 	return (
								// 		<div
								// 			key={index}
								// 			className='autocompleteItem'
								// 			onClick={() => selecionarProdutoHandler(produto)}>
								// 			{produto.nome_produto} - {produto.marca_produto}
								// 		</div>
								// 	);
								// }
							})}
						</div>
					)}
				</div>
			}
		</React.Fragment>
	);
};

export default AutoComplete;
