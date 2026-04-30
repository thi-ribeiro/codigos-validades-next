import React, {
	useContext,
	createContext,
	useState,
	useMemo,
	useCallback,
} from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './Toast';
import _ from 'lodash';
import { ptBR } from 'date-fns/locale';
import {
	differenceInDays,
	format,
	isAfter,
	parseISO,
	startOfDay,
} from 'date-fns';
import {
	IoIosCheckmarkCircleOutline,
	IoIosCloseCircleOutline,
	IoMdTrendingDown,
} from 'react-icons/io';

export interface ProviderProps {
	children: React.ReactNode;
}

export interface ValuesInterface {
	fetchValidades: (produtoMarca?: string) => Promise<void>;
	fetchAddValidade: (
		e: React.FormEvent,
		callbackSucesso: () => void,
	) => Promise<void>;
	fetchEditarValidade: (
		e: React.FormEvent,
		callbackSucesso: () => void,
	) => Promise<void>;
	fetchDeletarValidade: (
		id: string | number,
		callbackSucesso: () => void,
	) => void;
	formatarDataParaMySQL: (data: Date) => string;
	ValidadeVerificada: (props: {
		verificado: number;
		dataInserida: string;
	}) => React.JSX.Element;
	ValidadeFinalizada: (props: {
		finalizado: number;
		dataFinalizado: string;
		verificado: number;
	}) => React.JSX.Element;
	ProdutoEmRebaixa: (props: {
		Rebaixa: number;
		dataRebaixa: string;
	}) => React.JSX.Element;
	calcularDiasRestantes: (
		dataDeValidade: string,
		finalizado: number,
	) => React.JSX.Element;

	fetchAddCodeEanPlu: (
		e: React.FormEvent,
		callbackSucesso: () => void,
	) => Promise<void>;
	produtosValidades: Record<string, ValidadeProduto[]>;
	produtosExibidos: Record<string, ValidadeProduto[]>;
	setFiltroAtivo: (filtro: string) => void;
	marcasProdutos: Record<string, MarcaProdutoInterface[]>;
	// validadesSeparadas: Record<string, ValidadeProduto[]>;
	loading: boolean;
	loadingButtons: boolean;
	dataFimIntervalo: string | 'Indefinido';
	nomeProduto: string;
	setNomeProduto: (nome: string) => void;
	listaBruta: ValidadeProduto[];
}

export interface ValidadeProduto {
	idvalidades: number;
	produto: string;
	validade: string; // Ou Date, se você for convertê-la no frontend
	responsavel: string;
	data_inserido: string; // Ou Date
	verificado: number; // Ou boolean, se você for convertê-lo
	data_verificado: string; // Ou Date
	finalizado: number; // Ou boolean
	data_finalizado: string; // Ou Date
	validadeDiaMes: string; // Formato 'dd/mm/yyyy'
	marca_produto: string; // Adicionando a marca do produto
	quantidade_produto: string;
	codigoProduto: string;
	codigoInterno: string;
	rebaixa: number;
	data_rebaixa: string;
	tipoquantidade: string;
	descricao_produto: string;
}

export interface MarcaProdutoInterface {
	marca_produto: string;
}

interface ResponseData {
	auth?: boolean; // 'auth' é opcional aqui, pois pode não vir em todas as respostas
	status?: string; // 'status' também é opcional, caso venha para mensagens de info/erro
	message?: string; // 'message' também é opcional
	marcas?: any[]; // Melhor ainda: string[]
	dados?: any[]; // Melhor ainda: ValidadeProduto[]
	dataFimIntervalo?: Date;
}

interface EstoqueOrganizado {
	finalizados?: Record<string, ValidadeProduto[]>;
	pendentes?: Record<string, ValidadeProduto[]>;
	[key: string]: any; //pra evitar erro ... a chave vai ser sempre uma string...
}

const acesso_validades = process.env.NEXT_PUBLIC_VALIDADES_API;

