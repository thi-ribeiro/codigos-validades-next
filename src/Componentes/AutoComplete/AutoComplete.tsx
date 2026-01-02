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
	//const [resultado, setResultado] = useState<Record<string, any>>({});
	const [resultado, setResultado] = useState<any[]>([]);
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
		// 1. Prevenção de comportamento padrão do form
		if (e && typeof e.preventDefault === 'function') {
			e.preventDefault();
		}

		// 2. Se o campo estiver vazio ou for muito curto, limpa e nem faz o fetch
		if (!produtoDetail || produtoDetail.length < 2) {
			setResultado([]);
			return;
		}

		try {
			setLoading(true);

			// 3. Chamada para a nossa nova API interna
			// Note que passamos 'term' em vez de 'autoCompleteSearch' para bater com a rota
			const response = await fetch(
				`/api/autocomplete?term=${encodeURIComponent(
					produtoDetail
				)}&searchByMarca=${searchByMarca}&searchByNome=${searchByNome}`,
				{
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
					},
				}
			);

			if (!response.ok) {
				throw new Error('Falha ao buscar sugestões');
			}

			const data = await response.json();

			// 4. Verificação dos dados
			if (data && Array.isArray(data.dados) && data.dados.length > 0) {
				setResultado(data.dados);
			} else {
				setResultado([]); // Se o banco retornar vazio, escondemos a div de sugestões
			}
		} catch (error) {
			console.error('Fetch error:', error);
			setResultado([]); // Limpa em caso de erro para não travar a UI aberta
		} finally {
			setLoading(false); // O finally garante que o loading pare independente do resultado
		}
	};

	const onChangeHandle = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;

		setProdutoSelecionado(value);

		if (value.length >= 3) {
			fetchNameProducts(marca, nome, e, value);
		} else {
			setResultado([]);
		}
	};

	const selecionarProdutoHandler = (produto: string) => {
		setProdutoSelecionado(produto);
		setResultado([]);
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

					{Array.isArray(resultado) && resultado.length >= 1 && (
						<div className='autocompleteResults' ref={autocompleteRef}>
							{resultado.map((item: any, index: number) => (
								<div
									key={index}
									className='autocompleteItem'
									onClick={() => selecionarProdutoHandler(item.valor)}>
									{item.valor}
								</div>
							))}
						</div>
					)}

					{/* {resultado?.length >= 1 && (
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
					)} */}
				</div>
			}
		</React.Fragment>
	);
};

export default AutoComplete;
