import React, {
	useContext,
	createContext,
	useState,
	useMemo,
	useCallback,
	useEffect,
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
import { IoCheckmarkDoneOutline } from 'react-icons/io5';

import useSWR from 'swr';

export interface ProviderProps {
	children: React.ReactNode;
}

export interface ValuesInterface {
	// fetchValidades: (produtoMarca?: string) => Promise<void>;
	fetchHistorico: () => Promise<void>;
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
	//produtosValidades: Record<string, ValidadeProduto[]>;
	produtosExibidos: Record<string, ValidadeProduto[]>;
	setFiltroAtivo: (filtro: string) => void;
	marcasProdutos: Record<string, MarcaProdutoInterface[]>;
	validadesSeparadas: {
		pendentes: Record<string, ValidadeProduto[]>;
		finalizados: Record<string, ValidadeProduto[]>;
	} | null; // Começa como null enquanto o fetch não termina
	loading: boolean;
	loadingButtons: boolean;
	dataFimIntervalo: string | 'Indefinido';
	nomeProduto: string;
	setNomeProduto: (nome: string) => void;
	listaBruta: ValidadeProduto[];
	//isLoading: boolean; // Adicione isso SWR
	isValidating: boolean; // Adicione isso SWR
	//mutate: () => Promise<any>;
	obterStatusClasse: (dataDeValidade: string, finalizado: number) => string;
	mutate: (data?: any, opts?: any) => Promise<any>;
	filtroAtivo: string;
	listaHistorico: ValidadeProduto[];
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
	idRelacionado?: number | null;
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
	// const [produtosValidades, setProdutosValidades] = useState<
	// 	Record<string, ValidadeProduto[]>
	// >({});

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
	const [listaHistorico, setListaHistorico] = useState<ValidadeProduto[]>([]);
	const [historicoLoading, setHistoricoLoading] = useState(false);

	const { user, logout } = useAuth();
	const { addToast } = useToast();

	const validadesSeparadas = useMemo(() => {
		const listaOrdenada = _.sortBy(listaBruta, ['validade']);
		const [finalizados, pendentes] = _.partition(listaOrdenada, {
			finalizado: 1,
		});

		return {
			finalizados: _.groupBy(finalizados, 'validadeDiaMes'),
			pendentes: _.groupBy(pendentes, 'validadeDiaMes'),
		};
	}, [listaBruta]);

	const fetcher = (url: string) =>
		fetch(url, { credentials: 'include' }).then((res) => res.json());

	const {
		data,
		error,
		mutate,
		isValidating,
		isLoading: swrLoading,
	} = useSWR(`${acesso_validades}/listar`, fetcher, {
		refreshInterval: 30000, // DESLIGA o polling (zero tráfego automático)
		revalidateOnFocus: false, // SÓ atualiza se você mudar de app e voltar (útil no mercado)
		revalidateOnReconnect: true, // SÓ baixa se a internet caiu e voltou
		revalidateOnMount: true, // Garante que carrega ao abrir o app
		revalidateIfStale: true, // Garante que carrega se o SWR estiver desatualizado
		dedupingInterval: 10000, // Se houver 2 chamadas em 10s, ele só faz a primeira
	});

	const hoje = new Date();
	const dataFim = new Date(hoje.getFullYear(), hoje.getMonth() + 2, 0);
	const dataFimIntervaloFormatada = dataFim.toISOString();

	useEffect(() => {
		// 1. Verificamos se o SWR já trouxe os dados e se o formato está correto
		if (data && Array.isArray(data.dados)) {
			setListaBruta(data.dados);

			// Cálculo do intervalo movido para cá para evitar processamento a cada render
			const hoje = new Date();
			const dataFim = new Date(hoje.getFullYear(), hoje.getMonth() + 2, 0);
			setdataFimIntervalo(format(dataFim, 'MMMM/yyyy', { locale: ptBR }));
		}
	}, [data]);

	const fetchHistorico = async () => {
		setHistoricoLoading(true);
		try {
			// 1. Busca os dados na nova rota do histórico (os 30 dias que conversamos)
			const response = await fetch(`${acesso_validades}/historico`, {
				method: 'GET',
				credentials: 'include',
			});

			const data = await response.json();

			if (data && Array.isArray(data.dados)) {
				setListaHistorico(data.dados);
				setFiltroAtivo('finalizado');
				//setdataFimIntervalo('Histórico 30 dias');
			}
		} catch (error) {
			console.error(error);
		} finally {
			setHistoricoLoading(false);
		}
	};

	const atualizarDadosAtuais = async () => {
		if (filtroAtivo === 'finalizado') {
			await fetchHistorico();
		} else {
			await mutate();
		}
	};

	const dadosParaExibir = useMemo(() => {
		const produtosAlvo =
			filtroAtivo === 'finalizado' ? listaHistorico : listaBruta;

		if (!produtosAlvo || produtosAlvo.length === 0) return {};

		const hoje = startOfDay(new Date());
		const limite5Dias = new Date();
		limite5Dias.setDate(hoje.getDate() + 5);

		const novoObjetoFiltrado: Record<string, ValidadeProduto[]> = {};

		produtosAlvo.forEach((item) => {
			const buscaMinuscula = nomeProduto.toLowerCase().trim();
			const matchesNome = nomeProduto
				? item.produto?.toLowerCase().includes(buscaMinuscula) ||
					String(item.codigoInterno).includes(buscaMinuscula) ||
					String(item.codigoProduto).includes(buscaMinuscula)
				: true;

			let matchesFiltro = matchesNome;
			if (filtroAtivo === 'vencendo') {
				if (!item.validade) return;
				const dataVal = parseISO(item.validade.split('T')[0]);
				matchesFiltro = dataVal <= limite5Dias && matchesNome;
			}

			if (matchesFiltro) {
				const dataChave = item.validadeDiaMes || item.validade.split('T')[0];
				if (!novoObjetoFiltrado[dataChave]) {
					novoObjetoFiltrado[dataChave] = [];
				}
				novoObjetoFiltrado[dataChave].push(item);
			}
		});

		return novoObjetoFiltrado;
	}, [listaBruta, listaHistorico, filtroAtivo, nomeProduto]);

	// const dadosParaExibir = useMemo(() => {
	// 	// 1. Escolhe a lista bruta correta dependendo do botão ativo
	// 	const produtosAlvo =
	// 		filtroAtivo === 'finalizado' ? listaHistorico : listaBruta;

	// 	if (!produtosAlvo || produtosAlvo.length === 0) {
	// 		return {};
	// 	}

	// 	const hoje = startOfDay(new Date());
	// 	const limite5Dias = new Date();
	// 	limite5Dias.setDate(hoje.getDate() + 5);

	// 	const novoObjetoFiltrado: Record<string, ValidadeProduto[]> = {};

	// 	// 2. Passa o pente fino e agrupa por data ao mesmo tempo!
	// 	produtosAlvo.forEach((item) => {
	// 		// Filtro 1: Nome/Código
	// 		const matchesNome = nomeProduto
	// 			? item.produto?.toLowerCase().includes(nomeProduto.toLowerCase()) ||
	// 				String(item.codigoInterno).includes(nomeProduto.trim()) ||
	// 				String(item.codigoProduto).includes(nomeProduto.trim())
	// 			: true;

	// 		// Filtro 2: Vencendo
	// 		let matchesFiltro = matchesNome;
	// 		if (filtroAtivo === 'vencendo') {
	// 			if (!item.validade) return;
	// 			const dataVal = parseISO(item.validade.split('T')[0]);
	// 			const estaPertoDeVencer = dataVal <= limite5Dias;
	// 			matchesFiltro = estaPertoDeVencer && matchesNome;
	// 		}

	// 		// 3. Se passou nos filtros, agrupa na chave da data correspondente
	// 		if (matchesFiltro) {
	// 			// Use a chave de data que você usa no layout (ex: item.validadeDiaMes ou item.validade)
	// 			const dataChave = item.validadeDiaMes || item.validade.split('T')[0];

	// 			if (!novoObjetoFiltrado[dataChave]) {
	// 				novoObjetoFiltrado[dataChave] = [];
	// 			}
	// 			novoObjetoFiltrado[dataChave].push(item);
	// 		}
	// 	});

	// 	return novoObjetoFiltrado;
	// }, [listaBruta, listaHistorico, filtroAtivo, nomeProduto]);

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
			const quantidade = formData.get('quantidade_produto') as string;
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
						//id_responsavel: user?.uid,
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
					await atualizarDadosAtuais();
					addToast(data.message, data.status);
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
		[user, acesso_validades, mutate],
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
			//id_responsavel: user?.uid ? Number(user.uid) : null,
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
				await atualizarDadosAtuais();

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
				await atualizarDadosAtuais();
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

	const ValidadeVerificada = (props: {
		verificado: number;
		dataInserida: string;
	}) => {
		return (
			<IoCheckmarkDoneOutline
				size={20}
				color={props.verificado ? '#4CAF50' : '#aaa'}
				title={props.verificado ? props.dataInserida : 'Aguardando aprovação.'}
			/>
		);
	};

	const ProdutoEmRebaixa = (props: {
		Rebaixa: number;
		dataRebaixa: string;
	}) => {
		return (
			<IoMdTrendingDown
				size={20}
				color={props.Rebaixa ? '#4CAF50' : '#aaa'}
				title={props.Rebaixa ? props.dataRebaixa : 'Aguardando rebaixa...'}
			/>
		);
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
						color={'#4CAF50'}
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
			return <div className='texto-status'>Finalizado</div>;
		}

		// Se a data de hoje passou da expiração
		if (isAfter(dataAtual, dataExpiracao)) {
			return <div className='texto-status'>Vencido</div>;
		}

		const diasRestantes = differenceInDays(dataExpiracao, dataAtual);
		const dataFormatada = format(dataExpiracao, 'EEEE (dd/MM)', {
			locale: ptBR,
		});

		if (diasRestantes === 0) {
			return <div className='texto-status'>Hoje</div>;
		}

		if (diasRestantes > 0 && diasRestantes <= 5) {
			return (
				<div aria-label={dataFormatada} className='texto-status'>
					{diasRestantes} dia(s)
				</div>
			);
		}

		// Caso padrão (mais de 5 dias)
		return (
			<div
				aria-label={dataFormatada}
				className='texto-status toogleDescription'>
				{diasRestantes} dia(s)
			</div>
		);
	};

	const obterStatusClasse = (
		dataDeValidade: string,
		finalizado: number,
	): string => {
		if (finalizado) return 'finalizado';

		const dataExpiracao = parseISO(dataDeValidade.split('T')[0]);
		const dataAtual = startOfDay(new Date());

		if (isAfter(dataAtual, dataExpiracao)) return 'vencido';

		const diasRestantes = differenceInDays(dataExpiracao, dataAtual);

		if (diasRestantes === 0) return 'hoje';
		if (diasRestantes <= 5) return 'critico';

		return 'normal';
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
			//console.log(data);

			if (response.ok) {
				addToast(data.message, 'info');
				if (!data.exists) callbackSucesso();
			} else {
				addToast(data.error, 'error');
			}
		} catch (error) {
			console.error('Falha na requisição:', error);
		} finally {
			setLoadingButtons(false);
		}
	};

	const contextValues: ValuesInterface = {
		fetchHistorico,
		fetchAddValidade,
		fetchEditarValidade,
		fetchDeletarValidade,
		formatarDataParaMySQL,
		calcularDiasRestantes,
		ValidadeVerificada,
		ValidadeFinalizada,
		ProdutoEmRebaixa,
		fetchAddCodeEanPlu,
		//produtosValidades,
		marcasProdutos,
		validadesSeparadas,
		dataFimIntervalo,
		loading:
			historicoLoading ||
			swrLoading ||
			(!!data?.dados?.length && listaBruta.length === 0), //ja recebe o loading do swr
		produtosExibidos: dadosParaExibir,
		setFiltroAtivo,
		nomeProduto,
		setNomeProduto,
		loadingButtons,
		listaBruta, // <--- Exportar aqui swr
		isValidating, // <--- Exportar aqui swr
		obterStatusClasse,
		mutate,
		filtroAtivo,
		listaHistorico,
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
