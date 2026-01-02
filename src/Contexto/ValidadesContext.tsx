import React, { useContext, createContext, useState } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './Toast';
import _ from 'lodash';
import { ptBR } from 'date-fns/locale';
import { differenceInDays, format, isAfter } from 'date-fns';
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
		callbackSucesso: () => void
	) => Promise<void>;
	fetchEditarValidade: (
		e: React.FormEvent,
		callbackSucesso: () => void
	) => Promise<void>;
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
		finalizado: number
	) => React.JSX.Element;
	produtosValidades: Record<string, ValidadeProduto[]>;
	marcasProdutos: MarcaProdutoInterface[];
	loading: boolean;
	dataFimIntervalo: string | 'Indefinido';
	// isModalOpen: boolean;
	// isModalEditOpen: boolean;
	// setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
	// setIsModalEditOpen: React.Dispatch<React.SetStateAction<boolean>>;
	// buscar: string;
	// setBuscar: React.Dispatch<React.SetStateAction<string>>;
	// limitaTexto: (texto: string, quantidade?: number) => React.JSX.Element;
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
	rebaixa: number;
	data_rebaixa: string;
	tipoquantidade: string;
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

const acesso_validades = process.env.NEXT_PUBLIC_VALIDADES_API;

const ValidadesContexto = createContext<ValuesInterface | undefined>(undefined);