const ValidadesContexto = createContext<ValuesInterface | undefined>(undefined);

export default function ValidadesProvider({ children }: ProviderProps) {
	const [produtosValidades, setProdutosValidades] = useState<
		Record<string, ValidadeProduto[]>
	>({});

	const [dataFimIntervalo, setdataFimIntervalo] = useState<string>('');
	const [marcasProdutos, setmarcasProdutos] = useState<
		Record<string, MarcaProdutoInterface[]>
	>({});
	// const [validadesSeparadas, setValidadesSeparadas] =
	// 	useState<EstoqueOrganizado>({ finalizados: {}, pendentes: {} });
	const [filtroAtivo, setFiltroAtivo] = useState('todos'); // Pode ser 'todos' ou 'vencendo'
	const [nomeProduto, setNomeProduto] = useState<string>('');

	const [loading, setLoading] = useState(true);
	const [loadingButtons, setLoadingButtons] = useState(false);

	const [listaBruta, setListaBruta] = useState<ValidadeProduto[]>([]);

	const { user, logout } = useAuth();
	const { addToast } = useToast();

	// Isso aqui fica "solto" no corpo do seu componente ValidadesProvider
	//FICA OBSERVANDO O ESTADO DE LISTA BRUTA E ORGANIZANDO OS DADOS
	const validadesSeparadas = useMemo(() => {
		// 1. ORDENAÇÃO: Garante que tudo esteja em ordem cronológica antes de separar
		// Usamos o campo 'validade' (que deve ser YYYY-MM-DD) para ordenar corretamente
		const listaOrdenada = _.sortBy(listaBruta, ['validade']);

		// 2. Separa o que é finalizado do que é pendente (usando a lista já ordenada)
		const [finalizados, pendentes] = _.partition(listaOrdenada, {
			finalizado: 1,
		});

		// 3. Agrupa os dois. Como a lista já veio ordenada, os grupos ficarão na ordem certa
		return {
			finalizados: _.groupBy(finalizados, 'validadeDiaMes'),
			pendentes: _.groupBy(pendentes, 'validadeDiaMes'),
		};
	}, [listaBruta]);

	const fetchValidades = async (produtoMarca: string = '') => {
		setLoading(true);
		try {
			const response = await fetch(
				`${acesso_validades}/listar/?marca=${produtoMarca}`,
				{
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
					},
					// Importante manter para o Middleware ler o seu cookie auth_token
					credentials: 'include',
				},
			);

			const data = await response.json();

			if (data && Array.isArray(data.dados)) {
				setmarcasProdutos(data.marcas);
				// Salva a lista bruta! O useMemo lá em cima vai perceber e agrupar.
				setListaBruta(data.dados);

				if (data.dataFimIntervalo) {
					setdataFimIntervalo(
						format(new Date(data.dataFimIntervalo), 'MMMM/yyyy', {
							locale: ptBR,
						}),
					);
				}
			}
		} catch (error) {
			console.error(error);
		} finally {
			setLoading(false);
		}
	};

	const fetchValidadesX = async (
		produtoMarca: string = '',
		filtro: string = 'validadeDiaMes',
	) => {
		setLoading(true);
		try {
			// Agora apontamos para a nossa nova API interna do Next.js
			// Passamos apenas a marca, pois o resto a API resolve via Cookie/JWT
			const response = await fetch(
				`${acesso_validades}/listar/?marca=${produtoMarca}`,
				{
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
					},
					// Importante manter para o Middleware ler o seu cookie auth_token
					credentials: 'include',
				},
			);

			const data = await response.json();

			// Se a API retornar erro de autenticação (ex: 401)
			if (response.status === 401) {
				setLoading(false);
				logout();
				return;
			}

			// data.dados contém os produtos e data.marcas as marcas para o filtro
			if (data && Array.isArray(data.dados) && Array.isArray(data.marcas)) {
				setmarcasProdutos(data.marcas);
				setdataFimIntervalo(data.dataFimIntervalo);

				// const agruparValidade = _.chain(data.dados)
				// 	.filter((item) => item.finalizado === 1)
				// 	.groupBy(filtro)
				// 	.value();

				const [pendentes, finalizados] = _.partition(data.dados, {
					finalizado: 1,
				});

				let agrupar = {
					finalizados: _.groupBy(finalizados, filtro),
					pendentes: _.groupBy(pendentes, filtro),
				};

				//setValidadesSeparadas(agrupar);

				//console.log(agrupar);

				//let grupoPendencia = _.groupBy(agrupados[0], filtro);

				//setProdutosValidades(grupoPendencia);
				//console.log(agrupar);
				//console.log(agruparValidade);

				if (data.dataFimIntervalo) {
					setdataFimIntervalo(
						format(new Date(data.dataFimIntervalo), 'MMMM/yyyy', {
							locale: ptBR,
						}),
					);
				}
			} else {
				// Se for o caso de 'Nenhuma validade encontrada' (status 200 ou 404)
				setProdutosValidades({});
				//setValidadesSeparadas({});
				if (data.marcas) setmarcasProdutos(data.marcas);
			}
		} catch (error: any) {
			console.error('Fetch error:', error);
			// addToast('Erro ao carregar dados', 'error');
		} finally {
			setLoading(false);
		}
	};

	const dadosParaExibir = useMemo(() => {
		// Pegamos a caixa de pendentes que o Lodash já separou para nós
		let listaTotal = validadesSeparadas;
		// console.log(validadesSeparadas);
		// Se não tem busca por nome e o filtro está em 'todos', mostra todos os pendentes
		if (filtroAtivo === 'finalizado' && !nomeProduto) {
			return validadesSeparadas.finalizados;
		}

		const hoje = startOfDay(new Date());
		const limite5Dias = new Date();
		limite5Dias.setDate(hoje.getDate() + 5);

		const novoObjetoFiltrado: Record<string, ValidadeProduto[]> = {};

		// Percorremos apenas as datas que têm produtos pendentes
		Object.keys(listaTotal.pendentes).forEach((dataChave) => {
			const itensFiltrados = listaTotal.pendentes[dataChave].filter((item) => {
				// 1. Filtro por Nome
				const matchesNome = nomeProduto
					? item.produto.toLowerCase().includes(nomeProduto.toLowerCase())
					: true;

				// 2. Filtro por Status "Vencendo" (menos de 5 dias)
				if (filtroAtivo === 'vencendo') {
					const dataVal = parseISO(item.validade.split('T')[0]);
					const estaPertoDeVencer = dataVal <= limite5Dias;
					return estaPertoDeVencer && matchesNome;
				}

				return matchesNome;
			});

			if (itensFiltrados.length > 0) {
				novoObjetoFiltrado[dataChave] = itensFiltrados;
			}
		});

		return novoObjetoFiltrado;
	}, [
		validadesSeparadas.pendentes,
		validadesSeparadas,
		filtroAtivo,
		nomeProduto,
	]); // Importante: depende dos pendentes agora

	//Remova o parâmetro (nomeProduto) da função interna
	// const dadosParaExibir = useMemo(() => {
	// 	// 1. Se estiver em 'todos' e NÃO houver busca por nome, mostra tudo
	// 	if (filtroAtivo === 'todos' && !nomeProduto) {
	// 		return produtosValidades;
	// 	}

	// 	const hoje = new Date();
	// 	hoje.setHours(0, 0, 0, 0);

	// 	const limite5Dias = new Date();
	// 	limite5Dias.setDate(hoje.getDate() + 5);

	// 	const novoObjetoFiltrado: Record<string, ValidadeProduto[]> = {};

	// 	// Percorre as chaves (ex: 'Laticínios', 'Frios', etc.)
	// 	Object.keys(produtosValidades).forEach((tipoFiltro) => {
	// 		const itensFiltrados = produtosValidades[tipoFiltro].filter((item) => {
	// 			const dataVal = new Date(item.validade);

	// 			// Lógica para o filtro de "Vencendo"
	// 			if (filtroAtivo === 'vencendo') {
	// 				const estaVencendo = dataVal <= limite5Dias && item.finalizado === 0;

	// 				// Se também houver busca por nome, combinamos as duas regras
	// 				if (nomeProduto) {
	// 					const produto = item.produto
	// 						.toLowerCase()
	// 						.includes(nomeProduto.toLowerCase());
	// 					return estaVencendo && produto;
	// 				}

	// 				return estaVencendo;
	// 			}

	// 			// Lógica para quando o filtro estiver em 'todos' mas o usuário digitar um nome
	// 			if (nomeProduto) {
	// 				return item.produto.toLowerCase().includes(nomeProduto.toLowerCase());
	// 			}

	// 			return true;
	// 		});

	// 		if (itensFiltrados.length > 0) {
	// 			novoObjetoFiltrado[tipoFiltro] = itensFiltrados;
	// 		}
	// 	});

	// 	return novoObjetoFiltrado;

	// 	// IMPORTANTE: Adicione nomeProduto nas dependências
	// }, [produtosValidades, filtroAtivo, nomeProduto]);

	// const dadosParaExibir = useMemo(() => {
	// 	// Se não tem texto de busca e o filtro está em 'todos', mostra a lista original
	// 	if (filtroAtivo === 'todos' && !nomeProduto) {
	// 		return produtosValidades;
	// 	}

	// 	const hoje = new Date();
	// 	hoje.setHours(0, 0, 0, 0);

	// 	const limite5Dias = new Date();
	// 	limite5Dias.setDate(hoje.getDate() + 5);

	// 	const novoObjetoFiltrado: Record<string, ValidadeProduto[]> = {};

	// 	Object.keys(produtosValidades).forEach((dataChave) => {
	// 		const itensFiltrados = produtosValidades[dataChave].filter((item) => {
	// 			// 1. Lógica da Data (Voltou para esconder o que passa de 5 dias)
	// 			const dataVal = new Date(item.validade);
	// 			const dentroDoPrazo = dataVal <= limite5Dias;

	// 			// 2. Filtro por Nome
	// 			const matchesNome = nomeProduto
	// 				? item.produto.toLowerCase().includes(nomeProduto.toLowerCase())
	// 				: true;

	// 			// 3. Filtro por Status "Vencendo"
	// 			if (filtroAtivo === 'vencendo') {
	// 				// SÓ passa se: (estiver no prazo de 5 dias) E (não estiver finalizado) E (nome bater)
	// 				return dentroDoPrazo && item.finalizado === 0 && matchesNome;
	// 			}

	// 			// Se o filtro for 'todos' mas tiver busca por nome
	// 			return matchesNome;
	// 		});

	// 		// Só mostra a data se sobrou algum produto nela
	// 		if (itensFiltrados.length > 0) {
	// 			novoObjetoFiltrado[dataChave] = itensFiltrados;
	// 		}
	// 	});

	// 	return novoObjetoFiltrado;
	// }, [produtosValidades, filtroAtivo, nomeProduto]);

	const formatarDataParaMySQL = (data: Date): string => {
		const pad = (num: number) => String(num).padStart(2, '0');

		const ano = data.getUTCFullYear();
		const mes = pad(data.getUTCMonth() + 1);
		const dia = pad(data.getUTCDate());
		const horas = pad(data.getUTCHours());
		const minutos = pad(data.getUTCMinutes());
		const segundos = pad(data.getUTCSeconds());

		return `${ano}-${mes}-${dia} ${horas}:${minutos}:${segundos}`;
	};

	const fetchAddValidade = useCallback(
		async (e: React.FormEvent, callbackSucesso: () => void) => {
			e.preventDefault();

			const formData = new FormData(e.target as HTMLFormElement);
			const produto = formData.get('produto') as string;
			const validade = formData.get('validade') as string;
			const quantidade = formData.get('quantidade') as string;
			const marca = (formData.get('marca') as string).trimEnd();
			const tipoQuantidade = formData.get('tipoquantidade') as string;
			const codigoProduto = formData.get('codigoProduto') as string;
			const codigoInterno = formData.get('codigoInterno') as string;

			const quantidadeDesc = `${quantidade} ${tipoQuantidade}`;

			try {
				setLoadingButtons(true);

				// Aponta para a nova rota da API no Next.js
				const response = await fetch(`${acesso_validades}/adicionar`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						produto,
						marca,
						validade,
						quantidadeDesc,
						responsavel: user?.usuario,
						id_responsavel: user?.uid,
						codigoProduto: codigoProduto,
						codigoInterno: codigoInterno,
						// Mantemos sua função de formatar data para o MySQL
						data_inserido: formatarDataParaMySQL(new Date()),
					}),
					//credentials: 'include',
				});

				// Se o servidor retornar 401 (Não autorizado), o Middleware ou a API avisam
				if (response.status === 401) {
					setLoading(false);
					logout();
					return;
				}

				const data = await response.json();

				if (data && data.status === 'success') {
					addToast(data.message, data.status);

					const itemVindoDoBanco = data.item; // Objeto completo e organizado
					console.log(itemVindoDoBanco);

					// Formata a chave da data para o grupo (Ex: "25/12/2026")
					//const dataObj = new Date(`${validade}T12:00:00`);
					//const validadeFormatada = dataObj.toLocaleDateString('pt-BR');

					setListaBruta((prev) => {
						return [...prev, itemVindoDoBanco];
					});

					callbackSucesso();
				} else {
					addToast(data.message || 'Erro ao cadastrar', data.status || 'error');
				}
			} catch (error) {
				console.error('Fetch error:', error);
				addToast(
					'Erro ao conectar com o servidor. Verifique sua conexão.',
					'error',
				);
			} finally {
				setLoadingButtons(false);
			}
		},
		[user, acesso_validades, setProdutosValidades, fetchValidades],
	);

	const fetchEditarValidade = async (
		e: React.FormEvent,
		callbackSucesso: () => void,
	) => {
		e.preventDefault();
		setLoadingButtons(true);

		const form = e.target as HTMLFormElement;
		const formData = new FormData(form);

		// Captura os checkboxes verificando se eles estão REALMENTE no formData
		const verificado = form.querySelector<HTMLInputElement>(
			'input[name="verificado"]',
		)?.checked
			? 1
			: 0;
		const finalizado = form.querySelector<HTMLInputElement>(
			'input[name="finalizado"]',
		)?.checked
			? 1
			: 0;
		const rebaixa = form.querySelector<HTMLInputElement>(
			'input[name="rebaixa"]',
		)?.checked
			? 1
			: 0;

		const dadosParaEnviar = {
			// Forçamos o ID a ser número para não quebrar o WHERE no MySQL da Vercel
			id_validade: Number(formData.get('id_validade')),
			//produto: formData.get('produto') as string,
			//marca: (formData.get('marca') as string).trimEnd(),
			validade: formData.get('validade') as string,
			// Garanta que o name do input de quantidade seja 'quantidade_produto'
			quantidadeDesc: `${formData.get('quantidade_produto')} ${formData.get('tipoquantidade')}`,
			responsavel: user?.usuario || 'Sistema',
			id_responsavel: user?.uid ? Number(user.uid) : null,
			//codigoProduto: String(formData.get('codigoProduto') || '').trim(),
			codigoInterno: formData.get('codigoInterno') || 0,
			verificado,
			finalizado,
			rebaixa,
		};

		try {
			const response = await fetch(`${acesso_validades}/editar`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(dadosParaEnviar),
			});

			const data = await response.json();

			if (response.ok && data.status === 'success') {
				addToast(data.message, 'success');

				setListaBruta((prev) => {
					return prev.map((item) => {
						if (item.idvalidades === dadosParaEnviar.id_validade) {
							// Recriamos a validade formatada caso a data tenha mudado na edição
							const novaDataFormatada = new Date(
								`${dadosParaEnviar.validade}T12:00:00`,
							).toLocaleDateString('pt-BR');

							return {
								...item,
								...dadosParaEnviar,
								//marca_produto: dadosParaEnviar.marca,
								quantidade_produto: dadosParaEnviar.quantidadeDesc,
								validadeDiaMes: novaDataFormatada,
								//codigoProduto: String(dadosParaEnviar.codigoProduto),
								codigoInterno: String(dadosParaEnviar.codigoInterno),
							} as ValidadeProduto;
						}
						return item; // Se não for o ID que editamos, mantém o item como está
					});
				});

				callbackSucesso();
			} else {
				// Se cair aqui, o 'data.message' vai te dizer o erro real do MySQL (ex: coluna faltando)
				addToast(data.message || 'Erro ao atualizar', 'error');
			}
		} catch (error) {
			addToast('Erro de conexão com o servidor', 'error');
		} finally {
			setLoadingButtons(false);
		}
	};

	const ValidadeVerificada = (props: {
		verificado: number;
		dataInserida: string;
	}) => {
		if (!!props.verificado) {
			//NEGACAO DUPLA, QUE LINDO!?! FORçA O BOOLEANO
			return (
				<IoIosCheckmarkCircleOutline
					size={20}
					color={'green'}
					title={props.dataInserida}
				/>
			);
		} else {
			return (
				<IoIosCloseCircleOutline
					size={20}
					color={'red'}
					title='Aguardando aprovação.'
				/>
			);
		}
	};

	const ProdutoEmRebaixa = (props: {
		Rebaixa: number;
		dataRebaixa: string;
	}) => {
		if (!!props.Rebaixa) {
			return (
				<IoMdTrendingDown size={20} color={'green'} title={props.dataRebaixa} />
			);
		} else {
			return (
				<IoMdTrendingDown
					size={20}
					color={'#aaa'}
					title={'Aguardando rebaixa...'}
				/>
			);
		}
	};

	const ValidadeFinalizada = (props: {
		finalizado: number;
		dataFinalizado: string;
		verificado: number;
	}) => {
		if (!!props.verificado) {
			if (!!props.finalizado) {
				return (
					<IoIosCheckmarkCircleOutline
						size={20}
						color={'green'}
						title={props.dataFinalizado}
					/>
				);
			} else {
				return (
					<IoIosCloseCircleOutline
						size={20}
						color={'red'}
						title='Aguardando finalização.'
					/>
				);
			}
		} else {
			//AQUI ESTA DESATIVADO, POIS A VALIDADE NÃO FOI VERIFICADA
			return (
				<IoIosCloseCircleOutline
					size={20}
					color={'#aaa'}
					title='Aguardando aprovação.'
				/>
			);
		}
	};

	const calcularDiasRestantes = (
		dataDeValidade: string,
		finalizado: number,
	): React.JSX.Element => {
		// 1. Normaliza a data para ignorar o horário e fuso (pega apenas YYYY-MM-DD)
		const apenasData = dataDeValidade.split('T')[0];
		const dataExpiracao = parseISO(apenasData);

		// 2. Zera as horas da data atual para uma comparação justa de "dia contra dia"
		const dataAtual = startOfDay(new Date());

		if (finalizado) {
			return (
				<div style={{ color: 'green', fontWeight: 'bold' }}>Finalizado</div>
			);
		}

		// Se a data de hoje passou da expiração
		if (isAfter(dataAtual, dataExpiracao)) {
			return <div style={{ color: 'red', fontWeight: 'bold' }}>Vencido</div>;
		}

		const diasRestantes = differenceInDays(dataExpiracao, dataAtual);
		const dataFormatada = format(dataExpiracao, 'EEEE (dd/MM)', {
			locale: ptBR,
		});

		// --- Sua nova lógica de alertas ---

		if (diasRestantes === 0) {
			return <div style={{ color: 'red', fontWeight: 'bold' }}>Hoje</div>;
		}

		if (diasRestantes > 0 && diasRestantes <= 5) {
			return (
				<div
					aria-label={dataFormatada}
					data-balloon-pos='right'
					style={{ color: 'orange', fontWeight: 'bold' }}>
					{diasRestantes} dia(s)
				</div>
			);
		}

		// Caso padrão (mais de 5 dias)
		return (
			<div
				aria-label={dataFormatada}
				data-balloon-pos='right'
				className='toogleDescription'>
				{diasRestantes} dia(s)
			</div>
		);
	};

	const fetchDeletarValidade = async (
		id: string | number,
		callbackSucesso: () => void,
	) => {
		if (!confirm('Tem certeza que deseja remover esta validade?')) return;

		try {
			setLoadingButtons(true);

			const response = await fetch(`${acesso_validades}/deletar`, {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id_validade: id }),
			});

			const data = await response.json();

			if (data.status === 'success') {
				addToast(data.message, data.status);

				setListaBruta((prev) => {
					return prev.filter((item) => item.idvalidades !== id);
				});

				callbackSucesso();
			} else {
				addToast(data.message, 'error');
			}
		} catch (error) {
			console.error(error);
			addToast('Erro ao deletar', 'error');
		} finally {
			setLoadingButtons(false);
		}
	};

	const fetchAddCodeEanPlu = async (
		e: React.FormEvent,
		callbackSucesso: () => void,
	) => {
		e.preventDefault();

		const formData = new FormData(e.target as HTMLFormElement);
		const produto = formData.get('produto') as string;
		const marca = (formData.get('marca') as string).trimEnd();
		const codigoProduto = formData.get('codigoProduto') as string;
		const codigoInterno = formData.get('codigoInterno') as string;

		const novoProduto = {
			ean_produto: codigoProduto,
			plu_produto: codigoInterno,
			descricao_produto: produto, // Atenção ao "ca" extra se houver no banco
			marca_produto: marca,
		};

		try {
			setLoadingButtons(true);

			const response = await fetch(`${acesso_validades}/eanplu`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(novoProduto),
			});

			const data = await response.json();

			if (response.ok) {
				// Aqui você trata as duas possibilidades do INSERT IGNORE
				if (data.message.exists) {
					addToast(data.message, 'error');
				} else {
					addToast(data.message, 'success');
				}
				callbackSucesso();
			} else {
				addToast('Erro ao salvar: ', 'error');
			}
		} catch (error) {
			console.error('Falha na requisição:', error);
		} finally {
			setLoadingButtons(false);
		}
	};

	const contextValues: ValuesInterface = {
		fetchValidades,
		fetchAddValidade,
		fetchEditarValidade,
		fetchDeletarValidade,
		formatarDataParaMySQL,
		calcularDiasRestantes,
		ValidadeVerificada,
		ValidadeFinalizada,
		ProdutoEmRebaixa,
		fetchAddCodeEanPlu,
		produtosValidades,
		marcasProdutos,
		// validadesSeparadas,
		dataFimIntervalo,
		loading,
		produtosExibidos: dadosParaExibir,
		setFiltroAtivo,
		nomeProduto,
		setNomeProduto,
		loadingButtons,
		listaBruta,
	};

	return (
		<ValidadesContexto.Provider value={contextValues}>
			{children}
		</ValidadesContexto.Provider>
	);
}

export const useValidades = () => {
	const context = useContext(ValidadesContexto);
	if (context === undefined) {
		throw new Error('Deve ser usado dentro do validadesContexto.');
	}
	return context;
};