export default function ValidadesProvider({ children }: ProviderProps) {
	const [produtosValidades, setProdutosValidades] = useState<
		Record<string, ValidadeProduto[]>
	>({});

	const [dataFimIntervalo, setdataFimIntervalo] = useState<string>('');

	const [marcasProdutos, setmarcasProdutos] = useState<MarcaProdutoInterface[]>(
		[]
	);

	const [loading, setLoading] = useState(false);
	// const [isModalOpen, setIsModalOpen] = useState(false);
	// const [isModalEditOpen, setIsModalEditOpen] = useState(false);

	const { user, logout } = useAuth();
	const { addToast } = useToast();

	const dataAtual = new Date();

	const fetchValidades = async (produtoMarca: string = '') => {
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
				}
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

				// Mantendo sua lógica de agrupamento com lodash (_)
				const agrupamentoValidadePorMarcaProduto = _.groupBy(
					data.dados,
					'marca_produto'
				);

				setProdutosValidades(agrupamentoValidadePorMarcaProduto);

				// Formatação do intervalo (Ex: "Janeiro/2026")
				if (data.dataFimIntervalo) {
					setdataFimIntervalo(
						format(new Date(data.dataFimIntervalo), 'MMMM/yyyy', {
							locale: ptBR,
						})
					);
				}
			} else {
				// Se for o caso de 'Nenhuma validade encontrada' (status 200 ou 404)
				setProdutosValidades({});
				if (data.marcas) setmarcasProdutos(data.marcas);
			}
		} catch (error: any) {
			console.error('Fetch error:', error);
			// addToast('Erro ao carregar dados', 'error');
		} finally {
			setLoading(false);
		}
	};

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

	const fetchAddValidade = async (
		e: React.FormEvent,
		callbackSucesso: () => void
	) => {
		e.preventDefault();
		setLoading(true);

		const formData = new FormData(e.target as HTMLFormElement);
		const produto = formData.get('produto') as string;
		const validade = formData.get('validade') as string;
		const quantidade = formData.get('quantidade') as string;
		const marca = formData.get('marca') as string;
		const tipoQuantidade = formData.get('tipoquantidade') as string;

		const quantidadeDesc = `${quantidade} ${tipoQuantidade}`;

		try {
			// Aponta para a nova rota da API no Next.js
			const response = await fetch('/api/validades/adicionar', {
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
					// Mantemos sua função de formatar data para o MySQL
					data_inserido: formatarDataParaMySQL(new Date()),
				}),
				credentials: 'include',
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
				// Atualiza a lista após inserir
				await fetchValidades();
				// Executa o callback (geralmente fechar o modal ou limpar form)
				callbackSucesso();
			} else {
				addToast(data.message || 'Erro ao cadastrar', data.status || 'error');
			}
		} catch (error) {
			console.error('Fetch error:', error);
			addToast(
				'Erro ao conectar com o servidor. Verifique sua conexão.',
				'error'
			);
		} finally {
			setLoading(false);
		}
	};
	const fetchEditarValidade = async (
		e: React.FormEvent,
		callbackSucesso: () => void
	) => {
		e.preventDefault();

		setLoading(true);

		//console.log('Tentando adicionar validade');

		const formData = new FormData(e.target as HTMLFormElement);
		const id_validade = formData.get('id_validade') as string;
		const produto = formData.get('produto') as string;
		const validade = formData.get('validade') as string;
		const quantidade = formData.get('quantidade_produto') as string;
		const marca = formData.get('marca') as string;
		const tipoQuantidade = formData.get('tipoquantidade') as string;

		const quantidadeDesc = `${quantidade} ${tipoQuantidade}`;

		const verificado = formData.get('verificado') ? 1 : 0;
		const finalizado = formData.get('finalizado') ? 1 : 0;
		const rebaixa = formData.get('rebaixa') ? 1 : 0;

		try {
			const response = await fetch(`${acesso_validades}?editarValidade=true`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					id_validade,
					produto,
					marca,
					validade,
					quantidadeDesc,
					responsavel: user?.usuario,
					id_responsavel: user?.uid,
					//data_inserido: formatarDataParaMySQL(new Date()),
					verificado: verificado,
					data_verificado: verificado
						? formatarDataParaMySQL(new Date())
						: null,
					finalizado: finalizado,
					data_finalizado: finalizado
						? formatarDataParaMySQL(new Date())
						: null,
					rebaixa: rebaixa,
					data_rebaixa: rebaixa ? formatarDataParaMySQL(new Date()) : null,
				}),
				credentials: 'include',
			});

			const data = await response.json();

			//console.log('Adicionada validade', data);

			if (data?.auth === false) {
				setLoading(false); // Desativa o loading antes de sair
				logout();
				return;
			}

			if (data && data.status === 'success') {
				addToast(data.message, data.status);
				fetchValidades(); // Recarrega as validades após adicionar

				//console.log('OK foi!', data);
			} else {
				addToast(data.message, data.status);
			}
		} catch (error) {
			console.error('Fetch error:', error);
			addToast('Erro ao adicionar validade. Tente novamente.', 'error');
		}

		callbackSucesso();
		//setIsModalEditOpen(false);
		setLoading(false);
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
					title={'Aguardando rebaixe...'}
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
		finalizado: number
	): React.JSX.Element => {
		const dataExpiracao = new Date(dataDeValidade);
		//const dataAtual = new Date();

		if (finalizado) {
			return <div>Finalizado</div>;
		} else {
			if (isAfter(dataAtual, dataExpiracao)) {
				return <div>Vencido</div>;
			}
		}

		const diasRestantes = differenceInDays(dataExpiracao, dataAtual);
		//const venceDiatal = addDays(dataAtual, diasRestantes);
		const dataFormatada = format(dataDeValidade, 'EEEE (dd/MM)', {
			locale: ptBR,
		});

		if (diasRestantes === 0) {
			return <div>Hoje</div>;
		}

		return (
			<div
				aria-label={dataFormatada}
				data-balloon-pos='up'
				className='toogleDescription'>
				{diasRestantes} dias
			</div>
		);
	};

	const contextValues: ValuesInterface = {
		fetchValidades,
		fetchAddValidade,
		fetchEditarValidade,
		formatarDataParaMySQL,
		calcularDiasRestantes,
		ValidadeVerificada,
		ValidadeFinalizada,
		ProdutoEmRebaixa,
		produtosValidades,
		marcasProdutos,
		dataFimIntervalo,
		loading,
		// isModalOpen,
		// isModalEditOpen,
		// setIsModalOpen,
		// setIsModalEditOpen,
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
